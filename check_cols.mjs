import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkCols() {
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No data. Let me insert a dummy row then delete it to see schema or use RPC.");
        const { error: insertErr } = await supabase.from('user_profiles').insert({ user_id: '00000000-0000-0000-0000-000000000000' });
        console.log("Insert err:", insertErr);
    }
}

checkCols();
