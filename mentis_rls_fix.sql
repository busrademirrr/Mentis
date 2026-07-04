-- MENTIS DB RLS FIX
-- Run this in the Supabase SQL Editor.

-- Enable RLS on the table (in case it isn't already)
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- 1. Create a policy so users can SEE their own saved items (and others' likes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'post_interactions' AND policyname = 'Interactions viewable by everyone'
    ) THEN
        CREATE POLICY "Interactions viewable by everyone" 
        ON public.post_interactions 
        FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 2. Force a schema cache reload for safety
NOTIFY pgrst, 'reload schema';
