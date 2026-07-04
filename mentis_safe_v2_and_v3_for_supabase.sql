-- V2 SCHEMA (SAFE)
-- ==========================================
-- 2. CORE TABLES DEFINITION
-- ==========================================


CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  content_count INTEGER DEFAULT 0,
  arena_wins INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'save')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id, type)
);

CREATE TABLE IF NOT EXISTS debate_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS debate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS arena_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL
);

CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'matched', 'cancelled')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished', 'forfeit')) DEFAULT 'waiting',
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES arena_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'match', 'system', 'follow')) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_entity_id UUID, 
  sender_ids UUID[] DEFAULT '{}', 
  count INTEGER DEFAULT 1,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- e.g., 'arena_wins', 'level', 'followers'
  requirement_value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('post', 'save', 'debate_win', 'arena_win', 'badge_earn', 'debate_join', 'follow')) NOT NULL,
  entity_id UUID NOT NULL, -- references post_id, match_id, user_id (for follow) or badge_id
  metadata JSONB DEFAULT '{}', -- lightweight snapshot for fast feed rendering
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_post ON post_interactions(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_debate_votes_post ON debate_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_debate ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_matches_players_status ON matches(player1_id, player2_id, status);
CREATE INDEX IF NOT EXISTS idx_match_answers_match_id ON match_answers(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_user_activity_user_time ON user_activity(user_id, created_at DESC);

-- ==========================================
-- 4. TRIGGERS & INTERNAL LOGIC
-- ==========================================

-- Trigger: New Auth User Creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, avatar_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)), 
    NEW.raw_user_meta_data->>'full_name', 
    'preset'
  );

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Internal XP Function with Rate Limit Logic
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_action TEXT, p_amount INTEGER, p_daily_limit INTEGER)
RETURNS VOID AS $$
DECLARE
  v_today_xp INTEGER;
BEGIN
  -- Calculate XP earned today for this action
  SELECT COALESCE(SUM(amount), 0) INTO v_today_xp
  FROM xp_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at >= date_trunc('day', now());

  IF v_today_xp + p_amount <= p_daily_limit THEN
    -- Insert log
    INSERT INTO xp_logs (user_id, action, amount) VALUES (p_user_id, p_action, p_amount);
    
    -- Update user XP
    UPDATE users SET xp = xp + p_amount WHERE id = p_user_id;
    
    -- Level up logic (Level = 1 + XP / 100)
    UPDATE users SET level = (xp / 100) + 1 WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Internal Aggregated Notification Function
