-- ==============================================================================
-- MENTIS V8 - DIRECT MESSAGING V1 UPGRADE
-- ==============================================================================

-- 1. CONVERSATIONS TABLE (Future Group Chat Ready)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type VARCHAR(20) DEFAULT 'direct', -- direct, group, system
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 3. MESSAGES TABLE (Soft Delete & Knowledge Metadata Ready)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, knowledge_card, arena, system
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g., { post_id, title, category, preview_text, cover_url }
    created_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. MESSAGE READS (Read Receipts & Unread Counter System)
CREATE TABLE IF NOT EXISTS public.message_reads (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (message_id, user_id)
);
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;


-- 5. RLS SECURITY POLICIES

-- Conversations: A user can select/view a conversation ONLY if they are a participant.
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp 
        WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
);

-- Participants: Users can see who else is in their conversations.
DROP POLICY IF EXISTS "Users view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users view participants in their conversations" ON public.conversation_participants
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp 
        WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
);

-- Messages: A user can read messages ONLY in conversations they participate in.
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp 
        WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
);

-- Messages: A user can insert a message ONLY into a conversation they participate in.
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages" ON public.messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp 
        WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
);

-- Messages: A user can SOFT DELETE only their own messages.
DROP POLICY IF EXISTS "Sender can soft delete message" ON public.messages;
CREATE POLICY "Sender can soft delete message" ON public.messages
FOR UPDATE USING (
    auth.uid() = sender_id
);

-- Message Reads: Users can view read receipts for their conversations.
DROP POLICY IF EXISTS "Participants view read receipts" ON public.message_reads;
CREATE POLICY "Participants view read receipts" ON public.message_reads
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE m.id = message_id AND cp.user_id = auth.uid()
    )
);

-- Message Reads: Users can insert read receipts for messages they receive.
DROP POLICY IF EXISTS "Users can insert read receipts" ON public.message_reads;
CREATE POLICY "Users can insert read receipts" ON public.message_reads
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);


-- 6. RPC: GET OR CREATE DIRECT CONVERSATION (Duplicate Prevention)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_current_user_id UUID := auth.uid();
BEGIN
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_current_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot create a direct conversation with yourself';
    END IF;

    -- Look for an existing DIRECT conversation where BOTH users are exactly the only participants
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = v_current_user_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = p_other_user_id
    WHERE c.conversation_type = 'direct'
    GROUP BY c.id
    HAVING COUNT(cp1.user_id) = 1 AND COUNT(cp2.user_id) = 1;

    -- If found, return the existing conversation ID
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- Otherwise, create a new conversation
    INSERT INTO public.conversations (conversation_type) VALUES ('direct') RETURNING id INTO v_conversation_id;

    -- Insert both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES 
        (v_conversation_id, v_current_user_id),
        (v_conversation_id, p_other_user_id);

    RETURN v_conversation_id;
END;
$$;


-- 7. NOTIFICATION INTEGRATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_target_user UUID;
BEGIN
    -- Update conversation last_message_at
    UPDATE public.conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;

    -- Get the other participant to notify
    FOR v_target_user IN 
        SELECT user_id FROM public.conversation_participants 
        WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
    LOOP
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, title, body)
        VALUES (
            v_target_user, 
            NEW.sender_id, 
            'dm', 
            NEW.conversation_id, 
            'message', 
            'Yeni Mesaj', 
            CASE 
                WHEN NEW.message_type = 'knowledge_card' THEN 'Bir bilgi kartı paylaştı'
                ELSE substring(NEW.content from 1 for 50) 
            END
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();


-- 8. RPC: GET CHAT LIST WITH UNREAD COUNTS
CREATE OR REPLACE FUNCTION public.get_chat_list()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT COALESCE(jsonb_agg(chat_data ORDER BY (chat_data->>'last_message_at') DESC), '[]'::jsonb) INTO v_result
    FROM (
        SELECT 
            jsonb_build_object(
                'id', c.id,
                'last_message_at', c.last_message_at,
                'conversation_type', c.conversation_type,
                'partner', jsonb_build_object(
                    'id', u.user_id,
                    'name', u.full_name,
                    'username', u.username,
                    'avatar_url', u.avatar_url,
                    'last_active_at', u.last_active_at
                ),
                'last_message', (
                    SELECT jsonb_build_object(
                        'content', m.content,
                        'message_type', m.message_type,
                        'is_deleted', m.is_deleted,
                        'sender_id', m.sender_id,
                        'created_at', m.created_at
                    )
                    FROM public.messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'unread_count', (
                    SELECT COUNT(*)
                    FROM public.messages m
                    WHERE m.conversation_id = c.id 
                    AND m.sender_id != v_current_user_id
                    AND m.is_deleted = false
                    AND NOT EXISTS (
                        SELECT 1 FROM public.message_reads mr WHERE mr.message_id = m.id AND mr.user_id = v_current_user_id
                    )
                )
            ) as chat_data
        FROM public.conversations c
        JOIN public.conversation_participants cp ON c.id = cp.conversation_id
        -- JOIN again to find the other participant(s)
        JOIN public.conversation_participants other_cp ON c.id = other_cp.conversation_id AND other_cp.user_id != v_current_user_id
        JOIN public.user_profiles u ON other_cp.user_id = u.user_id
        WHERE cp.user_id = v_current_user_id
    ) sub;

    RETURN v_result;
END;
$$;
