-- ARENA ELO UPDATE RPC
-- This function allows securely updating a user's Arena ELO bypassing RLS restrictions.
-- Run this in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION update_arena_elo(p_user_id UUID, p_elo_change INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET arena_elo = COALESCE(arena_elo, 1200) + p_elo_change
    WHERE id = p_user_id;
END;
$$;