CREATE OR REPLACE FUNCTION notify_aggregated_like(p_post_id UUID, p_liker_id UUID)
RETURNS VOID AS $$
DECLARE
  v_author_id UUID;
  v_notif_id UUID;
  v_sender_ids UUID[];
  v_liker_name TEXT;
  v_count INTEGER;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = p_post_id;
  
  -- Don't notify self
  IF v_author_id = p_liker_id THEN RETURN; END IF;

  SELECT username INTO v_liker_name FROM users WHERE id = p_liker_id;

  -- Find existing unread like notification for this post
  SELECT id, sender_ids, count INTO v_notif_id, v_sender_ids, v_count
  FROM notifications
  WHERE user_id = v_author_id AND type = 'like' AND related_entity_id = p_post_id AND is_read = false
  LIMIT 1;

  IF v_notif_id IS NOT NULL THEN
    -- Aggregation
    IF NOT p_liker_id = ANY(v_sender_ids) THEN
      UPDATE notifications 
      SET count = count + 1,
          sender_ids = array_append(sender_ids, p_liker_id),
          body = v_liker_name || ' ve ' || (count) || ' kişi postunu beğendi',
          updated_at = now()
      WHERE id = v_notif_id;
    END IF;
  ELSE
    -- New notification
    INSERT INTO notifications (user_id, type, title, body, related_entity_id, sender_ids, count)
    VALUES (v_author_id, 'like', 'Yeni Beğeni', v_liker_name || ' postunu beğendi', p_post_id, ARRAY[p_liker_id], 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Arena Win XP
CREATE OR REPLACE FUNCTION handle_match_finished()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
    IF NEW.winner_id IS NOT NULL THEN
      -- Award 50 XP, max 500 XP per day
      PERFORM award_xp(NEW.winner_id, 'arena_win', 50, 500);
      -- Update win stats
      UPDATE user_stats SET arena_wins = arena_wins + 1 WHERE user_id = NEW.winner_id;
      -- Log activity
      INSERT INTO user_activity (user_id, type, entity_id) VALUES (NEW.winner_id, 'arena_win', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_match_finished
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION handle_match_finished();

-- Trigger: Generic User Activity Logger
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    INSERT INTO user_activity (user_id, type, entity_id) VALUES (NEW.author_id, 'post', NEW.id);
  ELSIF TG_TABLE_NAME = 'post_interactions' AND NEW.type = 'save' THEN
    INSERT INTO user_activity (user_id, type, entity_id) VALUES (NEW.user_id, 'save', NEW.post_id);
  ELSIF TG_TABLE_NAME = 'user_badges' THEN
    INSERT INTO user_activity (user_id, type, entity_id) VALUES (NEW.user_id, 'badge_earn', NEW.badge_id);
  ELSIF TG_TABLE_NAME = 'room_members' THEN
    INSERT INTO user_activity (user_id, type, entity_id) VALUES (NEW.user_id, 'debate_join', NEW.room_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_activity_post AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION log_user_activity();
CREATE TRIGGER trigger_activity_save AFTER INSERT ON post_interactions FOR EACH ROW EXECUTE FUNCTION log_user_activity();
CREATE TRIGGER trigger_activity_badge AFTER INSERT ON user_badges FOR EACH ROW EXECUTE FUNCTION log_user_activity();
CREATE TRIGGER trigger_activity_debate_join AFTER INSERT ON room_members FOR EACH ROW EXECUTE FUNCTION log_user_activity();


-- ==========================================
-- 5. RPC FUNCTIONS (FRONTEND ACTIONS)
-- ==========================================

-- Create Post
CREATE OR REPLACE FUNCTION create_post(p_type TEXT, p_payload JSONB)
RETURNS UUID AS $$
DECLARE
  v_post_id UUID;
BEGIN
  INSERT INTO posts (author_id, type, payload)
  VALUES (auth.uid(), p_type, p_payload)
  RETURNING id INTO v_post_id;

  UPDATE user_stats SET content_count = content_count + 1 WHERE user_id = auth.uid();
  PERFORM award_xp(auth.uid(), 'create_post', 10, 50);

  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle Like
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID)
RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
  v_author_id UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM post_interactions WHERE user_id = auth.uid() AND post_id = p_post_id AND type = 'like') INTO v_exists;

  IF v_exists THEN
    DELETE FROM post_interactions WHERE user_id = auth.uid() AND post_id = p_post_id AND type = 'like';
  ELSE
    INSERT INTO post_interactions (user_id, post_id, type) VALUES (auth.uid(), p_post_id, 'like');
    
    SELECT author_id INTO v_author_id FROM posts WHERE id = p_post_id;
    PERFORM award_xp(v_author_id, 'receive_like', 2, 20);
    PERFORM notify_aggregated_like(p_post_id, auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle Save
CREATE OR REPLACE FUNCTION toggle_save(p_post_id UUID)
RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM post_interactions WHERE user_id = auth.uid() AND post_id = p_post_id AND type = 'save') INTO v_exists;

  IF v_exists THEN
    DELETE FROM post_interactions WHERE user_id = auth.uid() AND post_id = p_post_id AND type = 'save';
  ELSE
    INSERT INTO post_interactions (user_id, post_id, type) VALUES (auth.uid(), p_post_id, 'save');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit Debate Vote
CREATE OR REPLACE FUNCTION submit_vote(p_post_id UUID, p_selected_option TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO debate_votes (user_id, post_id, selected_option)
  VALUES (auth.uid(), p_post_id, p_selected_option)
  ON CONFLICT (user_id, post_id) DO UPDATE SET selected_option = p_selected_option;

  PERFORM award_xp(auth.uid(), 'submit_vote', 5, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit Quiz Answer
CREATE OR REPLACE FUNCTION submit_quiz(p_post_id UUID, p_selected_answer TEXT, p_is_correct BOOLEAN)
RETURNS VOID AS $$
BEGIN
  INSERT INTO quiz_answers (user_id, post_id, selected_answer, is_correct)
  VALUES (auth.uid(), p_post_id, p_selected_answer, p_is_correct)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  IF p_is_correct THEN
    PERFORM award_xp(auth.uid(), 'quiz_correct', 10, 50);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Matchmake User (Transaction Safe)
CREATE OR REPLACE FUNCTION matchmake_user(p_category TEXT)
RETURNS UUID AS $$
DECLARE
  v_opponent_id UUID;
  v_queue_id UUID;
  v_match_id UUID;
BEGIN
  -- Lock queue table row specifically for the category to prevent race conditions
  SELECT id, user_id INTO v_queue_id, v_opponent_id
  FROM match_queue
  WHERE category = p_category AND status = 'waiting' AND user_id != auth.uid()
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_opponent_id IS NOT NULL THEN
    -- Match found! Update queue status
    UPDATE match_queue SET status = 'matched' WHERE id = v_queue_id;

    -- Create new match
    INSERT INTO matches (player1_id, player2_id, status)
    VALUES (v_opponent_id, auth.uid(), 'playing')
    RETURNING id INTO v_match_id;

    RETURN v_match_id;
  ELSE
    -- Join queue if not already waiting
    IF NOT EXISTS (SELECT 1 FROM match_queue WHERE user_id = auth.uid() AND status = 'waiting') THEN
      INSERT INTO match_queue (user_id, category, status) VALUES (auth.uid(), p_category, 'waiting');
    END IF;
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit Match Answer
CREATE OR REPLACE FUNCTION submit_match_answer(p_match_id UUID, p_question_id UUID, p_answer TEXT, p_is_correct BOOLEAN, p_time_taken INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO match_answers (match_id, user_id, question_id, answer, is_correct, time_taken)
  VALUES (p_match_id, auth.uid(), p_question_id, p_answer, p_is_correct, p_time_taken);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- user_stats
CREATE POLICY "Public stats are viewable by everyone" ON user_stats FOR SELECT USING (true);

-- xp_logs (only visible to owner, or internal)
CREATE POLICY "Users can see own xp logs" ON xp_logs FOR SELECT USING (auth.uid() = user_id);

-- posts (no direct inserts, RPC only. Reads public)
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Authors can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- interactions/votes/quizzes (reads public, no direct insert/update, only owner can delete)
CREATE POLICY "Interactions viewable by everyone" ON post_interactions FOR SELECT USING (true);
CREATE POLICY "Owner can delete own interactions" ON post_interactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Votes viewable by everyone" ON debate_votes FOR SELECT USING (true);
CREATE POLICY "Answers viewable by everyone" ON quiz_answers FOR SELECT USING (true);

-- arena_questions (public read)
CREATE POLICY "Questions viewable by everyone" ON arena_questions FOR SELECT USING (true);

-- match_queue (user can see own queue status)
CREATE POLICY "Users can view own queue" ON match_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel own queue" ON match_queue FOR DELETE USING (auth.uid() = user_id);

-- matches (only players involved)
CREATE POLICY "Players can view own matches" ON matches FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Players can update own matches" ON matches FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- match_answers
CREATE POLICY "Players can view match answers" ON match_answers FOR SELECT USING (true); -- Usually fine, or restrict via match JOIN

-- notifications
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Badges and Activity
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges viewable by everyone" ON user_badges FOR SELECT USING (true);
CREATE POLICY "User activity viewable by everyone" ON user_activity FOR SELECT USING (true);
CREATE POLICY "Users delete own activity" ON user_activity FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 7. STORAGE POLICIES (AVATARS)
-- ==========================================

-- Ensure avatars bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Anyone can update their own avatar" ON storage.objects;
CREATE POLICY "Anyone can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Anyone can delete their own avatar" ON storage.objects;
CREATE POLICY "Anyone can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = owner);


-- V3 MASTER MIGRATION
-- ==========================================
-- MENTIS V3 MASTER INFRASTRUCTURE MIGRATION
-- Incorporates Followers, Messaging, Notifications, Search, and Cognitive Traits
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Required for fuzzy text search

-- 2. PRESENCE SYSTEM (ONLINE STATUS)
CREATE TABLE IF NOT EXISTS IF NOT EXISTS presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('online', 'idle', 'offline')) DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT now()
);

-- 3. FOLLOWERS SYSTEM
CREATE TABLE IF NOT EXISTS IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_followers_following ON followers(following_id);

-- 4. REALTIME MESSAGING (DM SYSTEM)
CREATE TABLE IF NOT EXISTS IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS message_reads (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- 5. NOTIFICATION SYSTEM (REDESIGNED)
-- If old notifications table exists, we drop it to apply the new schema, or alter it.
-- Assuming we alter or recreate it.
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User who triggered it
    type TEXT NOT NULL, -- 'follow', 'debate_reply', 'mention', 'dm', 'badge', 'quiz', etc.
    entity_id UUID, -- Related post, badge, message ID
    entity_type TEXT,
    title TEXT,
    body TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- 6. INTELLECTUAL ARCHIVE (COLLECTIONS)
CREATE TABLE IF NOT EXISTS IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    annotation TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(collection_id, post_id)
);

-- 7. AI COGNITIVE TRAITS
CREATE TABLE IF NOT EXISTS IF NOT EXISTS user_cognitive_traits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    traits JSONB DEFAULT '[]', 
    summary_text TEXT,
    top_categories JSONB DEFAULT '[]',
    radar_data JSONB DEFAULT '{}',
    last_analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- 8. GLOBAL SEARCH RPC FUNCTION (Full-text search using pg_trgm)
CREATE OR REPLACE FUNCTION search_mentis_ecosystem(search_query TEXT, max_limit INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'users', (
            SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb)
            FROM (
                SELECT id, username, full_name, avatar_value, level
                FROM users
                WHERE username ILIKE '%' || search_query || '%' OR full_name ILIKE '%' || search_query || '%'
                ORDER BY similarity(username, search_query) DESC, similarity(full_name, search_query) DESC
                LIMIT max_limit
            ) u
        ),
        'posts', (
            SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
            FROM (
                SELECT id, type, payload->>'title' as title, payload->>'content' as content, created_at
                FROM posts
                WHERE (payload->>'title') ILIKE '%' || search_query || '%' 
                   OR (payload->>'content') ILIKE '%' || search_query || '%'
                LIMIT max_limit
            ) p
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. TRIGGERS & LOGIC

-- Follow Stats Update & Notification
CREATE OR REPLACE FUNCTION handle_follow_stats_v3()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_stats SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
        UPDATE user_stats SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
        
        INSERT INTO notifications (user_id, actor_id, type, title, body)
        VALUES (NEW.following_id, NEW.follower_id, 'follow', 'Yeni Takipçi', 'Seni takip etmeye başladı.');
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_stats SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
        UPDATE user_stats SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_follow_stats_v3 ON followers;
CREATE TRIGGER trigger_follow_stats_v3
AFTER INSERT OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION handle_follow_stats_v3();

-- Ensure `total_reading_time_mins` on user_stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='total_reading_time_mins') THEN
        ALTER TABLE user_stats ADD COLUMN total_reading_time_mins INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enable Realtime (illustrative, needs to be done via Supabase dashboard / API generally)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- 10. ROW LEVEL SECURITY (RLS)
-- Similar logic to previous plan but expanded
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cognitive_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Security Policies omitted for brevity, but assume strict owner-only write, participant-only read.
