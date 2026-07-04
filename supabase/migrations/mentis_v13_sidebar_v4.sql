-- MENTIS SIDEBAR V4 - KNOWLEDGE HUB
-- This RPC provides all the dynamic data required for the Right Sidebar

CREATE OR REPLACE FUNCTION get_sidebar_knowledge_hub_v1(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_learning_summary JSON;
    v_recommended_content JSON;
    v_recommended_users JSON;
    v_trending_topics JSON;
    v_leaderboard JSON;
BEGIN
    -- 1. LEARNING SUMMARY
    IF p_user_id IS NOT NULL THEN
        SELECT json_build_object(
            'top_category', (
                SELECT p.category
                FROM post_interactions pi
                JOIN posts p ON pi.post_id = p.id
                WHERE pi.user_id = p_user_id AND pi.created_at > now() - interval '30 days' AND p.category IS NOT NULL
                GROUP BY p.category
                ORDER BY count(*) DESC
                LIMIT 1
            ),
            'contents_read', (
                SELECT count(DISTINCT post_id)
                FROM post_interactions
                WHERE user_id = p_user_id AND type = 'read' AND created_at > now() - interval '7 days'
            ),
            'quizzes_completed', (
                SELECT count(*)
                FROM quiz_answers
                WHERE user_id = p_user_id
            ),
            'arena_wins', 0 -- Placeholder for future arena integration
        ) INTO v_learning_summary;
    ELSE
        v_learning_summary := json_build_object('top_category', null, 'contents_read', 0, 'quizzes_completed', 0, 'arena_wins', 0);
    END IF;

    -- 2. RECOMMENDED CONTENT (FOR YOU)
    -- Simply fetch 3 recent popular posts that the user hasn't created.
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', p.id,
            'title', p.title,
            'type', p.type,
            'category', p.category,
            'reason', 'Sizin için seçildi'
        )
    ), '[]'::json)
    INTO v_recommended_content
    FROM (
        SELECT *
        FROM posts
        WHERE (p_user_id IS NULL OR author_id != p_user_id) AND type IN ('knowledge_card', 'discussion', 'quiz')
        ORDER BY trend_score DESC, created_at DESC
        LIMIT 3
    ) p;

    -- 3. RECOMMENDED USERS
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', u.user_id,
            'username', u.username,
            'avatar', u.avatar_url,
            'main_category', (
                SELECT category FROM posts WHERE author_id = u.user_id GROUP BY category ORDER BY count(*) DESC LIMIT 1
            ),
            'follower_count', (SELECT count(*) FROM user_follows WHERE following_id = u.user_id)
        )
    ), '[]'::json)
    INTO v_recommended_users
    FROM (
        SELECT user_id, username, avatar_url
        FROM user_profiles
        WHERE p_user_id IS NULL OR user_id != p_user_id
        ORDER BY author_quality_score DESC, created_at DESC
        LIMIT 5
    ) u;

    -- 4. TRENDING TOPICS
    SELECT COALESCE(json_agg(
        json_build_object(
            'topic', category,
            'growth_percent', (random() * 50 + 10)::int -- Placeholder for dynamic algorithm
        )
    ), '[]'::json)
    INTO v_trending_topics
    FROM (
        SELECT category, count(*) as activity
        FROM posts
        WHERE created_at > now() - interval '7 days' AND category IS NOT NULL AND category != 'Hepsi'
        GROUP BY category
        ORDER BY activity DESC
        LIMIT 5
    ) t;

    -- 5. LEADERBOARD RAW STATS
    -- Fetch raw stats for the top active users. The frontend will compute the final score using the centralized utility.
    SELECT COALESCE(json_agg(
        json_build_object(
            'user_id', u.user_id,
            'username', u.username,
            'avatar_url', u.avatar_url,
            'arena_wins', 0,
            'arena_participation', 0,
            'quiz_correct_answers', (SELECT count(*) FROM quiz_answers WHERE user_id = u.user_id AND is_correct = true AND created_at > now() - interval '7 days'),
            'quiz_completions', (SELECT count(*) FROM quiz_answers WHERE user_id = u.user_id AND created_at > now() - interval '7 days'),
            'knowledge_cards_published', (SELECT count(*) FROM posts WHERE author_id = u.user_id AND type = 'knowledge_card' AND created_at > now() - interval '7 days'),
            'discussions_published', (SELECT count(*) FROM posts WHERE author_id = u.user_id AND type = 'discussion' AND created_at > now() - interval '7 days'),
            'likes_received', (SELECT count(*) FROM post_interactions pi JOIN posts p ON pi.post_id = p.id WHERE p.author_id = u.user_id AND pi.type = 'like' AND pi.created_at > now() - interval '7 days'),
            'saves_received', (SELECT count(*) FROM post_interactions pi JOIN posts p ON pi.post_id = p.id WHERE p.author_id = u.user_id AND pi.type = 'save' AND pi.created_at > now() - interval '7 days')
        )
    ), '[]'::json)
    INTO v_leaderboard
    FROM (
        SELECT user_id, username, avatar_url
        FROM user_profiles
        ORDER BY last_active_at DESC NULLS LAST
        LIMIT 20
    ) u;

    RETURN json_build_object(
        'learning_summary', v_learning_summary,
        'recommended_content', v_recommended_content,
        'recommended_users', v_recommended_users,
        'trending_topics', v_trending_topics,
        'leaderboard', v_leaderboard
    );
END;
$$;
