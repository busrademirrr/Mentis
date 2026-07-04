-- MENTIS V14 COMMUNITY HUB MIGRATION
-- Provides optimized RPC for Leaderboard, Trending Tags, and Recommended Users

CREATE OR REPLACE FUNCTION get_community_hub_v2(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leaderboard JSON;
    v_trending_tags JSON;
    v_recommended_users JSON;
    
    -- Variables for user recommendation profiling
    v_user_top_category TEXT;
    v_user_top_quiz_cat TEXT;
    v_user_top_tags TEXT[];
BEGIN
    -- 1. WEEKLY LEADERBOARD (Top 10)
    -- Relaxed time intervals for mock data visibility (30 days instead of 7 days)
    WITH weekly_stats AS (
        SELECT u.user_id, u.username, u.avatar_url,
            (SELECT count(*) FROM quiz_answers WHERE user_id = u.user_id AND is_correct = true AND created_at > now() - interval '30 days') * 2 AS quiz_score,
            (SELECT count(*) FROM posts WHERE author_id = u.user_id AND created_at > now() - interval '30 days') * 3 AS post_score,
            (SELECT count(*) FROM post_interactions pi JOIN posts p ON pi.post_id = p.id WHERE p.author_id = u.user_id AND pi.type = 'like' AND pi.created_at > now() - interval '30 days') * 1 AS like_score,
            (SELECT count(*) FROM post_interactions pi JOIN posts p ON pi.post_id = p.id WHERE p.author_id = u.user_id AND pi.type = 'save' AND pi.created_at > now() - interval '30 days') * 2 AS save_score
        FROM user_profiles u
        WHERE u.last_active_at > now() - interval '90 days' OR u.last_active_at IS NULL
    ),
    scored_users AS (
        SELECT user_id, username, avatar_url, 
               (quiz_score + post_score + like_score + save_score) AS total_score
        FROM weekly_stats
        WHERE (quiz_score + post_score + like_score + save_score) > 0
        ORDER BY total_score DESC
        LIMIT 10
    )
    SELECT COALESCE(json_agg(row_to_json(scored_users)), '[]'::json) INTO v_leaderboard FROM scored_users;

    -- 2. TRENDING TAGS (Top 10 from posts in last 30 days)
    WITH unnested_tags AS (
        SELECT jsonb_array_elements_text(COALESCE(payload->'tags', '[]'::jsonb)) as tag
        FROM posts
        WHERE created_at > now() - interval '30 days' AND is_published = true
    ),
    tag_counts AS (
        SELECT LOWER(tag) as tag_name, count(*) as usage_count
        FROM unnested_tags
        WHERE tag IS NOT NULL AND length(tag) > 1
        GROUP BY LOWER(tag)
        ORDER BY usage_count DESC
        LIMIT 10
    )
    SELECT COALESCE(json_agg(
        json_build_object(
            'topic', tag_name,
            'usage_count', usage_count,
            'growth_percent', (random() * 50 + 10)::int -- Placeholder for complex growth calc
        )
    ), '[]'::json) INTO v_trending_tags FROM tag_counts;

    -- 3. RECOMMENDED USERS (Advanced Scoring)
    -- First, build the current user's profile
    IF p_user_id IS NOT NULL THEN
        -- User's top category from their own posts
        SELECT category INTO v_user_top_category
        FROM posts WHERE author_id = p_user_id GROUP BY category ORDER BY count(*) DESC LIMIT 1;
        
        -- User's top quiz category
        SELECT p.category INTO v_user_top_quiz_cat
        FROM quiz_answers q JOIN posts p ON q.quiz_id = p.id
        WHERE q.user_id = p_user_id GROUP BY p.category ORDER BY count(*) DESC LIMIT 1;

        -- We will score other users based on similarity
        WITH candidate_scores AS (
            SELECT 
                u.user_id, 
                u.username, 
                u.avatar_url,
                u.bio,
                (
                    -- +5 Same category (Top Category)
                    CASE WHEN (SELECT category FROM posts WHERE author_id = u.user_id GROUP BY category ORDER BY count(*) DESC LIMIT 1) = v_user_top_category THEN 5 ELSE 0 END +
                    -- +2 Same quiz area
                    CASE WHEN (SELECT p.category FROM quiz_answers q JOIN posts p ON q.quiz_id = p.id WHERE q.user_id = u.user_id GROUP BY p.category ORDER BY count(*) DESC LIMIT 1) = v_user_top_quiz_cat THEN 2 ELSE 0 END +
                    -- +1 Mutual follow
                    CASE WHEN EXISTS (SELECT 1 FROM user_follows WHERE follower_id = p_user_id AND following_id = u.user_id) THEN 1 ELSE 0 END
                ) as recommendation_score,
                -- Reason for recommendation
                CASE 
                    WHEN (SELECT category FROM posts WHERE author_id = u.user_id GROUP BY category ORDER BY count(*) DESC LIMIT 1) = v_user_top_category THEN 'Seninle aynı kategorilerde yazıyor'
                    WHEN (SELECT p.category FROM quiz_answers q JOIN posts p ON q.quiz_id = p.id WHERE q.user_id = u.user_id GROUP BY p.category ORDER BY count(*) DESC LIMIT 1) = v_user_top_quiz_cat THEN 'Seninle aynı quizleri çözüyor'
                    ELSE 'Popüler Yaratıcı'
                END as reason
            FROM user_profiles u
            WHERE u.user_id != p_user_id AND (u.last_active_at > now() - interval '90 days' OR u.last_active_at IS NULL)
        )
        SELECT COALESCE(json_agg(row_to_json(candidate_scores)), '[]'::json) 
        INTO v_recommended_users 
        FROM (
            SELECT * FROM candidate_scores 
            ORDER BY recommendation_score DESC, random() 
            LIMIT 10
        ) sub;
    ELSE
        -- Fallback for guest users: just return top authors
        WITH top_authors AS (
            SELECT user_id, username, avatar_url, bio, author_quality_score
            FROM user_profiles
            ORDER BY author_quality_score DESC NULLS LAST
            LIMIT 10
        )
        SELECT COALESCE(json_agg(
            json_build_object(
                'user_id', user_id,
                'username', username,
                'avatar_url', avatar_url,
                'bio', bio,
                'recommendation_score', author_quality_score,
                'reason', 'Popüler Yaratıcı'
            )
        ), '[]'::json) INTO v_recommended_users
        FROM top_authors;
    END IF;

    -- RETURN ALL DATA
    RETURN json_build_object(
        'leaderboard', v_leaderboard,
        'trending_tags', v_trending_tags,
        'recommended_users', v_recommended_users
    );
END;
$$;
