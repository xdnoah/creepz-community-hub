-- RAID LINKS SETUP
-- This script sets up the raid links system where users can share tweet links for raiding

-- Create raid_links table
CREATE TABLE IF NOT EXISTS raid_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tweet_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_raid_links_created_at ON raid_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_raid_links_user_id ON raid_links(user_id);

-- Enable Row Level Security
ALTER TABLE raid_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read raid links
CREATE POLICY "Anyone can view raid links"
  ON raid_links
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert raid links
CREATE POLICY "Authenticated users can create raid links"
  ON raid_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own raid links
CREATE POLICY "Users can delete their own raid links"
  ON raid_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE raid_links;

-- Grant permissions
GRANT SELECT ON raid_links TO anon, authenticated;
GRANT INSERT ON raid_links TO authenticated;
GRANT DELETE ON raid_links TO authenticated;
