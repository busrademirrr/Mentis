import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from '../services/profileService';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement_type: string;
    requirement_value: number;
}

export interface UserBadge {
    badge_id: string;
    earned_at: string;
    badge: Badge;
}

export const useUserBadges = () => {
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBadges = async () => {
        setLoading(true);
        
        // Fetch all available badges
        const { data: allData } = await supabase
            .from('badges')
            .select('*');
            
        if (allData) setAllBadges(allData);

        // Fetch user's unlocked badges
        const { data: userData } = await supabase
            .from('user_badges')
            .select('*, badge:badges(*)')
            .eq('user_id', CURRENT_USER_ID);

        if (userData) {
            setUserBadges(userData as any);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        fetchBadges();

        const channel = supabase.channel('user_badges_rt')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'user_badges', 
                filter: `user_id=eq.${CURRENT_USER_ID}` 
            }, () => {
                if (isMounted) fetchBadges();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    return { userBadges, allBadges, loading, refetch: fetchBadges };
};
