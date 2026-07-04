import { supabase } from '../lib/supabase';

export const getUserBadges = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_badges')
            .select(`
                *,
                badge:badges(*)
            `)
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

        if (error) {
            console.error('Error fetching user badges:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('getUserBadges error:', error);
        return [];
    }
};

export const getFeaturedBadges = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_badges')
            .select('*, badge:badges(*)')
            .eq('user_id', userId)
            .eq('is_featured', true)
            .limit(3);
            
        if (error) return [];
        return data;
    } catch {
        return [];
    }
};
