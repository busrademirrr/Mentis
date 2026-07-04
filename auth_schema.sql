-- Mentis Premium Authentication & Onboarding Schema
-- Execute this script in your Supabase SQL Editor

-- 1. Create Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.user_profiles FOR SELECT 
USING ( true );

CREATE POLICY "Users can insert their own profile." 
ON public.user_profiles FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own profile." 
ON public.user_profiles FOR UPDATE 
USING ( auth.uid() = user_id );


-- 2. Create User Interests Table (for Onboarding)
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Policies for user_interests
CREATE POLICY "Users can see their own interests" 
ON public.user_interests FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own interests" 
ON public.user_interests FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own interests" 
ON public.user_interests FOR DELETE 
USING ( auth.uid() = user_id );


-- 3. Create Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'system',
    privacy_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view own settings" 
ON public.user_settings FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can update own settings" 
ON public.user_settings FOR UPDATE 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK ( auth.uid() = user_id );


-- 4. Function to Automatically create profile and settings on Signup (Optional but recommended)
-- This triggers immediately after Supabase Auth creates a new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
