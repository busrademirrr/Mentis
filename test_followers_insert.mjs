import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY); // use service role

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testInsert() {
    console.log("=== TESTING FOLLOWERS INSERT ===");
    
    // get a random user
    const { data: users } = await supabase.from('users').select('id').limit(2);
    if (!users || users.length < 2) return console.log("Not enough users");
    
    const follower_id = users[0].id;
    const following_id = users[1].id;
    
    console.log(`Inserting: ${follower_id} -> ${following_id}`);
    
    // test insert
    const { data, error } = await supabase.from('followers').insert({ follower_id, following_id });
    console.log("Insert Result:", error || 'Success');
    
    // Check if user_stats updated
    const { data: stats } = await supabase.from('user_stats').select('following_count').eq('user_id', follower_id).single();
    console.log("Follower stats after insert:", stats);
}

testInsert();
