-- ==========================================
-- MENTIS FINAL CORE SYSTEM MIGRATION
-- (Badges, Cognitive Profile, Messaging)
-- ==========================================

-- ==========================================
-- 1. COGNITIVE PROFILE SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_cognitive_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trait_key VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trait_key)
);

ALTER TABLE public.user_cognitive_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cognitive traits viewable by everyone" ON public.user_cognitive_traits FOR SELECT USING (true);
CREATE POLICY "Users can manage own cognitive traits" ON public.user_cognitive_traits FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 2. BADGES & LEAGUES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rarity VARCHAR(50) DEFAULT 'common', -- common, rare, epic, legendary
  condition_type VARCHAR(50) NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  icon VARCHAR(50),
  gradient_start VARCHAR(20),
  gradient_end VARCHAR(20),
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can manage own user badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 3. DM & MESSAGING SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) DEFAULT 'direct', -- direct, group
  last_message_id UUID, -- Will be a foreign key to messages but added later to avoid circular dependency
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  last_read_at TIMESTAMPTZ DEFAULT now(),
  muted BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, system
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Add foreign key back to conversations
ALTER TABLE public.conversations 
  ADD CONSTRAINT fk_last_message 
  FOREIGN KEY (last_message_id) 
  REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Messaging RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- Users can only view conversations they are a member of
CREATE POLICY "Conversations viewable by members" ON public.conversations 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = public.conversations.id AND user_id = auth.uid())
  );

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by conversation members" ON public.conversation_members 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = public.conversation_members.conversation_id AND cm.user_id = auth.uid())
  );
CREATE POLICY "Users can manage own membership" ON public.conversation_members FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages viewable by conversation members" ON public.messages 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = public.messages.conversation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert messages to their conversations" ON public.messages 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = NEW.conversation_id AND user_id = auth.uid())
    AND auth.uid() = sender_id
  );
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- Trigger to update conversation updated_at and last_message_id
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET updated_at = now(), last_message_id = NEW.id
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation ON public.messages;
CREATE TRIGGER trg_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_new_message();
