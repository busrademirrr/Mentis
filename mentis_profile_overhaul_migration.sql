-- ==========================================
-- MENTIS PROFILE OVERHAUL MIGRATION
-- ==========================================

-- 1. FOLLOWERS SYSTEM
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- Index for fast follow queries
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- 2. INTELLECTUAL ARCHIVE (COLLECTIONS)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    annotation TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(collection_id, post_id)
);

-- Create a default "Tüm Kaydedilenler" collection for existing users if needed, 
-- but normally handled by app logic.

-- 3. AI COGNITIVE TRAITS
CREATE TABLE IF NOT EXISTS user_cognitive_traits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    traits JSONB DEFAULT '[]', -- e.g. [{"name": "Analitik Düşünen", "score": 85}, {"name": "Tarihsel Stratejist", "score": 92}]
    summary_text TEXT, -- e.g. "Son 30 gündür ağırlıklı olarak tarih, etik ve siyaset..."
    top_categories JSONB DEFAULT '[]',
    radar_data JSONB DEFAULT '{}',
    last_analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. REAL-TIME MESSAGING & CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- 5. PROFILE STATS UPDATES & TRIGGERS
-- Function to handle Follow/Unfollow stats
CREATE OR REPLACE FUNCTION handle_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_stats SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
        UPDATE user_stats SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
        
        -- Also add notification for follow
        INSERT INTO notifications (user_id, type, title, body, related_entity_id)
        VALUES (NEW.following_id, 'follow', 'Yeni Takipçi', 'Biri seni takip etmeye başladı', NEW.follower_id);
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_stats SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
        UPDATE user_stats SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_follow_stats ON followers;
CREATE TRIGGER trigger_follow_stats
AFTER INSERT OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION handle_follow_stats();

-- Add 'read_time' tracking to user_stats if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_stats' AND column_name='total_reading_time_mins') THEN
        ALTER TABLE user_stats ADD COLUMN total_reading_time_mins INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enable Realtime for Messaging (Supabase specific publication)
-- Note: This is an illustrative command. Usually managed in Supabase dashboard or via API
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Followers
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers visible to everyone" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

-- Collection Items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collection items" ON collection_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into collections" ON collection_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from collections" ON collection_items FOR DELETE USING (auth.uid() = user_id);

-- Cognitive Traits
ALTER TABLE user_cognitive_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cognitive traits visible to everyone" ON user_cognitive_traits FOR SELECT USING (true);

-- Messaging RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they are in" ON conversations 
FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid()));

CREATE POLICY "Users can view participants in their conversations" ON conversation_participants 
FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()));

CREATE POLICY "Users can view messages in their conversations" ON messages 
FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

CREATE POLICY "Users can send messages" ON messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
