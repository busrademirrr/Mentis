import { supabase } from '../lib/supabase';

export interface PostServiceError extends Error {
    code?: string;
}

export const postService = {
    /**
     * Soft deletes a post by setting is_deleted = true.
     * @param postId ID of the post to delete
     * @returns boolean indicating success
     */
    async deletePost(postId: string): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('delete_own_post', {
                p_post_id: postId
            });

            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error('Error soft deleting post:', error);
            throw error;
        }
    },

    /**
     * Updates an existing post
     */
    async updatePost(postId: string, payload: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('posts')
                .update(payload)
                .eq('id', postId);

            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error('Error updating post:', error);
            throw error;
        }
    },

    /**
     * Reports a post
     */
    async reportPost(postId: string, reason: string = 'Inappropriate content'): Promise<boolean> {
        try {
            // Note: In a real app, this would insert into a 'reports' table.
            // For now we just console.log or send a generic request.
            console.log(`Reporting post ${postId} for: ${reason}`);
            // await supabase.from('reports').insert({ post_id: postId, reason });
            return true;
        } catch (error: any) {
            console.error('Error reporting post:', error);
            throw error;
        }
    }
};
