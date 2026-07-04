import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from '../services/profileService';

export interface UserActivity {
    id: string;
    type: 'post' | 'save' | 'debate_win' | 'arena_win' | 'badge_earn';
    entity_id: string;
    metadata: any;
    created_at: string;
}

export const useUserActivity = () => {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_activity')
            .select('*')
            .eq('user_id', CURRENT_USER_ID)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setActivities(data as UserActivity[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        fetchActivity();

        const channel = supabase.channel('user_activity_rt')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'user_activity', 
                filter: `user_id=eq.${CURRENT_USER_ID}` 
            }, (payload) => {
                if (isMounted) {
                    setActivities(prev => [payload.new as UserActivity, ...prev].slice(0, 20));
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    return { activities, loading, refetch: fetchActivity };
};
