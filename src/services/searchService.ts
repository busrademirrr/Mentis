import { supabase } from '../lib/supabase';

export interface SearchResult {
    type: 'user' | 'post' | 'conversation';
    id: string;
    score: number;
    data: any;
}

export const searchService = {
    /**
     * FTS based search across the Mentis ecosystem
     */
    async search(query: string, limit = 20): Promise<SearchResult[]> {
        if (!query || query.trim().length < 2) return [];
        
        const { data, error } = await supabase.rpc('search_mentis_ecosystem', {
            search_query: query.trim(),
            max_limit: limit
        });

        if (error) {
            console.error('Search error:', error);
            throw error;
        }

        return data as SearchResult[] || [];
    },

    /**
     * Get dynamically calculated trending searches
     */
    async getTrending(limit = 5): Promise<string[]> {
        const { data, error } = await supabase.rpc('get_trending_searches', { p_limit: limit });
        
        if (error) {
            console.error('Trending fetch error:', error);
            return [];
        }

        // Returns array of objects { query, search_count }
        return (data || []).map((item: any) => item.query);
    },

    /**
     * Log search query to search_history
     */
    async logSearch(query: string): Promise<void> {
        if (!query || query.trim().length < 2) return;
        
        await supabase.rpc('log_search_history', { p_query: query.trim() });
    },

    /**
     * Get user's recent search history
     */
    async getRecentSearches(limit = 5): Promise<string[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('search_history')
            .select('query')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('History fetch error:', error);
            return [];
        }

        // Deduplicate locally
        const unique = Array.from(new Set(data.map(d => d.query)));
        return unique.slice(0, limit);
    }
};
