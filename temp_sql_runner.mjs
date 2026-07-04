import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function runAudit() {
    console.log("=== CHECKING LAST POST AUTHOR MATCH ===");
    const { data: dbData } = await supabase
        .from('posts')
        .select('author_id')
        .order('created_at', { ascending: false })
        .limit(1);
        
    const authorId = dbData[0].author_id;
    console.log("Author ID:", authorId);
    
    const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authorId);
        
    console.log("Profile Match:", profileData);
}

runAudit();
