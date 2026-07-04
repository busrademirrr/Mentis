-- LIVE VERIFICATION SCRIPT
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
    v_user_id UUID;
    v_post_id UUID;
    v_result JSON;
    v_record RECORD;
BEGIN
    -- 1. Find a valid user and a valid post
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    SELECT id INTO v_post_id FROM posts LIMIT 1;

    RAISE NOTICE 'Testing with User ID: %', v_user_id;
    RAISE NOTICE 'Testing with Post ID: %', v_post_id;

    -- 2. Spoof auth.uid() by temporarily setting the session setting
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_id)::text, true);

    -- 3. Execute toggle_save
    SELECT toggle_save(v_post_id) INTO v_result;
    RAISE NOTICE 'RPC Result: %', v_result;

    -- 4. Check post_interactions
    SELECT * INTO v_record FROM post_interactions WHERE user_id = v_user_id AND post_id = v_post_id AND type = 'save';
    IF FOUND THEN
        RAISE NOTICE 'Save Record Successfully Created!';
        RAISE NOTICE 'Record Details: ID=%, User=%, Post=%', v_record.id, v_record.user_id, v_record.post_id;
    ELSE
        RAISE NOTICE 'CRITICAL FAILURE: Save Record was NOT created!';
    END IF;

    -- 5. Teardown
    DELETE FROM post_interactions WHERE user_id = v_user_id AND post_id = v_post_id AND type = 'save';
END $$;
