import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { MentisNotification } from '../services/notificationService';

interface NotificationContextProps {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>({
    unreadCount: 0,
    refreshUnreadCount: async () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = async () => {
        if (!user?.id) return;
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (!error && count !== null) {
                setUnreadCount(count);
            }
        } catch (e) {
            console.error('Error fetching unread count:', e);
        }
    };

    useEffect(() => {
        if (!user?.id) {
            setUnreadCount(0);
            return;
        }

        let isMounted = true;
        refreshUnreadCount();

        // Realtime sync for notifications table
        const channel = supabase.channel(`global_notifications_${user.id}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (isMounted) {
                        // Optimistically update count or just refetch
                        refreshUnreadCount();
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
