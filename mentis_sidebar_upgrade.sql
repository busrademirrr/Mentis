-- Mentis Right Sidebar Required Tables

CREATE TABLE IF NOT EXISTS public.user_reading_stats (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    weekly_goal integer DEFAULT 10,
    current_progress integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_cognitive_traits (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    trait_name text NOT NULL,
    score integer DEFAULT 0,
    UNIQUE(user_id, trait_name)
);

CREATE TABLE IF NOT EXISTS public.collections (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    cover_url text,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    added_at timestamp with time zone DEFAULT now(),
    UNIQUE(collection_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.reading_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    read_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reputation (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    knowledge_score integer DEFAULT 0,
    content_quality_score integer DEFAULT 0,
    impact_score integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_activity (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL, -- e.g., 'SAVED_POST', 'FOLLOWED_USER', 'ADDED_TO_COLLECTION'
    target_id uuid, -- Reference to post, user, or collection
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for all
ALTER TABLE public.user_reading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cognitive_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Simple public read policies for demo purposes
CREATE POLICY "Public Read reading_stats" ON public.user_reading_stats FOR SELECT USING (true);
CREATE POLICY "Public Read cognitive_traits" ON public.user_cognitive_traits FOR SELECT USING (true);
CREATE POLICY "Public Read collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Public Read collection_items" ON public.collection_items FOR SELECT USING (true);
CREATE POLICY "Public Read reading_history" ON public.reading_history FOR SELECT USING (true);
CREATE POLICY "Public Read user_reputation" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Public Read user_activity" ON public.user_activity FOR SELECT USING (true);
