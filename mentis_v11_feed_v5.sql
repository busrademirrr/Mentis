-- ==============================================================================
-- MENTIS V11 - FEED DISCOVERY V5 (ALGORITHMIC FOR YOU PAGE)
-- ==============================================================================

-- 0. ADD MISSING COLUMNS
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 1. ADD AUTHOR QUALITY SCORE
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS author_quality_score NUMERIC DEFAULT 1.0;

-- 2. CREATE POST HIDES TABLE (Negative Signals)
CREATE TABLE IF NOT EXISTS public.post_hides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, post_id)
);
ALTER TABLE public.post_hides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own hides" ON public.post_hides;
CREATE POLICY "Users can manage own hides" ON public.post_hides
FOR ALL USING (auth.uid() = user_id);

-- 3. RPC: HIDE POST
CREATE OR REPLACE FUNCTION public.hide_post(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    INSERT INTO public.post_hides (user_id, post_id) VALUES (auth.uid(), p_post_id) ON CONFLICT DO NOTHING;
    RETURN true;
END;
$$;


-- 4. RPC: GET FEED V5 (The Production Algorithm)
DROP FUNCTION IF EXISTS public.get_feed_v4(text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_feed_v5(text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.get_feed_v5(
    p_feed_type text DEFAULT 'for_you', -- 'for_you', 'following', 'trending'
    p_category text DEFAULT 'Hepsi',
    p_search text DEFAULT '',
    p_user_id uuid DEFAULT NULL
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
    v_user_interests text[];
    v_user_habit_authors uuid[];
BEGIN
    -- Kişiselleştirme Sinyallerini Topla (Cold Start ve Habit Match için)
    IF p_user_id IS NOT NULL THEN
        -- Kullanıcının belirlediği ilgi alanları
        SELECT interests INTO v_user_interests FROM public.user_profiles WHERE user_id = p_user_id;
        
        -- Kullanıcının geçmişte Deep Read (%80 üstü) yaptığı yazarlar
        SELECT ARRAY_AGG(DISTINCT p.author_id) INTO v_user_habit_authors
        FROM public.post_read_sessions prs
        JOIN public.posts p ON prs.post_id = p.id
        WHERE prs.user_id = p_user_id AND prs.scroll_percent >= 80;
    END IF;

    IF v_user_interests IS NULL THEN v_user_interests := ARRAY[]::text[]; END IF;
    IF v_user_habit_authors IS NULL THEN v_user_habit_authors := ARRAY[]::uuid[]; END IF;

    RETURN QUERY 
    WITH 
    -- Sinyalleri Toplama
    PostStats AS (
        SELECT 
            p.id as post_id,
            p.category,
            p.created_at,
            p.author_id,
            COALESCE((SELECT COUNT(*) FROM public.likes WHERE post_id = p.id), 0) as likes,
            COALESCE((SELECT COUNT(*) FROM public.saved_posts WHERE post_id = p.id), 0) as saves,
            COALESCE((SELECT COUNT(*) FROM public.comments WHERE post_id = p.id), 0) as comments,
            COALESCE((SELECT COUNT(*) FROM public.post_read_sessions WHERE post_id = p.id AND scroll_percent >= 80), 0) as deep_reads,
            COALESCE((SELECT COUNT(*) FROM public.post_views WHERE post_id = p.id), 0) as views,
            COALESCE((SELECT COUNT(*) FROM public.messages WHERE message_type = 'knowledge_card' AND content LIKE '%' || p.id::text || '%'), 0) as dm_shares,
            -- Bounce rate calculation (reads < 5 seconds)
            COALESCE((SELECT COUNT(*) FROM public.post_read_sessions WHERE post_id = p.id AND read_seconds < 5), 0) as bounces
        FROM public.posts p
        WHERE p.is_published = true
    ),
    ScoredPosts AS (
        SELECT 
            ps.*,
            -- A. Base Points
            (ps.likes * 3 + ps.saves * 5 + ps.comments * 8 + ps.deep_reads * 10 + ps.dm_shares * 12) - (ps.bounces * 5) AS base_points,
            
            -- B. Completion Rate
            CASE 
                WHEN ps.views = 0 THEN 1.0 
                ELSE GREATEST(0.5, LEAST(1.5, (ps.deep_reads::numeric / ps.views::numeric) * 2.0)) 
            END AS completion_multiplier,
            
            -- C. Freshness & Exploration
            CASE 
                WHEN ps.views < 100 THEN 5.0 -- Exploration Boost (Yeni Post)
                WHEN ps.created_at >= NOW() - INTERVAL '12 hours' THEN 2.0
                WHEN ps.created_at >= NOW() - INTERVAL '24 hours' THEN 1.5
                WHEN ps.created_at >= NOW() - INTERVAL '3 days' THEN 1.0
                WHEN ps.created_at >= NOW() - INTERVAL '7 days' THEN 0.5
                ELSE 0.1
            END AS freshness_multiplier,
            
            -- D. Personalization Multipliers
            CASE WHEN EXISTS(SELECT 1 FROM public.followers WHERE follower_id = p_user_id AND following_id = ps.author_id) THEN 1.5 ELSE 1.0 END AS follow_multiplier,
            CASE WHEN ps.category = ANY(v_user_interests) THEN 1.3 ELSE 1.0 END AS interest_multiplier,
            CASE WHEN ps.author_id = ANY(v_user_habit_authors) THEN 1.4 ELSE 1.0 END AS habit_multiplier
            
        FROM PostStats ps
    ),
    RankedPosts AS (
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
            sp.likes AS likes_count,
            sp.comments AS comments_count,
            sp.saves AS saves_count,
            EXISTS(SELECT 1 FROM public.likes WHERE post_id = p.id AND user_id = p_user_id) AS user_has_liked,
            EXISTS(SELECT 1 FROM public.saved_posts WHERE post_id = p.id AND user_id = p_user_id) AS user_has_saved,
            
            -- THE FORMULA
            (sp.base_points * sp.completion_multiplier * sp.freshness_multiplier * sp.interest_multiplier * sp.follow_multiplier * sp.habit_multiplier * COALESCE(u.author_quality_score, 1.0))::double precision AS final_score,
            
            -- DIVERSITY FILTER
            ROW_NUMBER() OVER(PARTITION BY p.author_id ORDER BY (sp.base_points * sp.freshness_multiplier) DESC) as author_rank,

            -- DISCOVERY REASON
            CASE
                WHEN p_feed_type = 'following' THEN 'Takip ettiğiniz yazar'
                WHEN sp.views < 100 THEN '🚀 Yeni keşif'
                WHEN sp.follow_multiplier > 1.0 THEN '👥 Takip ettiğiniz yazar'
                WHEN sp.habit_multiplier > 1.0 THEN '📚 Sık okuduğunuz yazar'
                WHEN sp.interest_multiplier > 1.0 THEN '✨ İlgi alanınıza uygun'
                WHEN sp.freshness_multiplier >= 1.5 AND sp.base_points > 50 THEN '🔥 Son dönemde popüler'
                ELSE ''
            END AS discovery_reason

        FROM public.posts p
        JOIN ScoredPosts sp ON p.id = sp.post_id
        LEFT JOIN public.user_profiles u ON p.author_id = u.user_id
        WHERE 
            p.is_published = true AND
            (p_user_id IS NULL OR p.id NOT IN (SELECT post_id FROM public.post_hides WHERE user_id = p_user_id)) AND -- Hide filter
            (p_category = 'Hepsi' OR p.category = p_category) AND
            (p_search = '' OR p.title ILIKE '%' || p_search || '%' OR p.content ILIKE '%' || p_search || '%') AND
            (
                p_feed_type != 'following' OR 
                EXISTS(SELECT 1 FROM public.followers WHERE follower_id = p_user_id AND following_id = p.author_id)
            )
    )
    SELECT 
        id, title, content, short_description, category, image_url, payload, 
        created_at, updated_at, type, author_id, author_username, author_full_name, 
        author_avatar_url, author_level, likes_count, comments_count, saves_count, 
        user_has_liked, user_has_saved, final_score AS trend_score, discovery_reason
    FROM RankedPosts
    WHERE 
        (p_feed_type != 'for_you' OR author_rank <= 2) -- Max 2 posts per author in For You
    ORDER BY 
        CASE WHEN p_feed_type IN ('for_you', 'trending') THEN final_score END DESC NULLS LAST,
        CASE WHEN p_feed_type = 'following' THEN created_at END DESC NULLS LAST,
        created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
