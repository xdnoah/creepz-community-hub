-- User Presence System Setup
-- Run this in Supabase SQL Editor AFTER running DM_PRESENCE_SETUP.sql

-- 1. Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'offline')) DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for presence queries
CREATE INDEX idx_presence_status ON user_presence(status, last_seen DESC);

-- 3. Enable RLS on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_presence
-- Everyone can see who's online
CREATE POLICY "Anyone can view presence"
  ON user_presence FOR SELECT
  USING (true);

-- Users can only update their own presence
CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- 6. Create function to update presence
CREATE OR REPLACE FUNCTION update_user_presence(status_val TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (auth.uid(), status_val, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = status_val,
    last_seen = NOW(),
    updated_at = NOW();
END;
$$;

-- 7. Create function to get online users
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  status TEXT,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    COALESCE(up.status, 'offline') as status,
    COALESCE(up.last_seen, p.created_at) as last_seen
  FROM profiles p
  LEFT JOIN user_presence up ON up.user_id = p.id
  ORDER BY
    CASE WHEN up.status = 'online' THEN 0 ELSE 1 END,
    up.last_seen DESC NULLS LAST;
END;
$$;

-- 8. Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_presence(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_users() TO authenticated;

-- Verify setup
SELECT 'Presence system setup complete!' as status;
