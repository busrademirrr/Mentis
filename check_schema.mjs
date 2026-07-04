import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://iuklqyuqwrrniqtskfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a2xxeXVxd3JybmlxdHNrZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc5NTAsImV4cCI6MjA5MjgwMzk1MH0.T1M3hPYrBqI4tglRS0jQZeMNqkPlV09MvFGI-TRT4RU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking posts schema:");
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(data);
    }
}

checkSchema();
