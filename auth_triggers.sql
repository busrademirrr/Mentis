-- ==========================================
-- PHASE 1: DATABASE TRIGGERS & RESERVATIONS
-- ==========================================

-- 1. Ensure username is strictly unique in the table
ALTER TABLE public.user_profiles 
ADD CONSTRAINT unique_username UNIQUE (username);

-- 2. Create the Trigger Function
-- This function will be called automatically by Supabase Auth every time a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, username, full_name, avatar_url, bio, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Use the username passed in the raw_user_meta_data during signup
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id, -- default avatar
    '',
    NOW(),
    NOW()
  );
  
  -- Automatically insert an onboarding record or default settings if necessary
  -- INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the Trigger to auth.users
-- We drop it first in case you are running this multiple times
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- END OF PHASE 1
-- Execute this script in your Supabase SQL Editor.
-- ==========================================
