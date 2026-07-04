-- Supabase Schema for Mentis Feed Screen

-- 1. Users Table (assuming Auth is handled by Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Posts Table (Replaces feed_items)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('hero', 'article', 'discussion', 'quiz', 'challenge')),
  title text,
  content text,
  short_description text,
  category text,
  image_url text,
  is_premium boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  payload jsonb DEFAULT '{}'::jsonb, -- Store quiz options, debate sides, etc.
  author_id uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Likes
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- 4. Saved Posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- 5. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Quiz Answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  selected_answer integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, quiz_id)
);

-- 7. Debate Votes
CREATE TABLE IF NOT EXISTS public.debate_votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  debate_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  selected_option text NOT NULL CHECK (selected_option IN ('A', 'B')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, debate_id)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_votes ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allow reading everything, restrict inserts to authenticated users)
CREATE POLICY "Public read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.saved_posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.quiz_answers FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.debate_votes FOR SELECT USING (true);

-- Insert policies for mocked user
CREATE POLICY "Allow all" ON public.likes FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.saved_posts FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.comments FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.quiz_answers FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.debate_votes FOR ALL USING (true);
