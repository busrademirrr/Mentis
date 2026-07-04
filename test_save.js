import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    // 1. Sign in as test user
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: 'test@mentis.com',
        password: 'password123'
    });

    const userId = signInData?.user?.id;
    if (!userId) {
        console.log("No user ID", signInErr);
        return;
    }

    console.log("Logged in as:", userId);

    // 2. Find a post
    const { data: posts } = await supabase.from('posts').select('id').limit(1);
    const postId = posts[0].id;
    console.log("Post ID:", postId);

    // 3. Try insert
    const res = await supabase.from('saved_posts').insert({
        post_id: postId,
        user_id: userId
    });

    console.log("Insert error:", res.error);
    console.log("Insert data:", res.data);
}

test();
