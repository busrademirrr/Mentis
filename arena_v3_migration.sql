-- MENTIS ARENA V3 - PRODUCTION MIGRATION SCRIPT

-- 0. CLEANUP OLD ARENA TABLES (Starting fresh for V3)
DROP TABLE IF EXISTS arena_answers CASCADE;
DROP TABLE IF EXISTS arena_questions CASCADE;
DROP TABLE IF EXISTS arena_matches CASCADE;
DROP TABLE IF EXISTS arena_queue CASCADE;
DROP TABLE IF EXISTS arena_bots CASCADE;
DROP TABLE IF EXISTS arena_rankings CASCADE;
-- 1. ADD ARENA STATS TO PROFILES
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS arena_elo INT DEFAULT 1200,
ADD COLUMN IF NOT EXISTS arena_wins INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS arena_losses INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS arena_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS arena_league TEXT DEFAULT 'Bronze';

-- 2. ARENA QUEUE
CREATE TABLE IF NOT EXISTS arena_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    elo INT NOT NULL DEFAULT 1200,
    status TEXT NOT NULL DEFAULT 'searching', -- 'searching', 'matched', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ARENA MATCHES
CREATE TABLE IF NOT EXISTS arena_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    player2_id UUID, -- Can be a profile ID or a Bot ID
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'starting', -- 'starting', 'playing', 'finished', 'cancelled'
    winner_id UUID,
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ARENA QUESTIONS
CREATE TABLE IF NOT EXISTS arena_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option INT NOT NULL,
    difficulty TEXT DEFAULT 'medium'
);

-- 5. ARENA ANSWERS
CREATE TABLE IF NOT EXISTS arena_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES arena_matches(id) ON DELETE CASCADE,
    user_id UUID,
    question_id UUID REFERENCES arena_questions(id) ON DELETE CASCADE,
    answer INT NOT NULL,
    answer_time_ms INT NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ARENA BOTS
CREATE TABLE IF NOT EXISTS arena_bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_name TEXT NOT NULL,
    avatar_url TEXT,
    elo INT NOT NULL DEFAULT 1200,
    category TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE
);

-- 7. ENABLE REALTIME
-- Drop existing publications if they exist to avoid errors, then add them.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE arena_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE arena_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE arena_answers;

-- 8. RLS POLICIES
ALTER TABLE arena_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all queues" ON arena_queue FOR SELECT USING (true);
CREATE POLICY "Users can insert their own queue" ON arena_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own queue" ON arena_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own queue" ON arena_queue FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all matches" ON arena_matches FOR SELECT USING (true);
CREATE POLICY "Users can insert matches" ON arena_matches FOR INSERT WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Users can update their matches" ON arena_matches FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Anyone can view questions" ON arena_questions FOR SELECT USING (true);

CREATE POLICY "Users can view all answers" ON arena_answers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own answers" ON arena_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view bots" ON arena_bots FOR SELECT USING (true);

-- 9. SEED BOTS
INSERT INTO arena_bots (bot_name, avatar_url, elo, category, difficulty, is_active) VALUES
('Socrates', 'https://api.dicebear.com/7.x/bottts/svg?seed=Socrates', 1800, 'Felsefe Ligi', 'hard', true),
('Plato', 'https://api.dicebear.com/7.x/bottts/svg?seed=Plato', 1600, 'Felsefe Ligi', 'medium', true),
('Aristotle', 'https://api.dicebear.com/7.x/bottts/svg?seed=Aristotle', 1900, 'Felsefe Ligi', 'hard', true),
('Ibn Sina', 'https://api.dicebear.com/7.x/bottts/svg?seed=IbnSina', 1750, 'Bilim Ligi', 'hard', true),
('Homer', 'https://api.dicebear.com/7.x/bottts/svg?seed=Homer', 1400, 'Edebiyat Düellosu', 'medium', true),
('Shakespeare', 'https://api.dicebear.com/7.x/bottts/svg?seed=Shakespeare', 1850, 'Edebiyat Düellosu', 'hard', true),
('Herodotus', 'https://api.dicebear.com/7.x/bottts/svg?seed=Herodotus', 1500, 'Tarih Meydanı', 'medium', true),
('Leonardo', 'https://api.dicebear.com/7.x/bottts/svg?seed=Leonardo', 1700, 'Sanat Arenası', 'medium', true);

-- 10. SEED QUESTIONS
INSERT INTO arena_questions (category, question_text, options, correct_option, difficulty) VALUES
('Felsefe Ligi', 'Kim "Düşünüyorum, öyleyse varım" (Cogito, ergo sum) demiştir?', '["Immanuel Kant", "Rene Descartes", "Sokrates", "Friedrich Nietzsche"]', 1, 'easy'),
('Felsefe Ligi', 'Aşağıdakilerden hangisi Stoacılık felsefesinin önemli temsilcilerinden biridir?', '["Marcus Aurelius", "Karl Marx", "Jean-Paul Sartre", "Platon"]', 0, 'medium'),
('Tarih Meydanı', 'İstanbul hangi yılda fethedilmiştir?', '["1453", "1071", "1299", "1517"]', 0, 'easy'),
('Edebiyat Düellosu', '"Suç ve Ceza" adlı romanın baş karakteri kimdir?', '["Raskolnikov", "Ivan Karamazov", "Mişkin", "Stavrogin"]', 0, 'medium'),
('Sanat Arenası', 'Mona Lisa tablosu hangi müzede sergilenmektedir?', '["British Museum", "Louvre Müzesi", "Uffizi Galerisi", "Prado Müzesi"]', 1, 'easy');
