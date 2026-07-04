-- mentis_delete_post_rpc.sql
-- Run this in Supabase SQL Editor to allow users to delete their own posts
-- safely bypassing RLS restrictions on cascade deleted child rows (like comments and likes by other users).

CREATE OR REPLACE FUNCTION public.delete_own_post(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_author_id UUID;
BEGIN
    -- Check if the post exists and belongs to the current user
    SELECT author_id INTO v_author_id
    FROM public.posts
    WHERE id = p_post_id;

    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'İçerik bulunamadı.';
    END IF;

    IF v_author_id != auth.uid() THEN
        RAISE EXCEPTION 'Bu içeriği silme yetkiniz yok.';
    END IF;

    -- Since this is SECURITY DEFINER, it bypasses RLS.
    -- The DELETE will cascade to comments, interactions, quiz_answers, etc.
    DELETE FROM public.posts WHERE id = p_post_id;

    RETURN TRUE;
END;
$$;
