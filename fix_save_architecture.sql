-- 1. EKSİK TABLOYU OLUŞTUR
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Saved posts viewable by owner" ON public.saved_posts;
CREATE POLICY "Saved posts viewable by owner" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own saved posts" ON public.saved_posts;
CREATE POLICY "Users can manage own saved posts" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

-- 2. TOGGLE_SAVE FONKSİYONUNU GÜNCELLE
CREATE OR REPLACE FUNCTION toggle_save(p_post_id UUID)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- SAVED_POSTS TABLOSU KONTROLÜ
  SELECT EXISTS(
    SELECT 1 FROM public.saved_posts 
    WHERE user_id = v_user_id AND post_id = p_post_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.saved_posts 
    WHERE user_id = v_user_id AND post_id = p_post_id;
    RETURN json_build_object('success', true, 'action', 'unsaved');
  ELSE
    INSERT INTO public.saved_posts (user_id, post_id) 
    VALUES (v_user_id, p_post_id);
    RETURN json_build_object('success', true, 'action', 'saved');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eski yanlış verileri post_interactions'tan saved_posts'a taşı (migration)
INSERT INTO public.saved_posts (user_id, post_id, created_at)
SELECT user_id, post_id, created_at
FROM public.post_interactions
WHERE type = 'save'
ON CONFLICT DO NOTHING;

-- post_interactions içindeki save verilerini temizle
DELETE FROM public.post_interactions WHERE type = 'save';

NOTIFY pgrst, 'reload schema';
