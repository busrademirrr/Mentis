require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Checking user_profiles...");
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    console.log("Select Error:", error);
    console.log("Select Data:", data);
}

test();
