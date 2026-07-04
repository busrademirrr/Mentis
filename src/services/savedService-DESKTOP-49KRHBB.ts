import { supabase } from '../lib/supabase';

const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
};

export const getSavedCollections = async () => {
    // Return empty array since collections are not in the db schema yet
    return [];
};

export const createSaveCollection = async (title: string, description: string = '', is_public: boolean = false) => {
    return null;
};

export const getSavedPosts = async (collectionId?: string) => {
    try {
        const userId = await getUserId();
        if (!userId) return [];
        
        // Phase 3: Saved Content Unification
        // Use get_profile_feed_v1 for a single source of truth for both Profile and Saved screens
        const { data, error } = await supabase.rpc('get_profile_feed_v1', {
            p_author_id: null,
            p_saved_by_user_id: userId,
            p_viewer_id: userId
        });

        if (error) throw error;
        if (!data) return [];

        // Format to match UI expectations similarly to feedService
        return data.map((post: any) => ({
            ...post,
            author: {
                id: post.author_id,
                username: post.author_username,
                full_name: post.author_full_name,
                avatar_value: post.author_avatar_url,
                level: post.author_level
            },
            likes: Number(post.likes_count),
            comments: Number(post.comments_count),
            user_has_liked: post.user_has_liked,
            user_has_saved: post.user_has_saved
        })) as any[];
    } catch (e) {
        console.error('Error fetching saved posts:', e);
        return [];
    }
};

export const toggleSave = async (postId: string, collectionId?: string) => {
    try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not logged in');
        
        const { data, error } = await supabase.rpc('toggle_save', { p_post_id: postId });
        
        if (error) {
            throw error;
        }
        
        // Return structured state based on the RPC response
        if (data && typeof data === 'object') {
            if (data.success === false) {
                throw new Error(data.error || 'Failed to toggle save state');
            }
            return { saved: data.action === 'saved' };
        }
        
        // Fallback for unexpected response structure
        return { saved: false };
    } catch (e: any) {
        console.error('Error toggling save:', e);
        throw e; // Propagate error explicitly to frontend
    }
};

export const moveSavedPost = async (savedPostId: string, collectionId: string | null) => {
    return null;
};
