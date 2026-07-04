-- 1. Create User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  push_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  mention_notifications boolean DEFAULT true,
  is_private boolean DEFAULT false,
  show_online_status boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
CREATE POLICY "Users can read own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Create Followers Table
CREATE TABLE IF NOT EXISTS public.followers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- RLS for followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read followers" ON public.followers;
CREATE POLICY "Public read followers" ON public.followers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own follows" ON public.followers;
CREATE POLICY "Users can insert own follows" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.followers;
CREATE POLICY "Users can delete own follows" ON public.followers FOR DELETE USING (auth.uid() = follower_id);


-- 3. Delete User Account RPC (SECURITY DEFINER to bypass auth restrictions for self-deletion)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the authenticated user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete associated data explicitly to avoid orphan issues if cascade is missing
    DELETE FROM public.comments WHERE user_id = v_user_id;
    DELETE FROM public.post_interactions WHERE user_id = v_user_id;
    DELETE FROM public.posts WHERE author_id = v_user_id;
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    DELETE FROM public.user_preferences WHERE user_id = v_user_id;
    DELETE FROM public.followers WHERE follower_id = v_user_id OR following_id = v_user_id;
    
    -- Delete from profiles/users
    DELETE FROM public.user_profiles WHERE id = v_user_id;
    DELETE FROM public.users WHERE id = v_user_id;
    
    -- Delete from Supabase Auth
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
