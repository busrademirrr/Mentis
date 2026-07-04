-- MENTIS PROFILE SYSTEM V3 - PRODUCTION HARDENED SQL MIGRATION
-- Run this in your Supabase SQL Editor

-- ==============================================================================
-- PHASE 1: DATABASE FOUNDATION & HARDENING
-- ==============================================================================

-- 1. Extend user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS cover_photo_url text,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now();

-- 2. Create user_stats table (Single Source of Truth for Counters)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    posts_count integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    likes_received integer DEFAULT 0,
    comments_received integer DEFAULT 0,
    shares_received integer DEFAULT 0,
    saves_received integer DEFAULT 0,
    profile_views_count integer DEFAULT 0,
    knowledge_score integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now()
);

-- Initialize user_stats for existing users
INSERT INTO public.user_stats (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create activity_events table
CREATE TABLE IF NOT EXISTS public.activity_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'post_created', 'comment_created', 'like_received', 'follow_received', 'badge_earned'
    entity_id uuid, -- Reference to the post, comment, or badge
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    viewer_id uuid REFERENCES public.users(id) ON DELETE CASCADE, -- Can be null for anonymous views
    target_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(viewer_id, target_user_id, created_at) -- Prevent spam views in same ms
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS followers_follower_id_idx ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS followers_following_id_idx ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS activity_events_user_id_idx ON public.activity_events(user_id);
CREATE INDEX IF NOT EXISTS profile_views_target_idx ON public.profile_views(target_user_id);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public user_stats read" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Public activity_events read" ON public.activity_events FOR SELECT USING (true);
CREATE POLICY "Owner profile_views read" ON public.profile_views FOR SELECT USING (auth.uid() = target_user_id);
CREATE POLICY "Allow insert profile_views" ON public.profile_views FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- PHASE 2: TRIGGER-BASED STATS ENGINE
-- ==============================================================================

-- Trigger: Update Followers/Following Counts
CREATE OR REPLACE FUNCTION public.handle_follow_stats()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.user_stats SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    UPDATE public.user_stats SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    
    -- Auto generate notification
    INSERT INTO public.notifications (user_id, actor_id, type) 
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.user_stats SET following_count = following_count - 1 WHERE user_id = OLD.follower_id;
    UPDATE public.user_stats SET followers_count = followers_count - 1 WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_change ON public.followers;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats();

-- Trigger: Update Posts Count
CREATE OR REPLACE FUNCTION public.handle_post_stats()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.user_stats SET posts_count = posts_count + 1 WHERE user_id = NEW.author_id;
    
    -- Log Activity
    INSERT INTO public.activity_events (user_id, type, entity_id) VALUES (NEW.author_id, 'post_created', NEW.id);
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.user_stats SET posts_count = posts_count - 1 WHERE user_id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_change ON public.posts;
CREATE TRIGGER on_post_change
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_post_stats();

-- Trigger: Update Profile Views
CREATE OR REPLACE FUNCTION public.handle_profile_view()
RETURNS trigger AS $$
BEGIN
  UPDATE public.user_stats SET profile_views_count = profile_views_count + 1 WHERE user_id = NEW.target_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_view ON public.profile_views;
CREATE TRIGGER on_profile_view
AFTER INSERT ON public.profile_views
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_view();


-- ==============================================================================
-- PHASE 3: SINGLE SOURCE OF TRUTH RPC (get_profile_v5)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_v5(p_target_user_id uuid, p_viewer_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_profile jsonb;
  v_stats jsonb;
  v_relationship jsonb;
  v_badges jsonb;
  v_recent_activity jsonb;
  v_result jsonb;
BEGIN
  -- 1. Profile Data
  SELECT jsonb_build_object(
    'id', u.id,
    'name', up.full_name,
    'username', up.username,
    'avatar_url', up.avatar_url,
    'cover_photo_url', up.cover_photo_url,
    'bio', up.bio,
    'website_url', up.website_url,
    'location', up.location,
    'is_verified', up.is_verified,
    'interests', up.interests,
    'joined_at', up.joined_at,
    'last_active_at', up.last_active_at
  ) INTO v_profile
  FROM public.users u
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  WHERE u.id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Stats Data
  SELECT jsonb_build_object(
    'followers_count', us.followers_count,
    'following_count', us.following_count,
    'posts_count', us.posts_count,
    'likes_received', us.likes_received,
    'comments_received', us.comments_received,
    'shares_received', us.shares_received,
    'saves_received', us.saves_received,
    'profile_views', us.profile_views_count,
    'knowledge_score', us.knowledge_score
  ) INTO v_stats
  FROM public.user_stats us
  WHERE us.user_id = p_target_user_id;

  IF v_stats IS NULL THEN
     v_stats := '{"followers_count":0,"following_count":0,"posts_count":0,"likes_received":0,"comments_received":0,"shares_received":0,"saves_received":0,"profile_views":0,"knowledge_score":0}'::jsonb;
  END IF;

  -- 3. Relationship Data
  SELECT jsonb_build_object(
    'is_following', EXISTS (SELECT 1 FROM public.followers WHERE follower_id = p_viewer_user_id AND following_id = p_target_user_id),
    'is_self', (p_viewer_user_id = p_target_user_id)
  ) INTO v_relationship;

  -- 4. Badges (Mock array for now, wait for DB implementation later)
  v_badges := '[]'::jsonb;

  -- 5. Recent Activity
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ae.id,
      'type', ae.type,
      'created_at', ae.created_at
    ) ORDER BY ae.created_at DESC
  ), '[]'::jsonb) INTO v_recent_activity
  FROM (
    SELECT * FROM public.activity_events 
    WHERE user_id = p_target_user_id 
    ORDER BY created_at DESC LIMIT 5
  ) ae;

  -- Assemble Final JSON Payload
  v_result := jsonb_build_object(
    'profile', v_profile,
    'stats', v_stats,
    'relationship', v_relationship,
    'badges', v_badges,
    'recent_activity', v_recent_activity
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PHASE 4: TOGGLE FOLLOW RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.toggle_follow_v1(p_target_id uuid)
RETURNS boolean AS $$
DECLARE
  v_follower_id uuid;
  v_exists boolean;
BEGIN
  v_follower_id := auth.uid();
  IF v_follower_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_follower_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot follow self';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.followers 
    WHERE follower_id = v_follower_id AND following_id = p_target_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.followers 
    WHERE follower_id = v_follower_id AND following_id = p_target_id;
    RETURN false; -- Unfollowed
  ELSE
    INSERT INTO public.followers (follower_id, following_id) 
    VALUES (v_follower_id, p_target_id);
    RETURN true; -- Followed
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
