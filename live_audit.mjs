import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runLiveAudit() {
    console.log("=== SAVE SYSTEM TRUTH AUDIT ===");
    
    // 1. Check post_interactions
    const { count: interactionCount, error: interactionError } = await supabase
        .from('post_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'save');
        
    if (interactionError) {
        console.log("Error reading post_interactions:", interactionError.message);
    } else {
        console.log(`SELECT COUNT(*) FROM post_interactions WHERE type='save': ${interactionCount}`);
    }

    // 2. Check saved_posts
    const { count: savedPostsCount, error: savedPostsError } = await supabase
        .from('saved_posts')
        .select('*', { count: 'exact', head: true });
        
    if (savedPostsError) {
        console.log("Error reading saved_posts (table might not exist or RLS blocks it):", savedPostsError.message);
    } else {
        console.log(`SELECT COUNT(*) FROM saved_posts: ${savedPostsCount}`);
    }

    // 3. Test View Tracking RPC
    console.log("\n=== REAL VIEW TRACKING TEST ===");
    const testPostId = 'b218894c-0a71-4737-8a21-c2ecadace53b'; // Using an existing post ID if possible, or we will query one
    
    const { data: latestPost } = await supabase.from('posts').select('id').order('created_at', { ascending: false }).limit(1);
    const postId = latestPost?.[0]?.id;
    
    if (postId) {
        const { count: initialViewCount } = await supabase
            .from('post_views')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
            
        console.log(`BEFORE VIEW - SELECT COUNT(*) FROM post_views WHERE post_id='${postId}': ${initialViewCount}`);
        
        console.log("-> Simulating View via RPC (log_post_view)...");
        const { data: rpcResult, error: rpcError } = await supabase.rpc('log_post_view', { p_post_id: postId });
        if (rpcError) console.log("RPC Error:", rpcError.message);
        
        const { count: finalViewCount } = await supabase
            .from('post_views')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
            
        console.log(`AFTER VIEW - SELECT COUNT(*) FROM post_views WHERE post_id='${postId}': ${finalViewCount}`);
    } else {
        console.log("Could not find a post to test view tracking.");
    }
}

runLiveAudit();
