-- ====================================================================
-- PHASE 0.5: POST TYPE STANDARDIZATION MIGRATION
-- Mentis Feed Type Mapping Fix
-- ====================================================================

BEGIN;

-- 1. Önce eski check constraint'i kaldıralım
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;

-- 2. Eski verileri standardize edilmiş formata geçirelim
UPDATE public.posts
SET type = 'knowledge_card'
WHERE type IN ('article', 'info', 'knowledge');

UPDATE public.posts
SET type = 'discussion'
WHERE type = 'debate';

-- 3. Yeni check constraint'i güncel tiplerle tekrar ekleyelim
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check 
CHECK (type IN ('knowledge_card', 'discussion', 'quiz', 'hero', 'challenge'));

COMMIT;
