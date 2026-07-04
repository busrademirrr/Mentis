import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { category, user_id } = await req.json();
    console.log(`[ArenaMatchmaking] Request received. Category: ${category}, Request Body user_id: ${user_id}`);
    
    if (!category) throw new Error("Category is required");

    // Try to authenticate securely
    let finalUserId = user_id; // Fallback to provided user_id
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      console.log(`[ArenaMatchmaking] Auth header found. Verifying token...`);
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        console.log(`[ArenaMatchmaking] Token verified. Secure User ID: ${user.id}`);
        finalUserId = user.id;
      } else {
        console.log(`[ArenaMatchmaking] Token invalid or expired.`);
      }
    } else {
      console.log(`[ArenaMatchmaking] No Auth header found. Using fallback user_id.`);
    }

    if (!finalUserId) {
      console.error(`[ArenaMatchmaking] Authentication failed. No user_id resolved.`);
      throw new Error("Not authenticated");
    }

    // Bypassing RLS for admin tasks (creating matches, deleting from queue)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get User Profile to know ELO
    console.log(`[ArenaMatchmaking] Fetching ELO for user: ${finalUserId}`);
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("arena_elo")
      .eq("id", finalUserId)
      .single();

    const userElo = profile?.arena_elo || 1200;
    console.log(`[ArenaMatchmaking] User ELO resolved: ${userElo}`);

    // 2. Insert User to Queue
    console.log(`[ArenaMatchmaking] Inserting user into arena_queue...`);
    const { data: myQueue, error: queueErr } = await supabaseAdmin
      .from("arena_queue")
      .insert({
        user_id: finalUserId,
        category: category,
        elo: userElo,
        status: "searching",
      })
      .select()
      .single();

    if (queueErr) {
      console.error(`[ArenaMatchmaking] Error inserting to queue:`, queueErr);
      throw queueErr;
    }
    console.log(`[ArenaMatchmaking] Successfully joined queue. Queue ID: ${myQueue.id}`);

    // 3. Matchmaking Loop (Max 5 seconds: 1 iteration)
    // We want a fast fallback for the MVP.
    const MAX_ITERATIONS = 1;
    const WAIT_MS = 5000; // 5 seconds
    
    for (let i = 1; i <= MAX_ITERATIONS; i++) {
      const eloRange = 200; // Expand search immediately since it's just 5s

      console.log(`[ArenaMatchmaking] Searching for real opponent. Iteration ${i}, ELO Range +/-${eloRange}`);
      
      const { data: opponents } = await supabaseAdmin
        .from("arena_queue")
        .select("*")
        .eq("category", category)
        .eq("status", "searching")
        .neq("user_id", finalUserId)
        .gte("elo", userElo - eloRange)
        .lte("elo", userElo + eloRange)
        .order("created_at", { ascending: true })
        .limit(1);

      if (opponents && opponents.length > 0) {
        const opponent = opponents[0];
        console.log(`[ArenaMatchmaking] Real opponent found! Opponent ID: ${opponent.user_id}`);

        // Opponent found! Create match.
        console.log(`[ArenaMatchmaking] Creating match in arena_matches...`);
        const { data: match } = await supabaseAdmin
          .from("arena_matches")
          .insert({
            player1_id: finalUserId,
            player2_id: opponent.user_id,
            category: category,
            status: "matched",
          })
          .select()
          .single();

        console.log(`[ArenaMatchmaking] Match created successfully! Match ID: ${match.id}`);

        // Update queue statuses or delete them
        await supabaseAdmin.from("arena_queue").delete().in("id", [myQueue.id, opponent.id]);
        console.log(`[ArenaMatchmaking] Removed players from queue.`);

        return new Response(JSON.stringify({ match, matched_with: "user" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[ArenaMatchmaking] No opponent found in iteration ${i}.`);
      if (i < MAX_ITERATIONS) {
        await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
      }
    }

    // Wait 5 seconds before resorting to bot, since we only did 1 iteration but didn't wait inside the loop if it was the last one.
    // Actually, if we want to wait 5 seconds TOTAL, we should wait here.
    console.log(`[ArenaMatchmaking] Waiting 5 seconds before checking queue one last time or picking a bot...`);
    await new Promise((resolve) => setTimeout(resolve, WAIT_MS));

    console.log(`[ArenaMatchmaking] Checking queue one last time after wait...`);
    const { data: lastCheckOpponents } = await supabaseAdmin
      .from("arena_queue")
      .select("*")
      .eq("category", category)
      .eq("status", "searching")
      .neq("user_id", finalUserId)
      .limit(1);
      
    if (lastCheckOpponents && lastCheckOpponents.length > 0) {
        const opponent = lastCheckOpponents[0];
        console.log(`[ArenaMatchmaking] Real opponent found on last check! Opponent ID: ${opponent.user_id}`);

        const { data: match } = await supabaseAdmin
          .from("arena_matches")
          .insert({
            player1_id: finalUserId,
            player2_id: opponent.user_id,
            category: category,
            status: "matched",
          })
          .select()
          .single();

        await supabaseAdmin.from("arena_queue").delete().in("id", [myQueue.id, opponent.id]);

        return new Response(JSON.stringify({ match, matched_with: "user" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 4. Bot Fallback
    console.log(`[ArenaMatchmaking] No real user found. Falling back to bot...`);
    
    // Find a bot with similar ELO (+/- 200)
    const { data: bots } = await supabaseAdmin
      .from("arena_bots")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .gte("elo", userElo - 200)
      .lte("elo", userElo + 200)
      .limit(1);

    let bot = bots && bots.length > 0 ? bots[0] : null;

    // If no bot in range, just pick ANY bot in category
    if (!bot) {
      console.log(`[ArenaMatchmaking] No bot in ELO range. Picking any bot in category.`);
      const { data: anyBots } = await supabaseAdmin
        .from("arena_bots")
        .select("*")
        .eq("category", category)
        .limit(1);
      bot = anyBots && anyBots.length > 0 ? anyBots[0] : null;
    }

    if (!bot) {
      // Extremely rare case: no bots seeded
      console.error(`[ArenaMatchmaking] Critical Error: No opponents or bots available in category: ${category}`);
      throw new Error("No opponents or bots available. Please run the seed script.");
    }

    console.log(`[ArenaMatchmaking] Selected Bot: ${bot.bot_name} (ID: ${bot.id})`);

    // Create match against Bot
    const { data: botMatch } = await supabaseAdmin
      .from("arena_matches")
      .insert({
        player1_id: finalUserId,
        player2_id: bot.id,
        category: category,
        status: "matched",
      })
      .select()
      .single();

    console.log(`[ArenaMatchmaking] Match against Bot created successfully! Match ID: ${botMatch.id}`);

    // Remove user from queue
    await supabaseAdmin.from("arena_queue").delete().eq("id", myQueue.id);
    console.log(`[ArenaMatchmaking] Removed user from queue.`);

    return new Response(JSON.stringify({ match: botMatch, matched_with: "bot", bot_details: bot }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[ArenaMatchmaking] Fatal Error:", error);
    // Return 200 so supabase-js doesn't throw a generic "non-2xx status code" error
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
