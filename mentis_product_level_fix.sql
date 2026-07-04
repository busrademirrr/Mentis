-- MENTIS PRODUCT LEVEL STABILIZATION MIGRATION
-- Run this in Supabase SQL Editor to ensure all tables exist and API cache is reloaded.

-- 1. Ensure user_stats exists
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    argument_votes INTEGER DEFAULT 0,
    arena_wins INTEGER DEFAULT 0,
    duel_wins INTEGER DEFAULT 0,
    quiz_count INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure user_reputation exists
CREATE TABLE IF NOT EXISTS public.user_reputation (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    tier TEXT DEFAULT 'Çırak',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ensure post_interactions exists (For Likes and Saves)
CREATE TABLE IF NOT EXISTS public.post_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'save', 'share')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, post_id, type)
);

-- 4. Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- 5. Add Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read stats') THEN
        CREATE POLICY "Public read stats" ON public.user_stats FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read reputation') THEN
        CREATE POLICY "Public read reputation" ON public.user_reputation FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Interactions viewable by everyone') THEN
        CREATE POLICY "Interactions viewable by everyone" ON public.post_interactions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own interactions') THEN
        CREATE POLICY "Users can manage own interactions" ON public.post_interactions FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Reload Supabase API Schema Cache! (CRITICAL for "Could not find table" errors)
NOTIFY pgrst, 'reload schema';
