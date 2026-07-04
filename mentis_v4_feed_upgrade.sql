-- MENTIS FEED DISCOVERY SYSTEM V4 UPGRADE

-- 1. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS post_interactions_post_id_idx ON public.post_interactions(post_id);
CREATE INDEX IF NOT EXISTS post_interactions_type_idx ON public.post_interactions(type);

-- 2. CREATE THE MAIN FEED RPC FUNCTION
-- First, drop the overloaded functions to prevent PGRST203 ambiguity error
DROP FUNCTION IF EXISTS get_feed_v4(text, text, text, uuid);
DROP FUNCTION IF EXISTS get_feed_v4(text, text, text, uuid, uuid);

-- Returns the fully joined feed with dynamic calculation for likes, comments, and trend scores.
CREATE OR REPLACE FUNCTION get_feed_v4(
    p_category text DEFAULT 'Hepsi',
    p_search text DEFAULT '',
    p_sort text DEFAULT 'trend',
    p_user_id uuid DEFAULT NULL,
    p_author_id uuid DEFAULT NULL
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
    user_has_saved boolean,
    trend_score double precision,
    discovery_reason text
) AS $$
DECLARE
    v_user_fav_categories text[];
BEGIN
    -- PHASE 8: DYNAMIC PERSONALIZATION
    IF p_user_id IS NOT NULL AND p_sort IN ('trend', 'bugun') THEN
        SELECT ARRAY_AGG(c.category) INTO v_user_fav_categories
        FROM (
            SELECT p.category, COUNT(*) as count
            FROM public.post_interactions pi
            JOIN public.posts p ON pi.post_id = p.id
            WHERE pi.user_id = p_user_id AND p.category IS NOT NULL
            GROUP BY p.category
            ORDER BY count DESC
            LIMIT 2
        ) c;
    END IF;

    IF v_user_fav_categories IS NULL THEN
        v_user_fav_categories := ARRAY[]::text[];
    END IF;

    RETURN QUERY 
    WITH PostStats AS (
        SELECT 
            p.id as post_id,
            COALESCE(SUM(CASE WHEN pi.type = 'like' THEN 1 ELSE 0 END), 0) as likes,
            COALESCE(SUM(CASE WHEN pi.type = 'save' THEN 1 ELSE 0 END), 0) as saves
        FROM public.posts p
        LEFT JOIN public.post_interactions pi ON p.id = pi.post_id
        GROUP BY p.id
    ),
    CommentStats AS (
        SELECT 
            c.post_id,
            COUNT(c.id) as comments
        FROM public.comments c
        WHERE c.deleted_at IS NULL AND c.is_hidden = false
        GROUP BY c.post_id
    ),
    UserInteractions AS (
        SELECT 
            pi.post_id,
            bool_or(pi.type = 'like') as has_liked,
            bool_or(pi.type = 'save') as has_saved
        FROM public.post_interactions pi
        WHERE pi.user_id = p_user_id
        GROUP BY pi.post_id
    ),
    SavedFilter AS (
        SELECT post_id 
        FROM public.post_interactions 
        WHERE user_id = p_user_id AND type = 'save'
    )
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
        COALESCE(ps.likes, 0) AS likes_count,
        COALESCE(cs.comments, 0) AS comments_count,
        COALESCE(ps.saves, 0) AS saves_count,
        COALESCE(ui.has_liked, false) AS user_has_liked,
        COALESCE(ui.has_saved, false) AS user_has_saved,
        
        -- TREND SCORE ALGORITHM WITH PERSONALIZATION
        (
            (COALESCE(ps.likes, 0) * 3 + COALESCE(cs.comments, 0) * 5 + COALESCE(ps.saves, 0) * 4) * 
            CASE 
                WHEN p.created_at >= NOW() - INTERVAL '24 hours' THEN 1.5
                WHEN p.created_at >= NOW() - INTERVAL '3 days' THEN 1.2
                WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 1.0
                ELSE 0.5
            END *
            CASE
                WHEN p.category = ANY(v_user_fav_categories) THEN 1.15
                ELSE 1.0
            END
        )::double precision AS calculated_trend_score,
        
        -- VISUAL EXPLANATION
        CASE
            WHEN p_sort = 'saved_by_me' THEN 'Sizin kaydettiğiniz içerik'
            WHEN p.category = ANY(v_user_fav_categories) THEN 'Bu içerik ilginize göre önerildi'
            WHEN p_sort = 'trend' THEN 'Bu içerik yüksek etkileşim aldığı için gösteriliyor'
            WHEN p_sort = 'yeni' THEN 'Bu içerik yeni eklendiği için gösteriliyor'
            WHEN p_sort = 'bugun' THEN 'Bu içerik bugün popüler olduğu için gösteriliyor'
            WHEN p_sort = 'kaydedilen' THEN 'Bu içerik çok kaydedildiği için gösteriliyor'
            WHEN p_sort = 'tartisisan' THEN 'Bu içerik çok tartışıldığı için gösteriliyor'
            ELSE ''
        END AS discovery_reason

    FROM public.posts p
    LEFT JOIN public.user_profiles u ON p.author_id = u.user_id
    LEFT JOIN PostStats ps ON p.id = ps.post_id
    LEFT JOIN CommentStats cs ON p.id = cs.post_id
    LEFT JOIN UserInteractions ui ON p.id = ui.post_id
    WHERE 
        (p_category = 'Hepsi' OR p.category = p_category) AND
        (p_search = '' OR p.title ILIKE '%' || p_search || '%' OR p.content ILIKE '%' || p_search || '%') AND
        (p_sort != 'bugun' OR p.created_at >= CURRENT_DATE) AND
        (p_author_id IS NULL OR p.author_id = p_author_id) AND
        (p_sort != 'saved_by_me' OR p.id IN (SELECT post_id FROM SavedFilter))
    ORDER BY 
        CASE WHEN p_sort = 'trend' THEN 
            ((COALESCE(ps.likes, 0) * 3 + COALESCE(cs.comments, 0) * 5 + COALESCE(ps.saves, 0) * 4) * 
            CASE 
                WHEN p.created_at >= NOW() - INTERVAL '24 hours' THEN 1.5
                WHEN p.created_at >= NOW() - INTERVAL '3 days' THEN 1.2
                WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 1.0
                ELSE 0.5
            END *
            CASE
                WHEN p.category = ANY(v_user_fav_categories) THEN 1.15
                ELSE 1.0
            END) 
        END DESC NULLS LAST,
        CASE WHEN p_sort = 'bugun' THEN 
            ((COALESCE(ps.likes, 0) * 3 + COALESCE(cs.comments, 0) * 5 + COALESCE(ps.saves, 0) * 4) * 1.5)
        END DESC NULLS LAST,
        CASE WHEN p_sort IN ('yeni', 'saved_by_me', 'author') THEN p.created_at END DESC NULLS LAST,
        CASE WHEN p_sort = 'kaydedilen' THEN COALESCE(ps.saves, 0) END DESC NULLS LAST,
        CASE WHEN p_sort = 'tartisisan' THEN COALESCE(cs.comments, 0) END DESC NULLS LAST,
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
