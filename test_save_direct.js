import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Use SERVICE_ROLE_KEY instead of ANON_KEY so we can insert for ANY user
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    // 1. Get a user
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
        console.log("No users found in database");
        return;
    }
    const userId = users[0].id;
    console.log("Using User ID:", userId);

    // 2. Get a post
    const { data: posts } = await supabase.from('posts').select('id').limit(1);
    if (!posts || posts.length === 0) {
        console.log("No posts found in database");
        return;
    }
    const postId = posts[0].id;
    console.log("Using Post ID:", postId);

    // 3. Delete existing save if any
    await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId);

    // 4. Try insert
    const res = await supabase.from('saved_posts').insert({
        post_id: postId,
        user_id: userId
    });

    console.log("Insert error:", res.error);
    console.log("Insert data:", res.data);
    
    // 5. Try fetch
    const { data: saved } = await supabase.from('saved_posts').select('*').eq('user_id', userId);
    console.log("Saved posts count for user:", saved?.length);
}

test();
