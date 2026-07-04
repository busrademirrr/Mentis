import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from './profileService';

export const getSavedCollections = async () => {
    try {
        const { data, error } = await supabase
            .from('save_collections')
            .select('*')
            .eq('user_id', CURRENT_USER_ID)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error fetching collections:', e);
        return [];
    }
};

export const createSaveCollection = async (title: string, description: string = '', is_public: boolean = false) => {
    try {
        const { data, error } = await supabase
            .from('save_collections')
            .insert({ user_id: CURRENT_USER_ID, title, description, is_public })
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error creating collection:', e);
        return null;
    }
};

export const getSavedPosts = async (collectionId?: string) => {
    try {
        // Fetch saved posts and join with posts table
        let query = supabase
            .from('saved_posts')
            .select(`
                *,
                post:posts(
                    *,
                    likes:post_likes(count),
                    comments:comments(count)
                )
            `)
            .eq('user_id', CURRENT_USER_ID);
            
        if (collectionId) {
            query = query.eq('collection_id', collectionId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching saved posts:', e);
        return [];
    }
};

export const toggleSave = async (postId: string, collectionId?: string) => {
    try {
        const { data } = await supabase
            .from('saved_posts')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', CURRENT_USER_ID);

        if (data && data.length > 0) {
            await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', CURRENT_USER_ID);
            return { saved: false };
        } else {
            const insertData: any = { post_id: postId, user_id: CURRENT_USER_ID };
            if (collectionId) insertData.collection_id = collectionId;
            await supabase.from('saved_posts').insert(insertData);
            return { saved: true };
        }
    } catch (e) {
        console.error('Error toggling save:', e);
        return { saved: false, error: e };
    }
};

export const moveSavedPost = async (savedPostId: string, collectionId: string | null) => {
    try {
        const { data, error } = await supabase
            .from('saved_posts')
            .update({ collection_id: collectionId })
            .eq('id', savedPostId)
            .eq('user_id', CURRENT_USER_ID)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error moving post:', e);
        return null;
    }
};
