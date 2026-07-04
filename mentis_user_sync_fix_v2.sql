-- MENTIS USER SYNC FIX
-- Run this in the Supabase SQL Editor.

-- This script ensures that EVERY user in auth.users has a corresponding record in public.users.
-- Missing public.user records cause Profile crashes and block all Save/Like actions.

INSERT INTO public.users (id, username, full_name, avatar_value)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)), 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'bottts'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- Recreate the trigger for future users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, avatar_value)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'bottts'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
