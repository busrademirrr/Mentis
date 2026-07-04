-- ==========================================
-- LIVING INTELLECTUAL IDENTITY SYSTEM MIGRATION
-- ==========================================

-- 1. USER REPUTATION
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  knowledge_score INTEGER DEFAULT 0,
  debate_score INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 100,
  influence_score INTEGER DEFAULT 0,
  reading_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USER COGNITIVE TRAITS
CREATE TABLE IF NOT EXISTS public.user_cognitive_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL,
  trait_name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trait_key)
);

-- 3. BADGES ENHANCEMENT
ALTER TABLE public.badges 
  ADD COLUMN IF NOT EXISTS rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS unlock_condition TEXT,
  ADD COLUMN IF NOT EXISTS gradient_start TEXT,
  ADD COLUMN IF NOT EXISTS gradient_end TEXT,
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;

-- 4. USER BADGES ENHANCEMENT
ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;

-- 5. ACTIVITY ENHANCEMENT
-- Recreating user_activity to be more flexible, or just adding metadata if it already exists
ALTER TABLE public.user_activity
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Optional: Drop constraint if we need more entity types, but we'll stick to text types for now
-- ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_type_check;

-- RLS
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reputation viewable by everyone" ON public.user_reputation FOR SELECT USING (true);

ALTER TABLE public.user_cognitive_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public cognitive traits viewable by everyone" ON public.user_cognitive_traits FOR SELECT USING (true);

-- Trigger to create user_reputation on new user
CREATE OR REPLACE FUNCTION handle_new_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_reputation (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to replace safely
DROP TRIGGER IF EXISTS on_auth_user_created_reputation ON auth.users;

CREATE TRIGGER on_auth_user_created_reputation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_reputation();
