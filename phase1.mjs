import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkTables() {
    const tablesToCheck = [
        'posts', 'post_interactions', 'comments', 'followers', 
        'user_profiles', 'saved_posts', 'messages', 'conversation_participants',
        'likes', 'post_views', 'post_read_sessions', 'post_hides'
    ];
    console.log("=== TABLE EXISTENCE AUDIT ===");
    for (const t of tablesToCheck) {
        const { error } = await supabase.from(t).select('id').limit(1);
        console.log(`Table '${t}':`, error ? `FAIL (${error.message})` : "PASS");
    }

    console.log("\n=== PROFILE AUDIT ===");
    const testIds = [
        'f0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000003'
    ];
    // We can't query auth.users from anon key, but we can query user_profiles
    const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('*').in('user_id', testIds);
    console.log("Profiles in user_profiles:", JSON.stringify(profiles, null, 2), profErr ? profErr.message : '');
}

checkTables();
