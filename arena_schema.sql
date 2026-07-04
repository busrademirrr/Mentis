-- Supabase Schema for Mentis Arena System (Production Grade)

-- 0. Drop old tables safely (Warning: This deletes existing dummy arena data!)
DROP TABLE IF EXISTS public.match_answers CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.match_queue CASCADE;
DROP TABLE IF EXISTS public.arena_questions CASCADE;

-- 1. Arena Questions Table
CREATE TABLE public.arena_questions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  category text NOT NULL,
  difficulty integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Matchmaking Queue Table
CREATE TABLE public.match_queue (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  category text NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched')),
  matched_with uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Matches Table (Cleaned up, no duplicate user info)
CREATE TABLE public.matches (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  player1_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  player2_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('waiting', 'matched', 'playing', 'finished', 'cancelled', 'forfeit')),
  category text NOT NULL,
  current_question_index integer DEFAULT 0,
  player1_score integer DEFAULT 0,
  player2_score integer DEFAULT 0,
  winner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Match Answers Table (question_id is now UUID)
CREATE TABLE public.match_answers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.arena_questions(id) ON DELETE CASCADE NOT NULL,
  answer integer NOT NULL,
  is_correct boolean NOT NULL,
  time_taken integer NOT NULL,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(match_id, user_id, question_id)
);

-- 5. Indexes for Performance
CREATE INDEX idx_matches_players ON public.matches(player1_id, player2_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_match_queue_waiting ON public.match_queue(category) WHERE status = 'waiting';
CREATE INDEX idx_match_answers_match ON public.match_answers(match_id);

-- 6. Atomic Matchmaking RPC Function
-- This function securely finds an opponent or places the user in the queue
CREATE OR REPLACE FUNCTION matchmake_user(p_user_id uuid, p_category text)
RETURNS uuid AS $$
DECLARE
  v_opponent_id uuid;
  v_match_id uuid;
BEGIN
  -- 1. Try to find a waiting opponent and lock the row
  SELECT user_id INTO v_opponent_id
  FROM public.match_queue
  WHERE category = p_category
    AND status = 'waiting'
    AND user_id != p_user_id
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_opponent_id IS NOT NULL THEN
    -- Opponent found! Create a match.
    INSERT INTO public.matches (player1_id, player2_id, status, category, started_at)
    VALUES (v_opponent_id, p_user_id, 'matched', p_category, now())
    RETURNING id INTO v_match_id;

    -- Update opponent's queue status to matched
    UPDATE public.match_queue 
    SET status = 'matched', matched_with = p_user_id 
    WHERE user_id = v_opponent_id;
    
    -- Also insert/update current user in queue as matched
    INSERT INTO public.match_queue (user_id, category, status, matched_with)
    VALUES (p_user_id, p_category, 'matched', v_opponent_id)
    ON CONFLICT (user_id) DO UPDATE 
    SET status = 'matched', matched_with = v_opponent_id, category = p_category;

    RETURN v_match_id;
  ELSE
    -- No opponent found. Enter the queue as waiting.
    INSERT INTO public.match_queue (user_id, category, status)
    VALUES (p_user_id, p_category, 'waiting')
    ON CONFLICT (user_id) DO UPDATE 
    SET status = 'waiting', matched_with = NULL, category = p_category;
    
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security (RLS)
ALTER TABLE public.arena_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_answers ENABLE ROW LEVEL SECURITY;

-- Questions: Everyone can read
CREATE POLICY "Public read questions" ON public.arena_questions FOR SELECT USING (true);

-- Match Queue: Users can only see themselves and update themselves
CREATE POLICY "Users can read own queue" ON public.match_queue FOR SELECT USING (true);
CREATE POLICY "Users can insert own queue" ON public.match_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own queue" ON public.match_queue FOR UPDATE USING (true);
CREATE POLICY "Users can delete own queue" ON public.match_queue FOR DELETE USING (true);

-- Matches: Users can only read/update matches they belong to
CREATE POLICY "Users can read own matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Users can update own matches" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Users can insert matches" ON public.matches FOR INSERT WITH CHECK (true);

-- Match Answers: Users can read answers for their matches, but only insert their own
CREATE POLICY "Users can read match answers" ON public.match_answers FOR SELECT USING (true);
CREATE POLICY "Users can insert own answers" ON public.match_answers FOR INSERT WITH CHECK (true);

-- 8. Score Increment RPC
CREATE OR REPLACE FUNCTION increment_match_score(p_match_id uuid, p_is_player1 boolean, p_points integer)
RETURNS void AS $$
BEGIN
  IF p_is_player1 THEN
    UPDATE public.matches SET player1_score = player1_score + p_points WHERE id = p_match_id;
  ELSE
    UPDATE public.matches SET player2_score = player2_score + p_points WHERE id = p_match_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Seed Dummy Questions
INSERT INTO public.arena_questions (question, options, correct_answer, category, difficulty) VALUES
('Felsefe kelimesinin kelime anlamı nedir?', '["Bilgelik Sevgisi", "Doğru Düşünme", "Mantık Bilimi", "Evrensel Uyum"]', 0, 'Felsefe', 1),
('Platon''un en bilinen eseri hangisidir?', '["Metafizik", "Devlet", "Poetika", "Etik"]', 1, 'Felsefe', 1),
('Hangisi bir Stoacı filozoftur?', '["Epiküros", "Seneca", "Aristoteles", "Sokrates"]', 1, 'Felsefe', 2),
('"Düşünüyorum, öyleyse varım" sözü kime aittir?', '["Kant", "Hegel", "Descartes", "Spinoza"]', 2, 'Felsefe', 1),
('Nietzsche''nin "Üstinsan" kavramı hangi kitapta geçer?', '["Böyle Buyurdu Zerdüşt", "İyinin ve Kötünün Ötesinde", "Deccal", "Putların Alacakaranlığı"]', 0, 'Felsefe', 2);
