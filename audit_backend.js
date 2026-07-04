require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAudit() {
  console.log("=== STARTING MENTIS BACKEND AUDIT ===");
  const results = {};

  // 1. AUTHENTICATION
  console.log("\n--- AUTHENTICATION ---");
  const testEmail = `test_audit_${Date.now()}@mentis.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `user_${Date.now()}`;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: testUsername,
        full_name: 'Test Auditor'
      }
    }
  });

  if (signUpError) {
    console.error("FAIL: Register", signUpError.message);
    results.auth = { register: 'FAIL', error: signUpError.message };
  } else {
    console.log("PASS: Register. User ID:", signUpData.user.id);
    results.auth = { register: 'PASS', userId: signUpData.user.id };
    
    // Check if user was inserted into public.users
    const { data: userData } = await supabase.from('users').select('*').eq('id', signUpData.user.id).single();
    if (userData) {
      console.log("PASS: User created in public.users table.");
    } else {
      console.warn("WARNING: User NOT created in public.users table (trigger might be failing).");
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error("FAIL: Login", signInError.message);
      results.auth.login = 'FAIL';
    } else {
      console.log("PASS: Login. Session:", signInData.session?.access_token ? 'Exists' : 'Missing');
      results.auth.login = 'PASS';
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("FAIL: Logout", signOutError.message);
      results.auth.logout = 'FAIL';
    } else {
      console.log("PASS: Logout");
      results.auth.logout = 'PASS';
    }
  }

  // To test authenticated flows, we must sign back in
  await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });

  // 2. CONTENT CREATION
  console.log("\n--- CONTENT CREATION ---");
  let postId = null;
  const { data: postData, error: postError } = await supabase.rpc('create_post', {
    p_type: 'debate',
    p_payload: {
      title: 'Audit Debate Test',
      content: 'Is this audit going to pass?',
      option_a: 'Yes',
      option_b: 'No',
      category: 'Teknoloji'
    }
  });

  if (postError) {
    console.error("FAIL: create_post RPC", postError.message);
    results.content = { create_post: 'FAIL', error: postError.message };
  } else {
    console.log("PASS: create_post RPC executed. Post ID:", postData);
    postId = postData;
    results.content = { create_post: 'PASS', postId };
    
    // Verify record exists
    const { data: verifyPost } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (verifyPost) {
      console.log("PASS: Record exists in posts table. Type:", verifyPost.type);
    } else {
      console.error("FAIL: Record NOT found in posts table.");
    }
  }

  // 3. FEED (Interactions)
  console.log("\n--- FEED INTERACTIONS ---");
  if (postId) {
    const { error: likeError } = await supabase.rpc('toggle_like', { p_post_id: postId });
    if (likeError) {
      console.error("FAIL: Like post", likeError.message);
    } else {
      console.log("PASS: Like post via toggle_like");
    }

    const { error: saveError } = await supabase.rpc('toggle_save', { p_post_id: postId });
    if (saveError) {
      console.error("FAIL: Save post", saveError.message);
    } else {
      console.log("PASS: Save post via toggle_save");
    }

    const { error: voteError } = await supabase.rpc('submit_vote', { p_post_id: postId, p_selected_option: 'A' });
    if (voteError) {
      console.error("FAIL: Submit vote", voteError.message);
    } else {
      console.log("PASS: Submit vote via submit_vote");
    }

    // Verify interactions exist
    const { data: interactions } = await supabase.from('post_interactions').select('*').eq('post_id', postId).eq('user_id', results.auth.userId);
    console.log(`Verified Interactions: Found ${interactions?.length} interaction records.`);
  } else {
    console.warn("SKIPPED: Feed interactions due to post creation failure.");
  }

  // 4. PROFILE (Follow)
  console.log("\n--- PROFILE FOLLOW ---");
  // Try to follow a hardcoded test user or self
  const targetUser = '11111111-1111-1111-1111-111111111111'; // Assuming this exists from previous mocking
  const { data: followData, error: followError } = await supabase.from('followers').insert({ follower_id: results.auth.userId, following_id: targetUser });
  if (followError) {
    console.error("FAIL: Follow user", followError.message);
  } else {
    console.log("PASS: Follow user in followers table");
  }

  // 5. SEARCH
  console.log("\n--- SEARCH ---");
  const { data: searchData, error: searchError } = await supabase.rpc('search_mentis_ecosystem', { search_query: 'Audit', max_limit: 5 });
  if (searchError) {
    console.error("FAIL: search_mentis_ecosystem", searchError.message);
  } else {
    console.log("PASS: search_mentis_ecosystem. Found:", searchData?.posts?.length || 0, "posts and", searchData?.users?.length || 0, "users.");
  }

  console.log("\n=== AUDIT COMPLETE ===");
}

runAudit();
