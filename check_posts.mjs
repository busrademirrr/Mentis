import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: feed, error: feedErr } = await supabase.rpc('get_feed_v5', {
        p_feed_type: 'for_you',
        p_category: 'Hepsi',
        p_search: '',
        p_user_id: null
    });
    console.log("get_feed_v5 error:", feedErr ? feedErr.message : "None");
    console.log("get_feed_v5 length:", feed?.length);

    const tables = ['likes', 'post_likes', 'post_read_sessions', 'post_views', 'messages', 'followers'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        console.log(`Table ${table} exists:`, error ? error.message : 'Yes');
    }
}
check();
