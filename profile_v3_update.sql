-- ==========================================================
-- MENTIS PROFILE V3 UPDATE SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==========================================================

-- 1. ADD NEW COLUMNS TO USERS TABLE
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS education TEXT;

-- 2. CREATE FOLLOWERS TABLE
CREATE TABLE IF NOT EXISTS followers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- RLS FOR FOLLOWERS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Followers are viewable by everyone." ON followers;
CREATE POLICY "Followers are viewable by everyone." 
ON followers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own follows." ON followers;
CREATE POLICY "Users can insert their own follows." 
ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete their own follows." ON followers;
CREATE POLICY "Users can delete their own follows." 
ON followers FOR DELETE USING (auth.uid() = follower_id);

-- 3. STORAGE BUCKETS AND RLS
-- Enable storage buckets if not exists (Requires superuser/service role, so this might fail if run with low privileges. If so, create manually via UI).
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Avatar Insert" ON storage.objects;
CREATE POLICY "Avatar Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Avatar Update" ON storage.objects;
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Avatar Delete" ON storage.objects;
CREATE POLICY "Avatar Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for covers bucket
DROP POLICY IF EXISTS "Cover Public Access" ON storage.objects;
CREATE POLICY "Cover Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
DROP POLICY IF EXISTS "Cover Insert" ON storage.objects;
CREATE POLICY "Cover Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Cover Update" ON storage.objects;
CREATE POLICY "Cover Update" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Cover Delete" ON storage.objects;
CREATE POLICY "Cover Delete" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 4. GET PROFILE STATS RPC
-- Replaces old stats and provides real counts for everything
CREATE OR REPLACE FUNCTION get_profile_stats_v3(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_follower_count INT;
    v_following_count INT;
    v_arena_matches INT;
    v_arena_wins INT;
    v_posts_count INT;
    v_comments_count INT;
    v_likes_received INT;
    v_saves_received INT;
    v_reputation_score INT;
BEGIN
    -- Topluluk
    SELECT COUNT(*) INTO v_follower_count FROM followers WHERE following_id = p_user_id;
    SELECT COUNT(*) INTO v_following_count FROM followers WHERE follower_id = p_user_id;
    
    -- Arena
    SELECT COUNT(*) INTO v_arena_matches FROM arena_matches WHERE player1_id = p_user_id OR player2_id = p_user_id;
    SELECT COUNT(*) INTO v_arena_wins FROM arena_matches WHERE winner_id = p_user_id;
    
    -- İçerik
    SELECT COUNT(*) INTO v_posts_count FROM posts WHERE author_id = p_user_id;
    SELECT COUNT(*) INTO v_comments_count FROM comments WHERE user_id = p_user_id;
    
    -- Alınan Etkileşimler
    SELECT COUNT(*) INTO v_likes_received FROM post_interactions pi
    JOIN posts p ON p.id = pi.post_id
    WHERE p.author_id = p_user_id AND pi.type = 'like';
    
    SELECT COUNT(*) INTO v_saves_received FROM post_interactions pi
    JOIN posts p ON p.id = pi.post_id
    WHERE p.author_id = p_user_id AND pi.type = 'save';
    
    -- İtibar Puanı Hesaplaması (Basit Ağırlıklandırma)
    v_reputation_score := (v_arena_wins * 10) + (v_posts_count * 5) + (v_comments_count * 2) + (v_follower_count * 3);

    RETURN json_build_object(
        'follower_count', v_follower_count,
        'following_count', v_following_count,
        'arena_matches', v_arena_matches,
        'arena_wins', v_arena_wins,
        'posts_count', v_posts_count,
        'comments_count', v_comments_count,
        'likes_received', v_likes_received,
        'saves_received', v_saves_received,
        'reputation_score', v_reputation_score
    );
END;
$$ LANGUAGE plpgsql;

-- 5. UPDATE GET_PROFILE_V5 to return the new fields and stats
DROP FUNCTION IF EXISTS get_profile_v5(UUID, UUID);
CREATE OR REPLACE FUNCTION get_profile_v5(p_target_user_id UUID, p_viewer_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile JSON;
    v_stats JSON;
    v_relationship JSON;
    v_is_following BOOLEAN;
BEGIN
    -- Profile Bilgileri
    SELECT json_build_object(
        'id', id,
        'username', username,
        'name', COALESCE(full_name, username),
        'bio', bio,
        'avatar_url', COALESCE(avatar_url, avatar_value),
        'cover_photo_url', cover_url,
        'location', location,
        'website', website,
        'occupation', occupation,
        'education', education,
        'level', level,
        'is_verified', false,
        'created_at', created_at
    ) INTO v_profile
    FROM users WHERE id = p_target_user_id;

    -- Eğer kullanıcı yoksa user_profiles tablosundan dene (Geriye dönük uyumluluk)
    IF v_profile IS NULL THEN
        SELECT json_build_object(
            'id', user_id,
            'username', username,
            'name', COALESCE(full_name, username),
            'bio', bio,
            'avatar_url', avatar_url,
            'cover_photo_url', cover_photo_url,
            'location', NULL,
            'website', NULL,
            'occupation', NULL,
            'education', NULL,
            'level', 1,
            'is_verified', false,
            'created_at', created_at
        ) INTO v_profile
        FROM user_profiles WHERE user_id = p_target_user_id;
    END IF;

    -- Hala yoksa null dön
    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    -- İstatistikler (Yeni v3 Fonksiyonunu Çağır)
    v_stats := get_profile_stats_v3(p_target_user_id);

    -- İlişki (Takip ediyor mu?)
    SELECT EXISTS (
        SELECT 1 FROM followers 
        WHERE follower_id = p_viewer_user_id AND following_id = p_target_user_id
    ) INTO v_is_following;

    v_relationship := json_build_object(
        'is_self', p_target_user_id = p_viewer_user_id,
        'is_following', v_is_following
    );

    RETURN json_build_object(
        'profile', v_profile,
        'stats', v_stats,
        'relationship', v_relationship
    );
END;
$$ LANGUAGE plpgsql;

-- 6. TOGGLE FOLLOW RPC
CREATE OR REPLACE FUNCTION toggle_follow_v1(p_target_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_viewer_id UUID;
    v_is_following BOOLEAN;
BEGIN
    v_viewer_id := auth.uid();
    
    IF v_viewer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Kendi kendini takip edemez
    IF v_viewer_id = p_target_id THEN
        RAISE EXCEPTION 'Cannot follow yourself';
    END IF;

    -- Takip durumunu kontrol et
    SELECT EXISTS (
        SELECT 1 FROM followers 
        WHERE follower_id = v_viewer_id AND following_id = p_target_id
    ) INTO v_is_following;

    IF v_is_following THEN
        -- Takibi bırak
        DELETE FROM followers WHERE follower_id = v_viewer_id AND following_id = p_target_id;
        RETURN FALSE;
    ELSE
        -- Takip et
        INSERT INTO followers (follower_id, following_id) VALUES (v_viewer_id, p_target_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;
