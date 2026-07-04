import { supabase } from '../lib/supabase';

export interface KnowledgeDetailResult {
    post: {
        id: string;
        title: string;
        content: string;
        short_description: string | null;
        image_url: string | null;
        category: string;
        type: string;
        created_at: string;
        read_time_minutes: number;
    };
    author: {
        id: string;
        username: string;
        full_name: string;
        avatar_url: string | null;
        bio: string | null;
        followers_count: number;
    };
    stats: {
        likes_count: number;
        comments_count: number;
        views_count: number;
    };
    me: {
        has_liked: boolean;
        is_following: boolean;
        is_saved: boolean;
    };
    sources: Array<{ title: string; url: string }>;
    related_posts: Array<{
        id: string;
        title: string;
        image_url: string | null;
        category: string;
    }>;
    reading_progress: {
        scroll_percent: number;
        read_seconds: number;
    };
}

export const knowledgeService = {
    /**
     * Master query to get all post details, author info, and my relationship status in 1 query.
     */
    async getKnowledgeDetail(postId: string): Promise<KnowledgeDetailResult | null> {
        const { data, error } = await supabase.rpc('get_knowledge_detail_v1', { p_post_id: postId });
        
        if (error) {
            console.error('getKnowledgeDetail error:', error);
            return null;
        }

        return data as KnowledgeDetailResult;
    },

    /**
     * Log a view to the post_views table. (Has 24h protection per user)
     */
    async logPostView(postId: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('log_post_view', { p_post_id: postId });
        if (error) console.error('logPostView error:', error);
        return data as boolean || false;
    },

    /**
     * Update user's reading progress
     */
    async logReadProgress(postId: string, scrollPercent: number, readSeconds: number): Promise<boolean> {
        const { error } = await supabase.rpc('log_read_progress', { 
            p_post_id: postId,
            p_scroll_percent: Math.round(scrollPercent),
            p_read_seconds: Math.round(readSeconds)
        });
        
        if (error) {
            console.error('logReadProgress error:', error);
            return false;
        }
        return true;
    },

    /**
     * Save a highlighted quote from the post
     */
    async saveQuote(postId: string, quoteText: string): Promise<boolean> {
        const { error } = await supabase.rpc('save_quote', {
            p_post_id: postId,
            p_quote_text: quoteText
        });

        if (error) {
            console.error('saveQuote error:', error);
            return false;
        }
        return true;
    },

    /**
     * Toggle the follow status of the author
     */
    async toggleFollow(authorId: string): Promise<boolean> {
        const { error } = await supabase.rpc('toggle_follow_v1', { target_user_id: authorId });
        if (error) {
            console.error('toggleFollow error:', error);
            throw error;
        }
        return true;
    },

    /**
     * Toggle post like
     */
    async toggleLike(postId: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Check current status
        const { data: currentLike } = await supabase
            .from('post_interactions')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .eq('type', 'like')
            .single();

        if (currentLike) {
            await supabase.from('post_interactions').delete().match({ post_id: postId, user_id: user.id, type: 'like' });
        } else {
            await supabase.from('post_interactions').insert({ post_id: postId, user_id: user.id, type: 'like' });
        }
        return true;
    },

    /**
     * Toggle post save
     */
    async toggleSave(postId: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: currentSave } = await supabase
            .from('post_interactions')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .eq('type', 'save')
            .single();

        if (currentSave) {
            await supabase.from('post_interactions').delete().match({ post_id: postId, user_id: user.id, type: 'save' });
        } else {
            await supabase.from('post_interactions').insert({ post_id: postId, user_id: user.id, type: 'save' });
        }
        return true;
    }
};
