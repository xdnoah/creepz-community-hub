-- Fix RLS policy for messages to allow authenticated users to send messages

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;

-- Create a more permissive policy that checks if user is authenticated
-- The app will ensure user_id matches auth.uid()
CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- Also add a policy for username_history
DROP POLICY IF EXISTS "Users can insert own history" ON username_history;

CREATE POLICY "Authenticated users can add history"
  ON username_history FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- Verify policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('messages', 'username_history')
ORDER BY tablename, policyname;
