import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkFeed() {
    console.log("--- PHASE B: FEED RECOVERY TEST ---");
    const { data: countData, error: countErr } = await supabase.rpc('get_feed_v5', { p_feed_type: 'for_you', p_category: 'Hepsi', p_search: '', p_user_id: null });
    
    if (countErr) {
        console.error("Feed Error:", countErr);
    } else {
        console.log(`Feed Count: ${countData.length}`);
        if (countData.length > 0) {
            console.log("First Post:", countData[0].title);
        }
    }
}

checkFeed();
