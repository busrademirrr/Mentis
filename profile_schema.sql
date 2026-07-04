  -- 1. Users tablosuna yeni sütunları ekleyelim (Eğer önceden eklendiyse hata vermez)
  ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS avatar_type text DEFAULT 'preset' CHECK (avatar_type IN ('preset', 'upload')),
    ADD COLUMN IF NOT EXISTS avatar_value text,
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS league text DEFAULT 'Acemi Filozof';

  -- 2. Eğer daha önce avatar_url sütunu varsa adını avatar_value olarak değiştirelim.
  -- DİKKAT: Eğer bu kod hata verirse (kolon zaten yok veya değiştirilmiş derse), sadece bu 2 satırı silip kalanını çalıştırın.
  ALTER TABLE public.users RENAME COLUMN avatar_url TO avatar_value;

  -- 3. Temel Tabloları Oluşturalım
  CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    argument_votes integer DEFAULT 0,
    arena_wins integer DEFAULT 0,
    duel_wins integer DEFAULT 0,
    quiz_count integer DEFAULT 0,
    content_count integer DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS public.user_socials (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    platform text NOT NULL,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.user_activity (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 4. Kaydedilenler Tablosunu Oluşturalım
  CREATE TABLE IF NOT EXISTS public.saved_content (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content_id uuid NOT NULL,
    type text DEFAULT 'post',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 5. Rozet Tablolarını Oluşturalım
  CREATE TABLE IF NOT EXISTS public.badges (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    icon text NOT NULL,
    condition_type text NOT NULL,
    condition_value integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_id)
  );

  -- 6. RLS (Güvenlik) Ayarlarını Açalım ve İzinleri Verelim
  ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_socials ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Allow all" ON public.user_stats FOR ALL USING (true);
  CREATE POLICY "Allow all" ON public.user_socials FOR ALL USING (true);
  CREATE POLICY "Allow all" ON public.user_activity FOR ALL USING (true);
  CREATE POLICY "Allow all" ON public.badges FOR ALL USING (true);
  CREATE POLICY "Allow all" ON public.user_badges FOR ALL USING (true);
  CREATE POLICY "Allow all" ON public.saved_content FOR ALL USING (true);
