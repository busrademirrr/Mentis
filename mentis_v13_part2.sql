-- ==============================================================================
-- PART 2: FIX POST_VIEWS TABLE (Enforce Unique Views Per User)
-- ==============================================================================
DROP TABLE IF EXISTS public.post_views CASCADE;

CREATE TABLE public.post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view post_views" ON public.post_views;
CREATE POLICY "Public can view post_views" ON public.post_views FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert post_views" ON public.post_views;
CREATE POLICY "Auth users can insert post_views" ON public.post_views FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_post_view(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    INSERT INTO public.post_views (post_id, user_id) 
    VALUES (p_post_id, auth.uid()) 
    ON CONFLICT (post_id, user_id) DO NOTHING;
    RETURN true;
END;
$$;
