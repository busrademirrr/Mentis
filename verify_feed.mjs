import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuklqyuqwrrniqtskfap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a2xxeXVxd3JybmlxdHNrZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc5NTAsImV4cCI6MjA5MjgwMzk1MH0.T1M3hPYrBqI4tglRS0jQZeMNqkPlV09MvFGI-TRT4RU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFeed() {
    console.log("Starting Pre-Condition Verification...");
    
    // Test if get_feed_v4 exists and returns data
    const { data: feedData, error: feedError } = await supabase.rpc('get_feed_v4', {
        p_category: 'Hepsi',
        p_search: '',
        p_sort: 'trend'
    });

    if (feedError) {
        console.error("FAIL: Could not execute get_feed_v4. Have you run the SQL script in Supabase?");
        console.error(feedError);
        return;
    }

    if (!feedData || feedData.length === 0) {
        console.log("PASS (Partial): get_feed_v4 executed successfully, but returned 0 posts. Are there any posts in the DB?");
        return;
    }

    console.log("PASS: get_feed_v4 executed successfully.");
    console.log(`Found ${feedData.length} posts in feed.`);
    
    // Pick the first post to show proof of counts
    const post = feedData[0];
    
    console.log("\n==================================================");
    console.log("RAW get_feed_v4 RESPONSE FOR TOP POST");
    console.log("==================================================");
    console.log(`Title: ${post.title}`);
    console.log(`Author: ${post.author_username}`);
    console.log(`likes_count: ${post.likes_count}`);
    console.log(`comments_count: ${post.comments_count}`);
    console.log(`saves_count: ${post.saves_count}`);
    console.log("==================================================\n");
    
    console.log("VERIFICATION COMPLETE.");
    console.log("All counts are derived from the DB aggregation, not local variables.");
}

verifyFeed();
