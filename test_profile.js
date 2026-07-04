import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
        console.log("No users found in database");
        return;
    }
    const targetUserId = users[0].id;
    console.log("Testing with User ID:", targetUserId);

    try {
        const [userRes, statsRes, socialsRes, badgesRes, repRes, postsRes, savedRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', targetUserId).single(),
            supabase.from('user_stats').select('*').eq('user_id', targetUserId).maybeSingle(),
            supabase.from('user_socials').select('*').eq('user_id', targetUserId),
            supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', targetUserId),
            supabase.from('user_reputation').select('*').eq('user_id', targetUserId).maybeSingle(),
            supabase.from('posts').select(`
                *,
                author:author_id(id, username, full_name, avatar_value, level)
            `).eq('author_id', targetUserId).order('created_at', { ascending: false }),
            supabase.from('post_interactions').select(`
                *,
                post:posts(*)
            `).eq('user_id', targetUserId).eq('type', 'save').order('created_at', { ascending: false })
        ]);

        console.log("User Res Error:", userRes.error);
        console.log("Stats Res Error:", statsRes.error);
        console.log("Socials Res Error:", socialsRes.error);
        console.log("Badges Res Error:", badgesRes.error);
        console.log("Rep Res Error:", repRes.error);
        console.log("Posts Res Error:", postsRes.error);
        console.log("Saved Res Error:", savedRes.error);

    } catch (e) {
        console.error("Caught Exception:", e);
    }
}

test();
