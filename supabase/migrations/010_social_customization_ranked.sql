-- Social Links, Lizard Customization, Ranked PvP System, Equipment Upgrades
-- Migration for v1.6.0

-- 1. Add social links to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
  ADD COLUMN IF NOT EXISTS discord_tag TEXT;

-- 2. Add lizard customization options
ALTER TABLE lizards
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS pattern TEXT DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS eye_style TEXT DEFAULT 'normal';

-- 3. Add ranked PvP system
ALTER TABLE lizards
  ADD COLUMN IF NOT EXISTS rank_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_tier TEXT NOT NULL DEFAULT 'bronze';

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_lizards_rank_points ON lizards(rank_points DESC);

-- 4. Create table to track who fought whom (for hourly limit)
CREATE TABLE IF NOT EXISTS pvp_fight_cooldowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attacker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  defender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_ranked_fight TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_fight_pair UNIQUE (attacker_id, defender_id)
);

CREATE INDEX IF NOT EXISTS idx_pvp_cooldowns_attacker ON pvp_fight_cooldowns(attacker_id);
CREATE INDEX IF NOT EXISTS idx_pvp_cooldowns_time ON pvp_fight_cooldowns(last_ranked_fight);

-- Enable RLS
ALTER TABLE pvp_fight_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY pvp_cooldowns_select_own ON pvp_fight_cooldowns FOR SELECT
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

CREATE POLICY pvp_cooldowns_insert_own ON pvp_fight_cooldowns FOR INSERT
  WITH CHECK (auth.uid() = attacker_id);

CREATE POLICY pvp_cooldowns_update_own ON pvp_fight_cooldowns FOR UPDATE
  USING (auth.uid() = attacker_id);

-- 5. Add upgrade level to equipment
ALTER TABLE user_equipment
  ADD COLUMN IF NOT EXISTS upgrade_level INTEGER NOT NULL DEFAULT 0 CHECK (upgrade_level >= 0 AND upgrade_level <= 10);

-- 6. Update fight_history to include rank points
ALTER TABLE fight_history
  ADD COLUMN IF NOT EXISTS rank_points_change INTEGER DEFAULT 0;

-- 7. Function to calculate rank points gained/lost
CREATE OR REPLACE FUNCTION calculate_rank_points(
  p_attacker_level INTEGER,
  p_defender_level INTEGER,
  p_attacker_won BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  level_diff INTEGER;
  base_points INTEGER;
BEGIN
  -- Calculate level difference
  level_diff := p_defender_level - p_attacker_level;

  -- Base points (10 for equal level)
  base_points := 10;

  -- Adjust for level difference (+2 per level higher, minimum 3)
  base_points := GREATEST(3, base_points + (level_diff * 2));

  -- Winner gets points, loser gets 0 (defender never loses points)
  IF p_attacker_won THEN
    RETURN base_points;
  ELSE
    RETURN -FLOOR(base_points / 2); -- Attacker loses half the points they would have won
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Function to determine rank tier based on points
CREATE OR REPLACE FUNCTION get_rank_tier(p_rank_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_rank_points >= 2000 THEN RETURN 'legend';
  ELSIF p_rank_points >= 1500 THEN RETURN 'diamond';
  ELSIF p_rank_points >= 1000 THEN RETURN 'platinum';
  ELSIF p_rank_points >= 700 THEN RETURN 'gold';
  ELSIF p_rank_points >= 400 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. Create activity types enum for filtering
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('fight', 'equipment', 'level_up', 'achievement', 'social');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 10. Add activity type to activity_log (if table exists)
DO $$ BEGIN
  ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS activity_type activity_type DEFAULT 'fight';
EXCEPTION
  WHEN undefined_table THEN null;
END $$;
