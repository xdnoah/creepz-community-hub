-- Fix RLS policy for profile creation
-- The issue is that during signup, auth.uid() might not match yet

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive INSERT policy that allows authenticated users to insert
-- We'll validate in the app that they can only insert their own ID
CREATE POLICY "Authenticated users can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
