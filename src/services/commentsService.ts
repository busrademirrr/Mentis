import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from './profileService';

export const getCommentsForPost = async (postId: string) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:users(id, name, avatar_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching comments:', e);
        return [];
    }
};

export const postComment = async (postId: string, content: string, parentCommentId: string | null = null) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert({
                user_id: CURRENT_USER_ID,
                post_id: postId,
                parent_comment_id: parentCommentId,
                content
            })
            .select(`
                *,
                user:users(id, name, avatar_url)
            `)
            .single();
            
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error posting comment:', e);
        return null;
    }
};

export const deleteComment = async (commentId: string) => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', CURRENT_USER_ID);
            
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Error deleting comment:', e);
        return false;
    }
};
