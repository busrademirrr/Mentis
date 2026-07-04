-- MENTIS COMMENT SYSTEM V4 UPGRADE

-- 0. CREATE NOTIFICATIONS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    entity_id UUID,
    entity_type TEXT,
    title TEXT,
    body TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. ADD COLUMNS
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- 2. CREATE INDEXES (Performance)
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- 3. ENABLE REALTIME BROADCAST
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;

-- 4. APPLY STRICT RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read" ON public.comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;

-- Drop new policies to make script idempotent on rerun
DROP POLICY IF EXISTS "Public read visible comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Public read visible comments" ON public.comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 5. RPC FUNCTIONS

-- A. get_threaded_comments_v4
CREATE OR REPLACE FUNCTION get_threaded_comments_v4(p_post_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    post_id uuid,
    parent_id uuid,
    content text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    is_hidden boolean,
    report_count integer,
    author_id uuid,
    author_username text,
    author_avatar_url text,
    author_full_name text,
    likes_count bigint,
    liked_by_me boolean,
    replies_count bigint,
    is_edited boolean,
    is_deleted boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.parent_id,
        c.content,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        c.is_hidden,
        c.report_count,
        u.user_id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url,
        u.full_name AS author_full_name,
        COALESCE(lc.likes_count, 0) AS likes_count,
        EXISTS (
            SELECT 1 FROM public.comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = p_user_id
        ) AS liked_by_me,
        COALESCE(rc.replies_count, 0) AS replies_count,
        (c.updated_at > c.created_at + interval '1 second') AS is_edited,
        (c.deleted_at IS NOT NULL) AS is_deleted
    FROM public.comments c
    LEFT JOIN public.user_profiles u ON c.user_id = u.user_id
    LEFT JOIN (
        SELECT comment_id, COUNT(*) AS likes_count FROM public.comment_likes GROUP BY comment_id
    ) lc ON lc.comment_id = c.id
    LEFT JOIN (
        SELECT sub_c.parent_id, COUNT(*) AS replies_count 
        FROM public.comments sub_c 
        WHERE sub_c.parent_id IS NOT NULL AND sub_c.deleted_at IS NULL 
        GROUP BY sub_c.parent_id
    ) rc ON rc.parent_id = c.id
    WHERE c.post_id = p_post_id AND c.is_hidden = false
    ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. create_comment_v4
CREATE OR REPLACE FUNCTION create_comment_v4(
    p_post_id uuid,
    p_content text,
    p_parent_id uuid DEFAULT NULL,
    p_mentioned_user_ids uuid[] DEFAULT '{}'
) RETURNS public.comments AS $$
DECLARE
    v_user_id uuid;
    v_comment public.comments;
    v_recent_comments integer;
    v_post_author uuid;
    v_parent_author uuid;
    m_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF trim(p_content) = '' THEN RAISE EXCEPTION 'Comment cannot be empty'; END IF;

    -- Spam protection: max 3 comments in last 10 seconds
    SELECT COUNT(*) INTO v_recent_comments
    FROM public.comments
    WHERE user_id = v_user_id AND created_at > now() - interval '10 seconds';
    
    IF v_recent_comments >= 3 THEN
        RAISE EXCEPTION 'Çok hızlı yorum gönderiyorsunuz.';
    END IF;

    INSERT INTO public.comments (user_id, post_id, parent_id, content)
    VALUES (v_user_id, p_post_id, p_parent_id, trim(p_content))
    RETURNING * INTO v_comment;

    -- Notifications
    IF p_parent_id IS NULL THEN
        SELECT author_id INTO v_post_author FROM public.posts WHERE id = p_post_id;
        IF v_post_author IS NOT NULL AND v_post_author != v_user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, title, body)
            VALUES (v_post_author, v_user_id, 'new_comment_on_post', v_comment.id, 'comment', 'Gönderine yeni bir yorum geldi', substr(trim(p_content), 1, 50));
        END IF;
    ELSE
        SELECT user_id INTO v_parent_author FROM public.comments WHERE id = p_parent_id;
        IF v_parent_author IS NOT NULL AND v_parent_author != v_user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, title, body)
            VALUES (v_parent_author, v_user_id, 'comment_reply', v_comment.id, 'comment', 'Yorumuna cevap verdi', substr(trim(p_content), 1, 50));
        END IF;
    END IF;

    IF array_length(p_mentioned_user_ids, 1) > 0 THEN
        FOREACH m_id IN ARRAY p_mentioned_user_ids
        LOOP
            IF m_id != v_user_id THEN
                INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, title, body)
                VALUES (m_id, v_user_id, 'mention', v_comment.id, 'comment', 'Senden bahsetti', substr(trim(p_content), 1, 50));
            END IF;
        END LOOP;
    END IF;

    RETURN v_comment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. edit_comment_v4
CREATE OR REPLACE FUNCTION edit_comment_v4(p_comment_id uuid, p_content text)
RETURNS public.comments AS $$
DECLARE
    v_comment public.comments;
BEGIN
    SELECT * INTO v_comment FROM public.comments WHERE id = p_comment_id;
    IF v_comment.user_id != auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_comment.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Cannot edit deleted comment'; END IF;
    IF v_comment.created_at < now() - interval '15 minutes' THEN RAISE EXCEPTION 'Edit window expired (15 mins)'; END IF;

    UPDATE public.comments
    SET content = trim(p_content), updated_at = now()
    WHERE id = p_comment_id
    RETURNING * INTO v_comment;

    RETURN v_comment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. delete_comment_v4
CREATE OR REPLACE FUNCTION delete_comment_v4(p_comment_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    v_comment public.comments;
    v_has_replies boolean;
BEGIN
    SELECT * INTO v_comment FROM public.comments WHERE id = p_comment_id;
    IF v_comment.user_id != auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;

    SELECT EXISTS(SELECT 1 FROM public.comments WHERE parent_id = p_comment_id) INTO v_has_replies;

    IF v_has_replies THEN
        UPDATE public.comments
        SET content = '[Silinmiş]', deleted_at = now()
        WHERE id = p_comment_id;
    ELSE
        DELETE FROM public.comments WHERE id = p_comment_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. toggle_comment_like_v4
CREATE OR REPLACE FUNCTION toggle_comment_like_v4(p_comment_id uuid)
RETURNS integer AS $$
DECLARE
    v_user_id uuid;
    v_liked boolean;
    v_count integer;
    v_comment_author uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT EXISTS(SELECT 1 FROM public.comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id) INTO v_liked;

    IF v_liked THEN
        DELETE FROM public.comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id;
    ELSE
        INSERT INTO public.comment_likes (comment_id, user_id) VALUES (p_comment_id, v_user_id);
        
        SELECT user_id INTO v_comment_author FROM public.comments WHERE id = p_comment_id;
        IF v_comment_author != v_user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, title, body)
            VALUES (v_comment_author, v_user_id, 'comment_like', p_comment_id, 'comment', 'Yorumunu beğendi', '');
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_count FROM public.comment_likes WHERE comment_id = p_comment_id;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
