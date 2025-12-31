-- Run this to verify your database is set up correctly

-- Check if tables exist
SELECT
  'profiles' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') as exists
UNION ALL
SELECT
  'messages' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') as exists
UNION ALL
SELECT
  'username_history' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'username_history') as exists;

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'check_username_available';
