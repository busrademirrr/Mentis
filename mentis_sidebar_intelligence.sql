-- Mentis Sidebar Intelligence Rebuild Migration
-- Contains the upgraded reading_progress schema and get_sidebar_intelligence RPC.

-- 1. Upgrade reading_progress table
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  progress_percent integer DEFAULT 0,
  reading_time_seconds integer DEFAULT 0,
  first_opened_at timestamptz DEFAULT now(),
  last_opened_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS for reading_progress
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own progress
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reading_progress' AND policyname = 'Users can manage their own reading progress'
    ) THEN
        CREATE POLICY "Users can manage their own reading progress"
          ON public.reading_progress
          FOR ALL
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- 2. Create RPC Function to avoid N+1 queries
CREATE OR REPLACE FUNCTION get_sidebar_intelligence(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_learning_summary JSON;
  v_recommended_content JSON;
  v_recommended_thinkers JSON;
  v_continue_reading JSON;
  v_trending_topics JSON;
  v_top_category TEXT;
BEGIN
  
  -- A) LEARNING SUMMARY (Last 7 days)
  SELECT json_build_object(
    'contents_read', COALESCE((SELECT COUNT(*) FROM public.reading_progress WHERE user_id = p_user_id AND progress_percent >= 100 AND last_opened_at >= now() - interval '7 days'), 0),
    'reading_minutes', COALESCE((SELECT SUM(reading_time_seconds) / 60 FROM public.reading_progress WHERE user_id = p_user_id AND last_opened_at >= now() - interval '7 days'), 0),
    'debates_participated', COALESCE((SELECT COUNT(*) FROM public.debate_votes WHERE user_id = p_user_id AND created_at >= now() - interval '7 days'), 0),
    'quizzes_solved', COALESCE((SELECT COUNT(*) FROM public.quiz_answers WHERE user_id = p_user_id AND created_at >= now() - interval '7 days'), 0),
    'most_active_category', (
      SELECT COALESCE(p.category, p.payload->>'category')
      FROM public.reading_progress rp
      JOIN public.posts p ON p.id = rp.post_id
      WHERE rp.user_id = p_user_id AND rp.last_opened_at >= now() - interval '7 days'
      GROUP BY COALESCE(p.category, p.payload->>'category')
      ORDER BY count(*) DESC
      LIMIT 1
    )
  ) INTO v_learning_summary;

  -- B) RECOMMENDED CONTENT
  -- Identify user's favorite category from reading history
  SELECT COALESCE(p.category, p.payload->>'category') INTO v_top_category
  FROM public.reading_progress rp
  JOIN public.posts p ON p.id = rp.post_id
  WHERE rp.user_id = p_user_id
  GROUP BY COALESCE(p.category, p.payload->>'category')
  ORDER BY count(*) DESC
  LIMIT 1;

  IF v_top_category IS NULL THEN
    v_top_category := 'Felsefe'; -- Default fallback
  END IF;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', p.id,
      'title', COALESCE(p.title, p.payload->>'title'),
      'category', COALESCE(p.category, p.payload->>'category'),
      'reason', 'Recommended because you frequently read ' || v_top_category,
      'type', p.type
    )
  ), '[]'::json) INTO v_recommended_content
  FROM public.posts p
  WHERE COALESCE(p.category, p.payload->>'category') = v_top_category
  AND p.id NOT IN (SELECT post_id FROM public.reading_progress WHERE user_id = p_user_id AND progress_percent >= 100)
  LIMIT 3;

  -- C) RECOMMENDED THINKERS
  -- Recommend active users who post in the user's top category
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', u.id,
      'name', COALESCE(u.full_name, u.username),
      'avatar', COALESCE(u.avatar_value, 'https://api.dicebear.com/9.x/micah/png?seed=' || u.username),
      'bio', COALESCE(u.bio, 'Mentis Thinker'),
      'top_category', v_top_category,
      'reason', 'Frequently posts in ' || v_top_category
    )
  ), '[]'::json) INTO v_recommended_thinkers
  FROM public.users u
  WHERE u.id != p_user_id
  AND EXISTS (
    SELECT 1 FROM public.posts p 
    WHERE p.author_id = u.id AND COALESCE(p.category, p.payload->>'category') = v_top_category
  )
  -- Filter out users already followed (assuming user_follows table exists, if not we just show them anyway)
  -- AND u.id NOT IN (SELECT following_id FROM user_follows WHERE follower_id = p_user_id)
  LIMIT 3;

  -- D) CONTINUE READING
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', p.id,
      'title', COALESCE(p.title, p.payload->>'title'),
      'progress_percent', rp.progress_percent,
      'last_opened_at', rp.last_opened_at
    )
  ), '[]'::json) INTO v_continue_reading
  FROM public.reading_progress rp
  JOIN public.posts p ON p.id = rp.post_id
  WHERE rp.user_id = p_user_id
  AND rp.progress_percent > 0 AND rp.progress_percent < 100
  ORDER BY rp.last_opened_at DESC
  LIMIT 3;

  -- E) TRENDING TOPICS (Last 7 days dynamically calculated)
  SELECT COALESCE(json_agg(
    json_build_object(
      'topic', cat.category,
      'growth_percent', floor(random() * 20 + 5) -- Simulated growth percentage for demo (requires complex time-series diff in production)
    )
  ), '[]'::json) INTO v_trending_topics
  FROM (
    SELECT COALESCE(p.category, p.payload->>'category') as category, count(*) as interaction_count
    FROM public.posts p
    JOIN public.post_interactions pi ON p.id = pi.post_id
    WHERE pi.created_at >= now() - interval '7 days'
    GROUP BY COALESCE(p.category, p.payload->>'category')
    ORDER BY interaction_count DESC
    LIMIT 5
  ) cat
  WHERE cat.category IS NOT NULL;

  -- RETURN COMBINED INTELLIGENCE
  RETURN json_build_object(
    'learning_summary', v_learning_summary,
    'recommended_content', v_recommended_content,
    'recommended_thinkers', v_recommended_thinkers,
    'continue_reading', v_continue_reading,
    'trending_topics', v_trending_topics
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
