import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkFollowers() {
    console.log("=== CHECKING FOLLOWERS TABLE SCH === ");
    const { data, error } = await supabase.from('followers').select('*').limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
}

checkFollowers();
