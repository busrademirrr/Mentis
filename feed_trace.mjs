import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function runTrace() {
    console.log("=== TEST 1: RPC DIRECT EXECUTION ===");
    const { data: countData, error: countErr } = await supabase.rpc('get_feed_v5', { p_feed_type: 'for_you', p_category: 'Hepsi', p_search: '', p_user_id: null });
    console.log("RPC Count Result:", countData ? countData.length : 0, countErr ? countErr.message : '');

    const { data: feedData, error: feedErr } = await supabase.rpc('get_feed_v5', { p_feed_type: 'for_you', p_category: 'Hepsi', p_search: '', p_user_id: null });
    console.log("RPC Top 5:", JSON.stringify(feedData?.slice(0, 5), null, 2));
    
    console.log("\n=== TEST 5: POSTS DIRECT QUERY ===");
    const { data: posts, error: postsErr } = await supabase.from('posts').select('id, title, category, is_published').limit(5);
    console.log("Posts direct:", posts?.length, postsErr ? postsErr.message : '');

    console.log("\n=== TEST 6: USER CONTEXT ===");
    // Attempting to get auth user might fail if we don't pass a token, we just check anon session.
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Auth user:", user ? user.id : 'No session in this node script');
}

runTrace();
