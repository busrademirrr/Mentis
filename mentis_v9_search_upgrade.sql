-- ==============================================================================
-- MENTIS V9 - SEARCH ENGINE UPGRADE (PRODUCTION GRADE FTS)
-- ==============================================================================

-- 1. SEARCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history" ON public.search_history
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert search history" ON public.search_history;
CREATE POLICY "Users can insert search history" ON public.search_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;
CREATE POLICY "Users can delete own search history" ON public.search_history
FOR DELETE USING (auth.uid() = user_id);


-- 2. RPC: LOG SEARCH HISTORY
CREATE OR REPLACE FUNCTION public.log_search_history(p_query TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    IF trim(p_query) = '' THEN RETURN false; END IF;

    INSERT INTO public.search_history (user_id, query)
    VALUES (auth.uid(), trim(p_query));
    
    RETURN true;
END;
$$;


-- 3. RPC: GET TRENDING SEARCHES
CREATE OR REPLACE FUNCTION public.get_trending_searches(p_limit INTEGER DEFAULT 5)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(q), '[]'::jsonb) INTO v_result
    FROM (
        SELECT query, count(*) as search_count
        FROM public.search_history
        WHERE created_at > now() - interval '7 days'
        GROUP BY lower(query), query
        ORDER BY search_count DESC
        LIMIT p_limit
    ) q;
    
    RETURN v_result;
END;
$$;


-- 4. RPC: SEARCH MENTIS ECOSYSTEM (FULL TEXT SEARCH & SCORING)
DROP FUNCTION IF EXISTS public.search_mentis_ecosystem(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.search_mentis_ecosystem(
    search_query TEXT, 
    max_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_tsquery tsquery;
BEGIN
    -- Prepare the plainto_tsquery for simple dictionary matching
    v_tsquery := plainto_tsquery('simple', search_query);

    -- If search query is empty or cannot form a valid query, return empty
    IF search_query = '' OR v_tsquery::text = '' THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_result
    FROM (
        -- === USERS SEARCH ===
        SELECT 
            'user' AS type,
            u.user_id AS id,
            (
                ts_rank(
                    setweight(to_tsvector('simple', COALESCE(u.username, '')), 'A') ||
                    setweight(to_tsvector('simple', COALESCE(u.full_name, '')), 'B') ||
                    setweight(to_tsvector('simple', COALESCE(u.bio, '')), 'C') ||
                    setweight(to_tsvector('simple', COALESCE(array_to_string(u.interests, ' '), '')), 'D'),
                    v_tsquery
                ) * 100 -- Users generally score higher if it's an exact match on username
            ) AS score,
            jsonb_build_object(
                'username', u.username,
                'full_name', u.full_name,
                'avatar_url', u.avatar_url,
                'bio', u.bio
            ) AS data
        FROM public.user_profiles u
        WHERE 
            (
                setweight(to_tsvector('simple', COALESCE(u.username, '')), 'A') ||
                setweight(to_tsvector('simple', COALESCE(u.full_name, '')), 'B') ||
                setweight(to_tsvector('simple', COALESCE(u.bio, '')), 'C') ||
                setweight(to_tsvector('simple', COALESCE(array_to_string(u.interests, ' '), '')), 'D')
            ) @@ v_tsquery
            -- Fallback for partial string matches that FTS might miss
            OR u.username ILIKE '%' || search_query || '%' 
            OR u.full_name ILIKE '%' || search_query || '%'

        UNION ALL

        -- === POSTS SEARCH ===
        SELECT 
            'post' AS type,
            p.id AS id,
            (
                ts_rank(
                    setweight(to_tsvector('simple', COALESCE(p.title, '')), 'A') ||
                    setweight(to_tsvector('simple', COALESCE(p.category, '')), 'B') ||
                    setweight(to_tsvector('simple', COALESCE(p.short_description, '')), 'C') ||
                    setweight(to_tsvector('simple', COALESCE(p.content, '')), 'D'),
                    v_tsquery
                ) * 70 -- Posts base score multiplier
            ) AS score,
            jsonb_build_object(
                'title', p.title,
                'category', p.category,
                'short_description', p.short_description,
                'image_url', COALESCE(p.image_url, p.payload->>'image_url'),
                'read_time_minutes', 5, -- Defaulting read_time for now if missing
                'post_type', p.type
            ) AS data
        FROM public.posts p
        WHERE 
            (
                setweight(to_tsvector('simple', COALESCE(p.title, '')), 'A') ||
                setweight(to_tsvector('simple', COALESCE(p.category, '')), 'B') ||
                setweight(to_tsvector('simple', COALESCE(p.short_description, '')), 'C') ||
                setweight(to_tsvector('simple', COALESCE(p.content, '')), 'D')
            ) @@ v_tsquery
            OR p.title ILIKE '%' || search_query || '%'
            OR p.short_description ILIKE '%' || search_query || '%'

        ORDER BY score DESC
        LIMIT max_limit
    ) r;

    RETURN v_result;
END;
$$;
