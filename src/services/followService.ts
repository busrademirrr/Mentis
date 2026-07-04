import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from './profileService';

export const toggleFollow = async (targetUserId: string) => {
    try {
        const { data } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', CURRENT_USER_ID)
            .eq('following_id', targetUserId);

        if (data && data.length > 0) {
            await supabase
                .from('user_follows')
                .delete()
                .eq('follower_id', CURRENT_USER_ID)
                .eq('following_id', targetUserId);
            return { followed: false };
        } else {
            await supabase
                .from('user_follows')
                .insert({
                    follower_id: CURRENT_USER_ID,
                    following_id: targetUserId
                });
            return { followed: true };
        }
    } catch (e) {
        console.error('Error toggling follow:', e);
        return { followed: false, error: e };
    }
};

export const getFollowers = async (userId: string = CURRENT_USER_ID) => {
    try {
        const { data, error } = await supabase
            .from('user_follows')
            .select(`
                *,
                follower:users!follower_id(id, name, avatar_url)
            `)
            .eq('following_id', userId);
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching followers:', e);
        return [];
    }
};

export const getFollowing = async (userId: string = CURRENT_USER_ID) => {
    try {
        const { data, error } = await supabase
            .from('user_follows')
            .select(`
                *,
                following:users!following_id(id, name, avatar_url)
            `)
            .eq('follower_id', userId);
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching following:', e);
        return [];
    }
};
