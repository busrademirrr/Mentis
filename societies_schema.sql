-- Intellectual Societies Table
CREATE TABLE public.societies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  emblem_url text,
  prestige_tier text DEFAULT 'standard', -- e.g., 'elite', 'standard', 'academic'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Society Memberships
CREATE TABLE public.society_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  society_id uuid REFERENCES public.societies(id) NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  role text DEFAULT 'member', -- 'member', 'thinker', 'moderator'
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(society_id, user_id)
);

-- Live Debates
CREATE TABLE public.live_debates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  society_id uuid REFERENCES public.societies(id) NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  thesis text NOT NULL,
  heat_score integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Realtime Presence (Ephemeral table or used for persistence)
CREATE TABLE public.live_presence (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  society_id uuid REFERENCES public.societies(id),
  debate_id uuid REFERENCES public.live_debates(id),
  status text DEFAULT 'online', -- 'online', 'typing', 'reading'
  last_seen timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Societies are viewable by everyone" ON public.societies FOR SELECT USING (true);
CREATE POLICY "Debates are viewable by everyone" ON public.live_debates FOR SELECT USING (true);
