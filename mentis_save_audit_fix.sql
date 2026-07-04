-- MENTIS DB TRIGGER FIX
-- Run this in the Supabase SQL Editor.

-- The database is currently blocking ALL save operations because of a broken trigger
-- that calls a missing function (`log_user_activity`). We must drop these broken triggers.

DROP TRIGGER IF EXISTS trigger_activity_save ON post_interactions;
DROP TRIGGER IF EXISTS trigger_activity_post ON posts;
DROP TRIGGER IF EXISTS trigger_activity_badge ON user_badges;
DROP TRIGGER IF EXISTS trigger_activity_debate_join ON room_members;

-- Ensure toggle_save RPC is intact
CREATE OR REPLACE FUNCTION toggle_save(p_post_id UUID)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM post_interactions 
    WHERE user_id = v_user_id AND post_id = p_post_id AND type = 'save'
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM post_interactions 
    WHERE user_id = v_user_id AND post_id = p_post_id AND type = 'save';
    RETURN json_build_object('success', true, 'action', 'unsaved');
  ELSE
    INSERT INTO post_interactions (user_id, post_id, type) 
    VALUES (v_user_id, p_post_id, 'save');
    RETURN json_build_object('success', true, 'action', 'saved');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
