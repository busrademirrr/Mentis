-- ==============================================================================
-- MENTIS V7 - NOTIFICATIONS BACKEND UPGRADE
-- ==============================================================================

-- 1. CONSOLIDATE NOTIFICATIONS SCHEMA
-- Ensure we are using the correct actor_id / entity_id architecture.
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Safely alter old V2/V3 columns if they exist (just in case they were created before)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_entity_id') THEN
        ALTER TABLE public.notifications RENAME COLUMN related_entity_id TO entity_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'count') THEN
        ALTER TABLE public.notifications DROP COLUMN count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'sender_ids') THEN
        ALTER TABLE public.notifications DROP COLUMN sender_ids;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors safely
        NULL;
END $$;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. CREATE RLS POLICIES FOR NOTIFICATIONS
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications 
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "System insert notifications" ON public.notifications 
FOR INSERT WITH CHECK (true); -- Triggers and RPCs run with security definer usually, but allowing insert if needed.

-- 3. POST LIKE TRIGGER
-- When a user likes a post, generate a notification for the post author.
CREATE OR REPLACE FUNCTION public.handle_post_interaction_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author UUID;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.type = 'like') THEN
        -- Find post author
        SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
        
        -- Do not notify if user likes their own post
        IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, title, body)
            VALUES (v_post_author, NEW.user_id, 'post_like', NEW.post_id, 'post', 'Gönderin Beğenildi', 'Bir kullanıcı gönderini beğendi.');
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.type = 'like') THEN
        -- If user unlikes, we optionally can remove the unread notification.
        DELETE FROM public.notifications 
        WHERE type = 'post_like' AND actor_id = OLD.user_id AND entity_id = OLD.post_id;
    END IF;
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_interaction_notification ON public.post_interactions;
CREATE TRIGGER on_post_interaction_notification
AFTER INSERT OR DELETE ON public.post_interactions
FOR EACH ROW EXECUTE FUNCTION public.handle_post_interaction_notification();


-- 4. RPC: get_notifications_v1
-- Fetches notifications securely, enriching them with actor details (name, username, avatar)
CREATE OR REPLACE FUNCTION public.get_notifications_v1()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', n.id,
            'type', n.type,
            'entity_id', n.entity_id,
            'entity_type', n.entity_type,
            'title', n.title,
            'body', n.body,
            'is_read', n.is_read,
            'created_at', n.created_at,
            'actor', jsonb_build_object(
                'id', u.user_id,
                'name', u.full_name,
                'username', u.username,
                'avatar_url', COALESCE(u.avatar_url, u.avatar_value)
            )
        ) ORDER BY n.created_at DESC
    ), '[]'::jsonb) INTO v_result
    FROM public.notifications n
    LEFT JOIN public.user_profiles u ON n.actor_id = u.user_id
    WHERE n.user_id = v_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: mark_notifications_read
-- Marks all unread notifications as read for the current user
CREATE OR REPLACE FUNCTION public.mark_notifications_read()
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.notifications
    SET is_read = true
    WHERE user_id = v_user_id AND is_read = false;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
