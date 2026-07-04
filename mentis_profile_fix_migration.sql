-- ==========================================
-- MENTIS FINAL PROFILE FIX MIGRATION
-- ==========================================

-- 1. USER FOLLOWS
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 2. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. POST LIKES (Explicitly requested separate from post_interactions)
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- 4. SAVE COLLECTIONS
CREATE TABLE IF NOT EXISTS public.save_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SAVED POSTS
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.save_collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Ensure user_reputation has all requested fields
ALTER TABLE public.user_reputation 
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows viewable by everyone" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON public.comments FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Saved posts viewable by owner" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own saved posts" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.save_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections viewable by owner or public" ON public.save_collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own collections" ON public.save_collections FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS FOR POST COUNTS
-- ==========================================
-- Note: Assuming posts table has likes, saves, comments columns.
-- If they don't exist, we add them:
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- LIKES TRIGGER
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- SAVES TRIGGER
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET saves = saves + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET saves = GREATEST(saves - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_saves_count ON public.saved_posts;
CREATE TRIGGER trg_post_saves_count
AFTER INSERT OR DELETE ON public.saved_posts
FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- COMMENTS TRIGGER
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments = comments + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments = GREATEST(comments - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.comments;
CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
