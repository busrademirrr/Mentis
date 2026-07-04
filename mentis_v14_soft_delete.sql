-- 1. Add Soft Delete Columns
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Update existing policies if necessary
-- Note: We rely on the client to add `.eq('is_deleted', false)` for soft deletes, 
-- but we can optionally add a policy to only allow users to update their own posts for deletion.

-- Create an explicit policy to allow users to update their own posts (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can update own posts'
    ) THEN
        CREATE POLICY "Users can update own posts"
        ON public.posts
        FOR UPDATE
        USING (auth.uid() = author_id);
    END IF;
END
$$;
