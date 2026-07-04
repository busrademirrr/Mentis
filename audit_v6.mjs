import { createClient } from '@supabase/supabase-js';

// Bypass SSL verification for local testing/Supabase edge cases
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://iuklqyuqwrrniqtskfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a2xxeXVxd3JybmlxdHNrZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc5NTAsImV4cCI6MjA5MjgwMzk1MH0.T1M3hPYrBqI4tglRS0jQZeMNqkPlV09MvFGI-TRT4RU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log("=== STARTING MENTIS V6 AUDIT ===");

    // Try to register a test user
    const email = `audit_${Date.now()}@test.com`;
    const password = 'password123';
    let authRes = await supabase.auth.signUp({ email, password });
    
    if (authRes.error) {
        console.error("Auth Error:", authRes.error);
        // Fallback: try to just create post anonymously if RLSM allows
    } else {
        console.log("Auth Success:", authRes.data.user?.id);
    }

    console.log("\nTEST 1 — CONTENT CREATION");
    let testPostId = null;
    try {
        const { data, error } = await supabase.rpc('create_post', {
            p_type: 'article',
            p_payload: {
                title: 'AUDIT TEST POST',
                content: 'This is an audit test content.',
                short_description: 'Audit short desc',
                tags: ['Audit', 'Test']
            }
        });
        if (error) {
            console.log("FAIL: ", error.message);
        } else {
            testPostId = data;
            const { data: fetchPost } = await supabase.from('posts').select('*').eq('id', testPostId).single();
            if (fetchPost) {
                console.log("PASS");
                console.log("Post ID:", testPostId);
                console.log("Created At:", fetchPost.created_at);
            } else {
                console.log("FAIL: Inserted but not found in posts table");
            }
        }
    } catch(e) {
        console.log("FAIL: Exception", e);
    }

    if (!testPostId) {
        console.log("Cannot proceed with Tests 2-6 without a post.");
        return;
    }

    console.log("\nTEST 2 — PROFILE SYNC");
    // Verify it appears in get_feed_v4 with author_id filter
    const { data: profileFeed } = await supabase.rpc('get_feed_v4', {
        p_author_id: authRes.data?.user?.id
    });
    if (profileFeed && profileFeed.some(p => p.id === testPostId)) {
        console.log("PASS: Found in Profile Feed via RPC");
    } else {
        console.log("FAIL: Not found in Profile Feed");
    }

    console.log("\nTEST 3 — LIKE SYSTEM");
    const { error: likeErr } = await supabase.from('post_interactions').insert({ post_id: testPostId, type: 'like' });
    if (!likeErr) {
        const { data: likeFeed } = await supabase.rpc('get_feed_v4', { p_sort: 'trend' });
        const post = likeFeed.find(p => p.id === testPostId);
        if (post && Number(post.likes_count) === 1) {
            console.log("PASS: Liked successfully and count updated to 1");
        } else {
            console.log("FAIL: Like count not updated", post?.likes_count);
        }
    } else {
        console.log("FAIL: Like insertion error", likeErr.message);
    }

    console.log("\nTEST 4 — COMMENT SYSTEM");
    const { error: commentErr } = await supabase.from('comments').insert({ post_id: testPostId, content: 'TEST COMMENT V6' });
    if (!commentErr) {
         const { data: commentFeed } = await supabase.rpc('get_feed_v4', { p_sort: 'trend' });
         const post = commentFeed.find(p => p.id === testPostId);
         if (post && Number(post.comments_count) === 1) {
             console.log("PASS: Commented and count updated to 1");
         } else {
             console.log("FAIL: Comment count not updated");
         }
    } else {
        console.log("FAIL: Comment insertion error", commentErr.message);
    }

    console.log("\nTEST 5 — SAVE SYSTEM");
    const { error: saveErr } = await supabase.from('post_interactions').insert({ post_id: testPostId, type: 'save' });
    if (!saveErr) {
         const { data: savedFeed } = await supabase.rpc('get_feed_v4', { p_sort: 'saved_by_me', p_user_id: authRes.data?.user?.id });
         if (savedFeed && savedFeed.some(p => p.id === testPostId)) {
             console.log("PASS: Saved successfully and appears in Saved Feed");
         } else {
             console.log("FAIL: Not found in Saved Feed");
         }
    } else {
        console.log("FAIL: Save insertion error", saveErr.message);
    }

    console.log("\nTEST 6 — SHARE SYSTEM");
    const { error: shareErr } = await supabase.rpc('track_share', { p_post_id: testPostId, p_share_type: 'copy_link' });
    if (!shareErr) {
        const { data: shareFeed } = await supabase.rpc('get_feed_v4', { p_sort: 'trend' });
        const post = shareFeed.find(p => p.id === testPostId);
        if (post && Number(post.shares_count) === 1) {
             console.log("PASS: Shared successfully and count updated to 1");
        } else {
             console.log("FAIL: Share count not updated");
        }
    } else {
        console.log("FAIL: Share tracking error", shareErr.message);
    }
}

runAudit();
