import { supabase } from '../lib/supabase';

export const creatorService = {
    async createPost(type: string, payload: any) {
        // Option B: Direct table insert (Single Source of Truth)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const insertPayload = {
            type: type,
            title: payload.title || '',
            content: payload.content || '',
            short_description: payload.short_description || '',
            category: payload.category || 'Genel',
            tags: payload.tags || [],
            image_url: payload.image_url || null,
            payload: payload,
            author_id: user.id,
            is_published: true
        };

        const { data, error } = await supabase.from('posts').insert(insertPayload).select('*').single();
        
        if (error) {
            console.error('Create post error:', error);
            throw error;
        }

        console.log("DB INSERT BAŞARILI. Dönüş: ", { id: data.id, title: data.title, type: data.type, author_id: data.author_id, is_published: data.is_published });
        
        // STEP: VERIFY INSERT
        console.log("STEP VERIFY INSERT: Verifying database consistency...");
        const { data: verifyData, error: verifyError } = await supabase
            .from('posts')
            .select('id, type, author_id')
            .eq('id', data.id)
            .single();

        if (verifyError || !verifyData) {
            console.error("VERIFY INSERT FAILED:", verifyError);
            throw new Error("Veritabanı kaydı doğrulanamadı.");
        }
        console.log(`VERIFY INSERT SUCCESS: Post ${verifyData.id} of type ${verifyData.type} verified in DB.`);
        
        // Feed V5 Health Check
        try {
            const { data: feedData, error: feedError } = await supabase.rpc('get_feed_v5', {
                p_feed_type: 'for_you',
                p_category: 'Hepsi',
                p_search: '',
                p_user_id: user.id
            });

            if (feedError) {
                console.warn("FEED INDEXING CHECK FAILED TO RUN:", feedError);
            } else {
                const isIndexed = feedData?.some((post: any) => post.id === data.id);
                if (!isIndexed) {
                    console.warn("POST INSERT BAŞARILI / FEED INDEXING BAŞARISIZ");
                } else {
                    console.log("POST INSERT BAŞARILI / FEED INDEXING BAŞARILI");
                }
            }
        } catch (e) {
            console.error("Feed check error:", e);
        }

        // [ANALYTICS] Track Debate Creation
        if (type === 'discussion') {
            console.log(`[ANALYTICS] NEW_DEBATE_CREATED | user_id: ${user.id} | category: ${payload.category || 'Genel'}`);
            // TODO: In the future, increment 'total_debates_created' in user_stats or trigger RPC.
        }
        
        return data;
    }
};
