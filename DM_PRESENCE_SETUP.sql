-- Direct Messages and Presence System Setup
-- Run this in Supabase SQL Editor

-- 1. Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for DM queries
CREATE INDEX idx_dm_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_dm_unread ON direct_messages(receiver_id, read) WHERE read = FALSE;

-- 3. Enable RLS on direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for direct_messages
-- Users can read messages they sent or received
CREATE POLICY "Users can read own DMs"
  ON direct_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can send DMs
CREATE POLICY "Users can send DMs"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can mark their received DMs as read
CREATE POLICY "Users can mark DMs as read"
  ON direct_messages FOR UPDATE
  USING (
    auth.uid() = receiver_id
  );

-- 5. Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- 6. Create function to get unread DM count
CREATE OR REPLACE FUNCTION get_unread_dm_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM direct_messages
    WHERE receiver_id = user_id AND read = FALSE
  );
END;
$$;

-- 7. Create function to get conversation list
CREATE OR REPLACE FUNCTION get_dm_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_username TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT
      CASE
        WHEN dm.sender_id = user_id THEN dm.receiver_id
        ELSE dm.sender_id
      END AS other_id,
      dm.content,
      dm.created_at,
      dm.read,
      dm.receiver_id
    FROM direct_messages dm
    WHERE dm.sender_id = user_id OR dm.receiver_id = user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (c.other_id)
      c.other_id,
      c.content,
      c.created_at,
      c.read,
      c.receiver_id
    FROM conversations c
    ORDER BY c.other_id, c.created_at DESC
  )
  SELECT
    lm.other_id,
    p.username,
    lm.content,
    lm.created_at,
    (
      SELECT COUNT(*)
      FROM conversations c2
      WHERE c2.other_id = lm.other_id
        AND c2.read = FALSE
        AND c2.receiver_id = user_id
    ) AS unread_count
  FROM latest_messages lm
  JOIN profiles p ON p.id = lm.other_id
  ORDER BY lm.created_at DESC;
END;
$$;

-- 8. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_unread_dm_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dm_conversations(UUID) TO authenticated;

-- Verify setup
SELECT 'DM and Presence system setup complete!' as status;
