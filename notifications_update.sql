-- MENTIS NOTIFICATIONS V2 DATABASE UPDATE

-- 1. Update Users Table for Expo Push Notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. Update Notifications Table
-- Add new columns safely
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Since we are keeping the existing table, we will ensure it has the right structure.
-- The previous schema had entity_id and entity_type. We can migrate entity_id to reference_id if it exists.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='entity_id') THEN
    -- If reference_id is newly created, copy data from entity_id
    UPDATE notifications SET reference_id = entity_id::uuid WHERE reference_id IS NULL AND entity_id IS NOT NULL AND entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if migration fails
END $$;

-- 3. Create the robust V2 fetching function with cursor-based pagination
CREATE OR REPLACE FUNCTION get_notifications_v2(p_limit INT DEFAULT 20, p_cursor TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_me UUID := auth.uid();
    result JSON;
BEGIN
    IF v_me IS NULL THEN
        RETURN '[]'::JSON;
    END IF;

    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO result
    FROM (
        SELECT 
            n.id,
            n.type,
            n.title,
            n.body,
            n.reference_id,
            n.is_read,
            n.created_at,
            (
                SELECT json_build_object(
                    'id', u.id,
                    'name', u.full_name,
                    'username', u.username,
                    'avatar_url', u.avatar_value
                )
                FROM users u
                WHERE u.id = n.actor_id
            ) as actor
        FROM notifications n
        WHERE n.user_id = v_me
        AND (p_cursor IS NULL OR n.created_at < p_cursor)
        ORDER BY n.created_at DESC
        LIMIT p_limit
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure RLS policies are correct for real-time
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can select their own notifications'
    ) THEN
        CREATE POLICY "Users can select their own notifications" ON notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications" ON notifications
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Insert policy for system/dev tools to insert notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert notifications'
    ) THEN
        CREATE POLICY "Users can insert notifications" ON notifications
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;
