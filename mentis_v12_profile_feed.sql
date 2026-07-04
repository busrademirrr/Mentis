CREATE OR REPLACE FUNCTION public.get_profile_feed_v1(
    p_author_id uuid DEFAULT NULL,
    p_saved_by_user_id uuid DEFAULT NULL,
    p_viewer_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    short_description text,
    category text,
    image_url text,
    payload jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    type text,
    author_id uuid,
    author_username text,
    author_full_name text,
    author_avatar_url text,
    author_level integer,
    likes_count bigint,
    comments_count bigint,
    saves_count bigint,
    user_has_liked boolean,
    user_has_saved boolean
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.id,
        p.title,
        p.content,
        p.short_description,
        p.category,
        p.image_url,
        p.payload,
        p.created_at,
        p.updated_at,
        p.type,
        u.user_id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url,
        COALESCE(u.level, 1) AS author_level,
        COALESCE((SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id), 0) as likes_count,
        COALESCE((SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM public.post_interactions pi WHERE pi.post_id = p.id AND pi.type = 'save'), 0) as saves_count,
        EXISTS(SELECT 1 FROM public.likes l2 WHERE l2.post_id = p.id AND l2.user_id = p_viewer_id) AS user_has_liked,
        EXISTS(SELECT 1 FROM public.post_interactions pi2 WHERE pi2.post_id = p.id AND pi2.user_id = p_viewer_id AND pi2.type = 'save') AS user_has_saved
    FROM public.posts p
    LEFT JOIN public.user_profiles u ON p.author_id = u.user_id
    WHERE 
        p.is_published = true AND
        (p_author_id IS NULL OR p.author_id = p_author_id) AND
        (p_saved_by_user_id IS NULL OR EXISTS(SELECT 1 FROM public.post_interactions pi3 WHERE pi3.post_id = p.id AND pi3.user_id = p_saved_by_user_id AND pi3.type = 'save'))
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
