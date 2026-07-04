-- ==============================================================================
-- PART 1: ADD TAGS TO POSTS
-- ==============================================================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
