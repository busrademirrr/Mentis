const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read the URL and key from src/lib/supabase.ts or just read .env
const envStr = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envStr.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envStr.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) console.error('Error fetching buckets:', error);
    else console.log('Buckets:', data.map(b => b.name));
}

checkBuckets();
