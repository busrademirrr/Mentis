import { supabase } from '../lib/supabase';
import { User, UserStats, UserSocial, UserActivity, UserBadge } from '../types/database.types';

// Hardcoded for testing. In production, this comes from Supabase Auth.
export const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';

export const getUserProfile = async (userId: string = CURRENT_USER_ID) => {
    try {
        const [userRes, statsRes, socialsRes, badgesRes, repRes, postsRes, savedRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', userId).single(),
            supabase.from('user_stats').select('*').eq('user_id', userId).single(),
            supabase.from('user_socials').select('*').eq('user_id', userId),
            supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', userId),
            supabase.from('user_reputation').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('posts').select(`
                *,
                likes:post_likes(count),
                comments:comments(count)
            `).eq('author_id', userId).order('created_at', { ascending: false }),
            supabase.from('saved_posts').select(`
                *,
                post:posts(*)
            `).eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        return {
            user: userRes.data as User,
            stats: statsRes.data as UserStats,
            socials: socialsRes.data as UserSocial[] || [],
            badges: badgesRes.data || [],
            reputation: repRes.data || null,
            posts: postsRes.data || [],
            saved_posts: savedRes.data || [],
            // Cognitive traits can be derived on frontend based on stats/reputation
            cognitive_traits: [] 
        };
    } catch (error) {
        console.error('Error fetching real profile data:', error);
        return null; // Force real data, fail gracefully instead of showing fake data
    }
};

// Removed getOfflineMockProfile to strictly enforce real data


export const updateProfileInfo = async (updates: { full_name?: string, bio?: string }) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', CURRENT_USER_ID)
            .select()
            .single();
            
        if (error) throw error;
        return data as User;
    } catch (error) {
        console.error('Error updating profile info:', error);
        return null;
    }
};

export const updateAvatar = async (type: 'preset' | 'upload', value: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ avatar_type: type, avatar_value: value })
            .eq('id', CURRENT_USER_ID)
            .select()
            .single();
            
        if (error) throw error;
        return data as User;
    } catch (error) {
        console.error('Error updating avatar:', error);
        return null;
    }
};

export const addSocialLink = async (platform: string, url: string) => {
    try {
        const { data, error } = await supabase
            .from('user_socials')
            .insert({ user_id: CURRENT_USER_ID, platform, url })
            .select()
            .single();
            
        if (error) throw error;
        return data as UserSocial;
    } catch (error) {
        console.error('Error adding social link:', error);
        return null;
    }
};

export const deleteSocialLink = async (id: string) => {
    try {
        await supabase
            .from('user_socials')
            .delete()
            .eq('id', id)
            .eq('user_id', CURRENT_USER_ID);
        return true;
    } catch (error) {
        console.error('Error deleting social link:', error);
        return false;
    }
};

// Fallback user initialization for testing if stats don't exist
export const ensureUserStats = async (userId: string = CURRENT_USER_ID) => {
    try {
        const { data } = await supabase.from('user_stats').select('user_id').eq('user_id', userId).single();
        if (!data) {
            await supabase.from('user_stats').insert({
                user_id: userId,
                followers_count: 0,
                following_count: 0,
                argument_votes: 0,
                arena_wins: 0,
                duel_wins: 0,
                quiz_count: 0,
                content_count: 0
            });
        }
    } catch (error) {
        console.warn('Supabase offline, skipping ensureUserStats');
    }
};

export const toggleLikePost = async (postId: string) => {
    try {
        const { data, error } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', CURRENT_USER_ID);

        if (data && data.length > 0) {
            await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', CURRENT_USER_ID);
            return false;
        } else {
            await supabase.from('post_likes').insert({ post_id: postId, user_id: CURRENT_USER_ID });
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const toggleSavePost = async (postId: string) => {
    try {
        const { data, error } = await supabase
            .from('saved_posts')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', CURRENT_USER_ID);

        if (data && data.length > 0) {
            await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', CURRENT_USER_ID);
            return false;
        } else {
            await supabase.from('saved_posts').insert({ post_id: postId, user_id: CURRENT_USER_ID });
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const checkPostInteractions = async (postId: string) => {
    try {
        const [likes, saves] = await Promise.all([
            supabase.from('post_likes').select('*', { count: 'exact' }).eq('post_id', postId),
            supabase.from('saved_posts').select('*', { count: 'exact' }).eq('post_id', postId)
        ]);
        
        const isLiked = likes.data?.some(l => l.user_id === CURRENT_USER_ID) || false;
        const isSaved = saves.data?.some(s => s.user_id === CURRENT_USER_ID) || false;
        
        return {
            likeCount: likes.count || 0,
            saveCount: saves.count || 0,
            isLiked,
            isSaved
        };
    } catch (e) {
        return { likeCount: 0, saveCount: 0, isLiked: false, isSaved: false };
    }
};
