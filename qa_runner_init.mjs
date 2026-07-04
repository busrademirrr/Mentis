import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQA() {
    console.log("=== PHASE 0.5 FULL QA RUNNER ===");
    
    const email = `test_${Date.now()}@mentisapp.com`;
    const password = 'TestPassword123!';
    
    console.log(`[1] Creating test user: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });
    
    if (authError) {
        console.error("SignUp failed. We might need a real user account to run RLS tests:", authError.message);
        return;
    }
    
    console.log("SignUp successful! User ID:", authData.user?.id);
    
    // Test if session is active
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.log("Session not established. Email confirmation might be required.");
        
        // Try to sign in anyway
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
            console.error("SignIn failed:", signInErr.message);
            return;
        }
        console.log("SignIn successful!");
    }
}

runQA();
