-- MENTIS PROFILE V4 UPGRADE (SINGLE SOURCE OF TRUTH)

CREATE OR REPLACE FUNCTION get_profile_v4(
    p_target_user_id uuid,
    p_viewer_id uuid DEFAULT NULL
)
RETURNS TABLE (
    user_id uuid,
    username text,
    full_name text,
    avatar_url text,
    bio text,
    posts_count bigint,
    followers_count bigint,
    following_count bigint,
    total_likes_received bigint,
    total_comments_received bigint,
    total_saves_received bigint,
    is_following boolean
) AS $$
BEGIN
    RETURN QUERY
    WITH UserPosts AS (
        SELECT id FROM public.posts WHERE author_id = p_target_user_id
    ),
    FollowerStats AS (
        SELECT 
            (SELECT COUNT(*) FROM public.followers WHERE following_id = p_target_user_id) as followers,
            (SELECT COUNT(*) FROM public.followers WHERE follower_id = p_target_user_id) as following,
            (SELECT EXISTS(SELECT 1 FROM public.followers WHERE following_id = p_target_user_id AND follower_id = p_viewer_id)) as viewer_follows
    ),
    InteractionStats AS (
        SELECT
            COALESCE(SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END), 0) as likes,
            COALESCE(SUM(CASE WHEN type = 'save' THEN 1 ELSE 0 END), 0) as saves
        FROM public.post_interactions
        WHERE post_id IN (SELECT id FROM UserPosts)
    ),
    CommentStats AS (
        SELECT COUNT(*) as comments
        FROM public.comments
        WHERE post_id IN (SELECT id FROM UserPosts) AND deleted_at IS NULL AND is_hidden = false
    )
    SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.bio,
        (SELECT COUNT(*) FROM UserPosts)::bigint AS posts_count,
        f.followers::bigint AS followers_count,
        f.following::bigint AS following_count,
        i.likes::bigint AS total_likes_received,
        c.comments::bigint AS total_comments_received,
        i.saves::bigint AS total_saves_received,
        f.viewer_follows AS is_following
    FROM public.user_profiles u
    CROSS JOIN FollowerStats f
    CROSS JOIN InteractionStats i
    CROSS JOIN CommentStats c
    WHERE u.user_id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
