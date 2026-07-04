const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://iuklqyuqwrrniqtskfap.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a2xxeXVxd3JybmlxdHNrZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc5NTAsImV4cCI6MjA5MjgwMzk1MH0.T1M3hPYrBqI4tglRS0jQZeMNqkPlV09MvFGI-TRT4RU'
);

async function test() {
    // get a user
    const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
    if (userErr) {
        console.error('Users fetch error:', userErr);
        return;
    }
    if (!users || users.length === 0) {
        console.error('No users found in DB');
        return;
    }
    const userId = users[0].id;
    console.log('Testing with user ID:', userId);

    const { data, error } = await supabase.rpc('get_profile_v5', {
        p_target_user_id: userId,
        p_viewer_user_id: userId
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Data:', data);
    }
}

test();
