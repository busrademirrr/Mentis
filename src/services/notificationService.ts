import { supabase } from '../lib/supabase';

export interface NotificationActor {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
}

export type NotificationType = 'message' | 'message_request' | 'unread_reminder' | 'follow' | 'follow_request' | 'follow_accepted' | 'arena_match_found' | 'arena_won' | 'arena_lost' | 'arena_promotion' | 'achievement' | 'system';

export interface MentisNotification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: NotificationType;
    title: string;
    body: string | null;
    reference_id: string | null;
    is_read: boolean;
    created_at: string;
    actor: NotificationActor | null;
}

/**
 * Fetches paginated notifications using the V2 RPC
 */
export const getNotificationsV2 = async (limit: number = 20, cursor: string | null = null): Promise<MentisNotification[]> => {
    try {
        const { data, error } = await supabase.rpc('get_notifications_v2', {
            p_limit: limit,
            p_cursor: cursor
        });
        if (error) throw error;
        return data as MentisNotification[] || [];
    } catch (err) {
        console.error('Error fetching notifications v2:', err);
        return [];
    }
};

/**
 * Marks all current unread notifications as read
 */
export const markAllAsRead = async (): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        return false;
    }
};

/**
 * Marks a specific notification as read
 */
export const markAsRead = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return false;
    }
};

/**
 * Creates a notification for another user
 */
export const createNotification = async (
    userId: string,
    actorId: string | null,
    type: NotificationType,
    title: string,
    body: string | null = null,
    referenceId: string | null = null
): Promise<boolean> => {
    try {
        // Prevent sending notification to self
        if (userId === actorId) return false;

        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            actor_id: actorId,
            type,
            title,
            body,
            reference_id: referenceId,
            is_read: false
        });

        if (error) {
            console.error('Supabase error inserting notification:', error);
            throw error;
        }
        return true;
    } catch (err) {
        console.error('Error creating notification:', err);
        return false;
    }
};
