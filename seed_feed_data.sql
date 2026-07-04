-- Mentis App: Örnek İçerik ve Kullanıcı Ekleme Scripti
-- Lütfen bu scripti Supabase SQL Editor'de çalıştırın.

DO $$
DECLARE
    u_felsefeci UUID := 'f0000000-0000-0000-0000-000000000001';
    u_bilimci   UUID := 'b0000000-0000-0000-0000-000000000002';
    u_sanatci   UUID := 'c0000000-0000-0000-0000-000000000003';
    
    p_kart_felsefe UUID := gen_random_uuid();
    p_quiz_bilim   UUID := gen_random_uuid();
    p_tart_sanat   UUID := gen_random_uuid();
    p_kart_psiko   UUID := gen_random_uuid();
    p_quiz_tekno   UUID := gen_random_uuid();
    p_tart_tarih   UUID := gen_random_uuid();
BEGIN

    -- 1. KULLANICILARI OLUŞTUR (Supabase auth.users tablosuna)
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
    (u_felsefeci, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'felsefe_uzmani@mentis.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"felsefe_uzmani", "full_name":"Felsefe Uzmanı"}', now(), now()),
    (u_bilimci, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bilim_insani@mentis.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"bilim_insani", "full_name":"Dr. Bilim"}', now(), now()),
    (u_sanatci, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sanat_tarihcisi@mentis.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"sanat_tarihcisi", "full_name":"Sanat Tarihçisi"}', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- 2. TRİGGER HATASINI DÜZELT
    -- (Eski posts_count sütunu bulunamadığı için uygulamada post atılamıyor, trigger'ı onaralım)
    CREATE OR REPLACE FUNCTION public.handle_post_stats() RETURNS TRIGGER AS $body$
    BEGIN
       -- user_stats güncellemesi devreden çıkarıldı. Uygulamanın post atmasına izin verilir.
       RETURN NEW;
    END;
    $body$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. İÇERİKLERİ EKLİYORUZ
    -- Bilgi Kartı (Felsefe)
    INSERT INTO public.posts (id, author_id, type, title, content, short_description, category, payload, created_at)
    VALUES (
        p_kart_felsefe, u_felsefeci, 'article', 'Platon''un Mağara Alegorisi',
        'İnsanların gerçeği değil, gerçeğin yansımalarını algıladığını anlatan meşhur düşünce deneyi. Siz zincirlerinizden kurtulabilir misiniz?',
        'Gerçekliği nasıl algılıyoruz?', 'Felsefe', '{"tags": ["Platon", "Gerçeklik"]}', now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Mini Quiz (Bilim)
    INSERT INTO public.posts (id, author_id, type, title, content, short_description, category, payload, created_at)
    VALUES (
        p_quiz_bilim, u_bilimci, 'quiz', 'Güneş Sistemi Bilmecesi',
        'Güneş sistemi hakkında temel bilginizi ölçün.',
        'Gezegenleri ne kadar iyi tanıyorsunuz?', 'Bilim', 
        '{"question": "Güneş sistemindeki en büyük gezegen hangisidir?", "options": ["Mars", "Venüs", "Jüpiter", "Satürn"], "correct_answer": 2, "difficulty": "Kolay", "xp_reward": 20}',
        now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Tartışma (Sanat)
    INSERT INTO public.posts (id, author_id, type, title, content, short_description, category, payload, created_at)
    VALUES (
        p_tart_sanat, u_sanatci, 'discussion', 'Sanat toplum için midir?',
        'Ebedi tartışma: Sanat sanat için midir, yoksa toplum için mi?',
        'Sanatın nihai amacı ne olmalıdır?', 'Sanat', 
        '{"title": "Sanatın Amacı", "content_snippet": "Sanat eseri mutlaka toplumsal bir mesaj vermeli midir?", "side_a": "Sanat İçindir", "side_b": "Toplum İçindir", "votes_A": 340, "votes_B": 350}',
        now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Bilgi Kartı (Psikoloji)
    INSERT INTO public.posts (id, author_id, type, title, content, short_description, category, payload, created_at)
    VALUES (
        p_kart_psiko, u_bilimci, 'article', 'Bilişsel Çelişki (Cognitive Dissonance)',
        'İnsanın inançları ile davranışları uyuşmadığında hissettiği zihinsel rahatsızlık. Sigara içmenin zararlı olduğunu bilip yine de içmek en klasik örnektir.',
        'Neden bazen bildiğimizin tersini yaparız?', 'Psikoloji', '{"tags": ["Davranış", "Zihin"]}', now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Mini Quiz (Teknoloji)
    INSERT INTO public.posts (id, author_id, type, title, content, short_description, category, payload, created_at)
    VALUES (
        p_quiz_tekno, u_bilimci, 'quiz', 'İnternet Tarihi',
        'World Wide Web ne zaman icat edildi?',
        'İnternetin kökenleri.', 'Teknoloji', 
        '{"question": "World Wide Web (WWW) hangi yıl Tim Berners-Lee tarafından icat edildi?", "options": ["1983", "1989", "1995", "2001"], "correct_answer": 1, "difficulty": "Orta", "xp_reward": 30}',
        now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Tartışma (Tarih)
    INSERT INTO public.posts (id, author_id, type, title, content, short_description, category, payload, created_at)
    VALUES (
        p_tart_tarih, u_felsefeci, 'discussion', 'Endüstri Devrimi',
        'Endüstri Devrimi insanlığa ilerleme mi getirdi yoksa doğanın yıkımını mı başlattı?',
        'Teknolojinin bedeli', 'Tarih', 
        '{"title": "Endüstri Devriminin Etkisi", "content_snippet": "Büyük ilerleme mi, çevresel çöküş mü?", "side_a": "Büyük İlerleme", "side_b": "Doğanın Çöküşü", "votes_A": 400, "votes_B": 250}',
        now()
    ) ON CONFLICT (id) DO NOTHING;

END $$;
