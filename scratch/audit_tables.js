const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const tables = [
    'users',
    'user_profiles',
    'profiles',
    'user_preferences',
    'notifications',
    'posts',
    'comments',
    'post_interactions',
    'followers'
];

async function runAudit() {
    console.log("=== DATABASE AUDIT START ===");
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[FAIL] ${table}: ${error.message} (${error.code})`);
        } else {
            console.log(`[PASS] ${table}`);
        }
    }
    console.log("=== DATABASE AUDIT END ===");
}

runAudit();
