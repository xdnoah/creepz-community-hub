-- LizardGoshi Game Schema

-- Create lizards table for the idle RPG game
CREATE TABLE IF NOT EXISTS lizards (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  level INTEGER NOT NULL DEFAULT 1,

  -- Base stats
  hp INTEGER NOT NULL DEFAULT 100,
  def INTEGER NOT NULL DEFAULT 0,
  atk INTEGER NOT NULL DEFAULT 5,
  crit_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
  crit_damage DECIMAL(5,4) NOT NULL DEFAULT 0.50,

  -- Economy
  gold BIGINT NOT NULL DEFAULT 0,
  passive_income DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  total_gold_earned BIGINT NOT NULL DEFAULT 0,

  -- Time tracking for offline gold accumulation
  last_gold_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Feed system
  fed_at TIMESTAMPTZ,
  is_fed BOOLEAN NOT NULL DEFAULT false,

  -- Daily login streak
  last_login TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  login_streak INTEGER NOT NULL DEFAULT 0,
  login_streak_claimed BOOLEAN NOT NULL DEFAULT false,

  -- Achievements tracking
  messages_sent INTEGER NOT NULL DEFAULT 0,
  total_levels_gained INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create raided_tweets table to track which tweets user has raided
CREATE TABLE IF NOT EXISTS raided_tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raid_link_id UUID NOT NULL REFERENCES raid_links(id) ON DELETE CASCADE,
  raided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user can only raid a tweet once
  UNIQUE(user_id, raid_link_id)
);

-- Enable RLS
ALTER TABLE lizards ENABLE ROW LEVEL SECURITY;
ALTER TABLE raided_tweets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lizards
CREATE POLICY "Users can view all lizards"
  ON lizards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own lizard"
  ON lizards FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own lizard"
  ON lizards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for raided_tweets
CREATE POLICY "Users can view their own raided tweets"
  ON raided_tweets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own raided tweets"
  ON raided_tweets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own raided tweets"
  ON raided_tweets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_raided_tweets_user_id ON raided_tweets(user_id);
CREATE INDEX idx_raided_tweets_raid_link_id ON raided_tweets(raid_link_id);
CREATE INDEX idx_raided_tweets_created_at ON raided_tweets(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lizard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lizard_updated_at
  BEFORE UPDATE ON lizards
  FOR EACH ROW
  EXECUTE FUNCTION update_lizard_timestamp();

-- Function to calculate offline gold (called when user logs in)
CREATE OR REPLACE FUNCTION calculate_offline_gold(lizard_id UUID)
RETURNS BIGINT AS $$
DECLARE
  lizard_record RECORD;
  time_diff_seconds BIGINT;
  income_rate DECIMAL;
  gold_earned BIGINT;
BEGIN
  SELECT * INTO lizard_record FROM lizards WHERE id = lizard_id;

  -- Calculate time difference in seconds
  time_diff_seconds := EXTRACT(EPOCH FROM (NOW() - lizard_record.last_gold_update));

  -- Calculate income rate (doubled if fed and still within 12 hours)
  income_rate := lizard_record.passive_income;
  IF lizard_record.is_fed AND lizard_record.fed_at IS NOT NULL THEN
    IF (NOW() - lizard_record.fed_at) < INTERVAL '12 hours' THEN
      income_rate := income_rate * 2;
    END IF;
  END IF;

  -- Calculate gold earned (gold per second * seconds elapsed)
  gold_earned := FLOOR(income_rate * time_diff_seconds);

  -- Cap at reasonable amount (30 days worth)
  IF gold_earned > (income_rate * 60 * 60 * 24 * 30) THEN
    gold_earned := FLOOR(income_rate * 60 * 60 * 24 * 30);
  END IF;

  RETURN gold_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync offline gold and update last_gold_update
CREATE OR REPLACE FUNCTION sync_offline_gold(lizard_id UUID)
RETURNS TABLE(gold_earned BIGINT, new_total BIGINT) AS $$
DECLARE
  earned BIGINT;
BEGIN
  -- Calculate offline gold
  earned := calculate_offline_gold(lizard_id);

  -- Update the lizard
  UPDATE lizards
  SET
    gold = gold + earned,
    total_gold_earned = total_gold_earned + earned,
    last_gold_update = NOW(),
    -- Check if feed buff expired
    is_fed = CASE
      WHEN is_fed AND fed_at IS NOT NULL AND (NOW() - fed_at) >= INTERVAL '12 hours'
      THEN false
      ELSE is_fed
    END
  WHERE id = lizard_id;

  RETURN QUERY SELECT earned, (SELECT gold FROM lizards WHERE id = lizard_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
