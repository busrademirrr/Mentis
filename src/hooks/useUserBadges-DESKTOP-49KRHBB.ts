import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
    const { user } = useAuth();
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBadges = async () => {
        if (!user) return;
        setLoading(true);
        const [userBadgesRes, allBadgesRes] = await Promise.all([
            supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', user.id),
            supabase.from('badges').select('*').order('requirement_value', { ascending: true })
        ]);

        if (!userBadgesRes.error) setUserBadges(userBadgesRes.data as UserBadge[]);
        if (!allBadgesRes.error) setAllBadges(allBadgesRes.data as Badge[]);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchBadges();
        }
    }, [user?.id]);

    return { userBadges, allBadges, loading, refetch: fetchBadges };
};
