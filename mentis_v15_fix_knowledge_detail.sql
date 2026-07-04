-- ==============================================================================
-- MENTIS V15 - FIX KNOWLEDGE DETAIL RPC (V2)
-- ==============================================================================
-- 1. Updates followers_count to pull from user_stats instead of user_profiles.
-- 2. Fixes missing "public.post_likes" and "public.saved_posts" errors by using
--    the correct modern table "public.post_interactions" (type = 'like' / 'save').

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
            'followers_count', COALESCE(us.followers_count, 0)
        ),
        'stats', jsonb_build_object(
            'likes_count', (SELECT COUNT(*) FROM public.post_interactions WHERE post_id = p.id AND type = 'like'),
            'comments_count', (SELECT COUNT(*) FROM public.comments WHERE post_id = p.id),
            'views_count', (SELECT COUNT(*) FROM public.post_views WHERE post_id = p.id)
        ),
        'me', jsonb_build_object(
            'has_liked', EXISTS(SELECT 1 FROM public.post_interactions WHERE post_id = p.id AND user_id = v_user_id AND type = 'like'),
            'is_following', EXISTS(SELECT 1 FROM public.followers WHERE follower_id = v_user_id AND following_id = p.author_id),
            'is_saved', EXISTS(SELECT 1 FROM public.post_interactions WHERE post_id = p.id AND user_id = v_user_id AND type = 'save')
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
    LEFT JOIN public.user_stats us ON p.author_id = us.user_id
    WHERE p.id = p_post_id;

    RETURN v_result;
END;
$$;
