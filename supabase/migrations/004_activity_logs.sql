-- Activity Logs Schema

-- Create activity_logs table for tracking community activity
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'user_joined',
    'raid_added',
    'tweet_raided',
    'lizard_levelup',
    'login_streak_milestone',
    'lizard_fed',
    'daily_reward_claimed'
  )),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone authenticated can read activity logs
CREATE POLICY "Anyone can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Users can insert their own activity logs
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_username TEXT,
  p_activity_type TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, username, activity_type, metadata)
  VALUES (p_user_id, p_username, p_activity_type, p_metadata)
  RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log when a user joins (profile created)
CREATE OR REPLACE FUNCTION log_user_joined()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.id,
    NEW.username,
    'user_joined',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_user_joined
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_user_joined();

-- Clean up old activity logs (keep last 1000 entries)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE id IN (
    SELECT id FROM activity_logs
    ORDER BY created_at DESC
    OFFSET 1000
  );
END;
$$ LANGUAGE plpgsql;
