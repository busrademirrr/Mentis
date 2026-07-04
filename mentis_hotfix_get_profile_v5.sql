-- ==============================================================================
-- MENTIS HOTFIX - GET_PROFILE_V5 CRASH RESOLUTION
-- ==============================================================================

-- Problem: The previous get_profile_v5 RPC referenced columns that do not exist
-- in the live production database (e.g., u.avatar_value, us.posts_count).
-- Solution: We rewrite the RPC to safely map existing columns to the UI's expected format.

CREATE OR REPLACE FUNCTION public.get_profile_v5(
    p_target_user_id uuid,
    p_viewer_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile jsonb;
    v_stats jsonb;
    v_relationship jsonb;
    v_recent_activity jsonb;
BEGIN
    -- 1. Get Core Profile
    -- Using u.avatar_url directly instead of COALESCE with avatar_value
    SELECT 
        json_build_object(
            'id', u.user_id,
            'name', u.full_name,
            'username', u.username,
            'avatar_url', u.avatar_url,
            'cover_photo_url', u.cover_photo_url,
            'bio', u.bio,
            'website', u.website_url,
            'location', u.location,
            'is_verified', u.is_verified,
            'interests', u.interests,
            'joined_at', u.created_at,
            'last_active_at', u.last_active_at
        ) INTO v_profile
    FROM public.user_profiles u
    WHERE u.user_id = p_target_user_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Get Stats
    -- Safely mapping existing columns from user_stats:
    -- content_count -> posts_count
    -- argument_votes -> likes_received
    SELECT 
        json_build_object(
            'followers_count', COALESCE(us.followers_count, 0),
            'following_count', COALESCE(us.following_count, 0),
            'posts_count', COALESCE(us.content_count, 0),
            'likes_received', COALESCE(us.argument_votes, 0),
            'knowledge_score', COALESCE((us.quiz_count * 10) + (us.arena_wins * 50) + (us.duel_wins * 100), 0),
            'comments_received', 0,
            'shares_received', 0,
            'saves_received', 0
        ) INTO v_stats
    FROM public.user_stats us
    WHERE us.user_id = p_target_user_id;

    -- If user has no stats row yet, provide fallback zeros
    IF v_stats IS NULL THEN
        v_stats := json_build_object(
            'followers_count', 0, 'following_count', 0, 'posts_count', 0, 
            'likes_received', 0, 'knowledge_score', 0, 'comments_received', 0, 
            'shares_received', 0, 'saves_received', 0
        );
    END IF;

    -- 3. Get Relationship
    SELECT 
        json_build_object(
            'is_following', EXISTS(SELECT 1 FROM public.followers WHERE follower_id = p_viewer_user_id AND following_id = p_target_user_id),
            'is_self', (p_target_user_id = p_viewer_user_id)
        ) INTO v_relationship;

    -- 4. Get Recent Activity (Fallback to empty array)
    v_recent_activity := '[]'::jsonb;

    -- 5. Return Master Payload
    RETURN json_build_object(
        'profile', v_profile,
        'stats', v_stats,
        'relationship', v_relationship,
        'recent_activity', v_recent_activity
    );
END;
$$;
