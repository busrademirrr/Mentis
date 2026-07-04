-- ==============================================================================
-- MENTIS V10 - KNOWLEDGE DETAIL SCREEN & LEARNING TRACKING
-- ==============================================================================

-- 1. POST VIEWS (Manipülasyon Korumalı)
CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if anonymous, but we focus on auth users
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- 2. POST READ SESSIONS (Progress Tracking)
CREATE TABLE IF NOT EXISTS public.post_read_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    scroll_percent INTEGER DEFAULT 0,
    read_seconds INTEGER DEFAULT 0,
    UNIQUE(user_id, post_id)
);
ALTER TABLE public.post_read_sessions ENABLE ROW LEVEL SECURITY;

-- 3. SAVED QUOTES (Highlight & Save Quote)
CREATE TABLE IF NOT EXISTS public.saved_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    quote_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;


-- RLS Policies
DROP POLICY IF EXISTS "Users can read post views" ON public.post_views;
CREATE POLICY "Users can read post views" ON public.post_views FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their read sessions" ON public.post_read_sessions;
CREATE POLICY "Users can manage their read sessions" ON public.post_read_sessions
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their saved quotes" ON public.saved_quotes;
CREATE POLICY "Users can manage their saved quotes" ON public.saved_quotes
FOR ALL USING (auth.uid() = user_id);


-- 4. RPC: LOG POST VIEW (24-hour rate limit)
CREATE OR REPLACE FUNCTION public.log_post_view(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_exists BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN RETURN false; END IF;

    -- Son 24 saat içinde bu kullanıcı bu posta bakmış mı?
    SELECT EXISTS (
        SELECT 1 FROM public.post_views 
        WHERE post_id = p_post_id 
          AND user_id = v_user_id 
          AND created_at > now() - interval '24 hours'
    ) INTO v_exists;

    -- Eğer bakmadıysa yeni view ekle
    IF NOT v_exists THEN
        INSERT INTO public.post_views (post_id, user_id) VALUES (p_post_id, v_user_id);
    END IF;

    RETURN NOT v_exists;
END;
$$;


-- 5. RPC: LOG READ PROGRESS
CREATE OR REPLACE FUNCTION public.log_read_progress(p_post_id UUID, p_scroll_percent INTEGER, p_read_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN RETURN false; END IF;

    INSERT INTO public.post_read_sessions (user_id, post_id, scroll_percent, read_seconds, started_at)
    VALUES (v_user_id, p_post_id, p_scroll_percent, p_read_seconds, now())
    ON CONFLICT (user_id, post_id) 
    DO UPDATE SET 
        scroll_percent = GREATEST(post_read_sessions.scroll_percent, EXCLUDED.scroll_percent),
        read_seconds = GREATEST(post_read_sessions.read_seconds, EXCLUDED.read_seconds),
        completed_at = CASE 
            WHEN EXCLUDED.scroll_percent >= 90 AND post_read_sessions.completed_at IS NULL THEN now() 
            ELSE post_read_sessions.completed_at 
        END;

    RETURN true;
END;
$$;


-- 6. RPC: SAVE QUOTE
CREATE OR REPLACE FUNCTION public.save_quote(p_post_id UUID, p_quote_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN RETURN false; END IF;

    INSERT INTO public.saved_quotes (user_id, post_id, quote_text)
    VALUES (v_user_id, p_post_id, p_quote_text);

    RETURN true;
END;
$$;


-- 7. RPC: GET KNOWLEDGE DETAIL V1 (The Master Query)
CREATE OR REPLACE FUNCTION public.get_knowledge_detail_v1(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
    v_post_category VARCHAR;
BEGIN
    -- Ensure the post exists and get its category for related query
    SELECT category INTO v_post_category FROM public.posts WHERE id = p_post_id;
    IF v_post_category IS NULL THEN RETURN NULL; END IF;

    SELECT jsonb_build_object(
        'post', jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'content', COALESCE(p.content, p.payload->>'content'),
            'short_description', COALESCE(p.short_description, p.payload->>'short_description'),
            'image_url', COALESCE(p.image_url, p.payload->>'image_url'),
            'category', p.category,
            'type', p.type,
            'created_at', p.created_at,
            'read_time_minutes', COALESCE((p.payload->>'read_time_minutes')::int, 5)
        ),
        'author', jsonb_build_object(
            'id', u.user_id,
            'username', u.username,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'bio', u.bio,
            'followers_count', u.followers_count
        ),
        'stats', jsonb_build_object(
            'likes_count', (SELECT COUNT(*) FROM public.post_likes WHERE post_id = p.id),
            'comments_count', (SELECT COUNT(*) FROM public.comments WHERE post_id = p.id),
            'views_count', (SELECT COUNT(*) FROM public.post_views WHERE post_id = p.id)
        ),
        'me', jsonb_build_object(
            'has_liked', EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p.id AND user_id = v_user_id),
            'is_following', EXISTS(SELECT 1 FROM public.followers WHERE follower_id = v_user_id AND following_id = p.author_id),
            'is_saved', EXISTS(SELECT 1 FROM public.saved_posts WHERE post_id = p.id AND user_id = v_user_id)
        ),
        'sources', COALESCE(p.payload->'sources', '[]'::jsonb),
        'related_posts', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', rp.id,
                    'title', rp.title,
                    'image_url', COALESCE(rp.image_url, rp.payload->>'image_url'),
                    'category', rp.category
                )
            ), '[]'::jsonb)
            FROM (
                SELECT id, title, image_url, payload, category 
                FROM public.posts 
                WHERE category = v_post_category AND id != p_post_id AND is_published = true
                ORDER BY created_at DESC 
                LIMIT 5
            ) rp
        ),
        'reading_progress', COALESCE((
            SELECT jsonb_build_object(
                'scroll_percent', prs.scroll_percent,
                'read_seconds', prs.read_seconds
            )
            FROM public.post_read_sessions prs 
            WHERE prs.post_id = p.id AND prs.user_id = v_user_id
        ), jsonb_build_object('scroll_percent', 0, 'read_seconds', 0))
    ) INTO v_result
    FROM public.posts p
    JOIN public.user_profiles u ON p.author_id = u.user_id
    WHERE p.id = p_post_id;

    RETURN v_result;
END;
$$;
