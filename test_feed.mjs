import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function runAudit() {
    console.log("=== 1. POSTS TABLOSU ===");
    const { count, error: countErr } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    console.log("Posts Count:", count, countErr ? countErr.message : '');

    const { data: posts, error: postsErr } = await supabase.from('posts').select('id, title, author_id, category, type, is_published').order('created_at', { ascending: false });
    console.log("Posts Data:", JSON.stringify(posts?.slice(0, 3), null, 2), postsErr ? postsErr.message : '');

    console.log("\n=== 2. USER_PROFILES EŞLEŞMESİ ===");
    // Fetch unique author_ids
    const authorIds = [...new Set(posts?.map(p => p.author_id).filter(id => id != null) || [])];
    console.log("Unique Author IDs in Posts:", authorIds);
    if (authorIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('user_id, username').in('user_id', authorIds);
        console.log("Matched Profiles:", JSON.stringify(profiles, null, 2), profErr ? profErr.message : '');
    }

    console.log("\n=== 3. RPC TESTİ ===");
    const { data: feed, error: feedErr } = await supabase.rpc('get_feed_v5', {
        p_feed_type: 'for_you',
        p_category: 'Hepsi',
        p_search: '',
        p_user_id: null
    });
    console.log("Feed Data Length:", feed?.length);
    console.log("Feed Error:", feedErr);
    if (feed?.length > 0) {
        console.log("First Feed Item:", JSON.stringify(feed[0], null, 2));
    }
}

runAudit();
