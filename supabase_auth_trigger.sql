-- Mentis Authentication Trigger
-- Run this in your Supabase SQL Editor to automatically create a user profile when they sign up.

-- 1. Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, display_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    -- Create a default username from email prefix + random string to avoid collisions
    coalesce(
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 6)
    ),
    -- Display name defaults to username or just empty
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now(),
    now()
  );
  
  -- Optionally initialize user_stats here if you have a separate stats table
  -- insert into public.user_stats (user_id) values (new.id);
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Create the trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
