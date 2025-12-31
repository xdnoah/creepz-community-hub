-- Clean up orphaned auth users (users without profiles)
-- Run this in Supabase SQL Editor

-- Delete auth users that don't have a corresponding profile
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Verify cleanup
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles;
