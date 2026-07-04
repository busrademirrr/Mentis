-- Mentis V3 - Comments System Upgrade Migration

-- 1. Add parent_id to support nested replies
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, comment_id)
);

-- 3. Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Public read comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 5. Helper function for recursive thread fetching (Optional, handled in app via flat array nesting)
