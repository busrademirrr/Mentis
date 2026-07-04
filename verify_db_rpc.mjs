import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://iuklqyuqwrrniqtskfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a2xxeXVxd3JybmlxdHNrZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc5NTAsImV4cCI6MjA5MjgwMzk1MH0.T1M3hPYrBqI4tglRS0jQZeMNqkPlV09MvFGI-TRT4RU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpc(rpcName, params = {}) {
    const { error } = await supabase.rpc(rpcName, params);
    if (error && error.message && error.message.includes('Could not find the function')) {
        console.log(`* ${rpcName}: MISSING`);
    } else {
        console.log(`* ${rpcName}: EXISTS`);
    }
}

async function runCheck() {
    console.log("DATABASE RPC AUDIT:");
    await checkRpc('create_post', { p_type: 'test', p_payload: {} });
    await checkRpc('get_feed_v4', { p_sort: 'trend' });
    await checkRpc('get_profile_v4', { p_target_user_id: '11111111-1111-1111-1111-111111111111', p_viewer_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('toggle_save', { p_post_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('toggle_like', { p_post_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('submit_vote', { p_post_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('submit_quiz', { p_post_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('track_share', { p_post_id: '11111111-1111-1111-1111-111111111111', p_share_type: 'copy_link' });
    await checkRpc('get_threaded_comments_v4', { p_post_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('create_comment_v4', { p_post_id: '11111111-1111-1111-1111-111111111111', p_content: 'test' });
    await checkRpc('toggle_comment_like_v4', { p_comment_id: '11111111-1111-1111-1111-111111111111' });
    await checkRpc('edit_comment_v4', { p_comment_id: '11111111-1111-1111-1111-111111111111', p_content: 'test' });
    await checkRpc('delete_comment_v4', { p_comment_id: '11111111-1111-1111-1111-111111111111' });
}

runCheck();
