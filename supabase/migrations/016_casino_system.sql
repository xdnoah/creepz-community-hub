-- Casino System
-- Track casino statistics and ensure fair odds

CREATE TABLE IF NOT EXISTS casino_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Game statistics
  dice_games_played INTEGER NOT NULL DEFAULT 0,
  dice_total_wagered BIGINT NOT NULL DEFAULT 0,
  dice_total_won BIGINT NOT NULL DEFAULT 0,

  plinko_games_played INTEGER NOT NULL DEFAULT 0,
  plinko_total_wagered BIGINT NOT NULL DEFAULT 0,
  plinko_total_won BIGINT NOT NULL DEFAULT 0,

  mystery_box_opened INTEGER NOT NULL DEFAULT 0,
  mystery_box_total_spent BIGINT NOT NULL DEFAULT 0,
  mystery_box_total_won BIGINT NOT NULL DEFAULT 0,

  -- Anti-abuse: daily limits
  last_casino_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_wagers BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE casino_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own casino stats"
  ON casino_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own casino stats"
  ON casino_stats FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_casino_stats_user_id ON casino_stats(user_id);
