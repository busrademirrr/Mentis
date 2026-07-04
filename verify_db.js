const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    const tables = [
        'users',
        'user_stats',
        'user_profiles',
        'posts',
        'post_interactions',
        'likes',
        'saved_posts',
        'debate_votes',
        'quiz_answers',
        'room_members',
        'debate_messages',
        'comments',
        'followers',
        'notifications',
        'collections',
        'messages',
        'conversations'
    ];

    console.log("=== VERIFYING TABLES ===");
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[FAIL] Table '${table}' -> ${error.message || error.code}`);
        } else {
            console.log(`[PASS] Table '${table}' exists`);
        }
    }
}

async function verifyRPCs() {
    console.log("\n=== VERIFYING RPCS ===");
    const rpcs = ['create_post', 'toggle_like', 'toggle_save', 'search_mentis_ecosystem'];
    
    for (const rpc of rpcs) {
        // Just calling it with empty params to see if function exists vs signature error
        const { error } = await supabase.rpc(rpc);
        if (error && error.message.includes("Could not find the function")) {
            console.log(`[FAIL] RPC '${rpc}' -> Not found`);
        } else {
            console.log(`[PASS] RPC '${rpc}' exists (returned ${error ? error.message : 'no error'})`);
        }
    }
}

async function run() {
    await verifyTables();
    await verifyRPCs();
}

run();
