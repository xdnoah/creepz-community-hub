-- Talent Tree System
-- Migration for v1.8.0

-- Create talent_allocations table to track user's talent points
CREATE TABLE IF NOT EXISTS talent_allocations (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Money Tree talents (10 levels)
  money_tree_level INTEGER NOT NULL DEFAULT 0 CHECK (money_tree_level >= 0 AND money_tree_level <= 10),

  -- Shop Tree talents (10 levels)
  shop_tree_level INTEGER NOT NULL DEFAULT 0 CHECK (shop_tree_level >= 0 AND shop_tree_level <= 10),

  -- Defense Build talents (10 levels)
  def_build_level INTEGER NOT NULL DEFAULT 0 CHECK (def_build_level >= 0 AND def_build_level <= 10),

  -- Damage Build talents (10 levels)
  dmg_build_level INTEGER NOT NULL DEFAULT 0 CHECK (dmg_build_level >= 0 AND dmg_build_level <= 10),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE talent_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own talents"
  ON talent_allocations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own talents"
  ON talent_allocations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talents"
  ON talent_allocations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to calculate total points spent
CREATE OR REPLACE FUNCTION get_total_talent_points_spent(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_money_tree INTEGER;
  v_shop_tree INTEGER;
  v_def_build INTEGER;
  v_dmg_build INTEGER;
  v_total INTEGER := 0;
  i INTEGER;
BEGIN
  -- Get current talent levels
  SELECT
    COALESCE(money_tree_level, 0),
    COALESCE(shop_tree_level, 0),
    COALESCE(def_build_level, 0),
    COALESCE(dmg_build_level, 0)
  INTO v_money_tree, v_shop_tree, v_def_build, v_dmg_build
  FROM talent_allocations
  WHERE user_id = p_user_id;

  -- If no record exists, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate points for each tree (level 1 costs 1 point, level 2 costs 2 points, etc.)
  FOR i IN 1..v_money_tree LOOP
    v_total := v_total + i;
  END LOOP;

  FOR i IN 1..v_shop_tree LOOP
    v_total := v_total + i;
  END LOOP;

  FOR i IN 1..v_def_build LOOP
    v_total := v_total + i;
  END LOOP;

  FOR i IN 1..v_dmg_build LOOP
    v_total := v_total + i;
  END LOOP;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get available talent points (lizard level - spent points)
CREATE OR REPLACE FUNCTION get_available_talent_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_lizard_level INTEGER;
  v_spent_points INTEGER;
BEGIN
  -- Get lizard level
  SELECT level INTO v_lizard_level FROM lizards WHERE id = p_user_id;
  IF v_lizard_level IS NULL THEN
    v_lizard_level := 0;
  END IF;

  -- Get spent points
  v_spent_points := get_total_talent_points_spent(p_user_id);

  RETURN GREATEST(0, v_lizard_level - v_spent_points);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to allocate talent point
CREATE OR REPLACE FUNCTION allocate_talent_point(
  p_user_id UUID,
  p_talent_tree TEXT -- 'money_tree', 'shop_tree', 'def_build', 'dmg_build'
)
RETURNS TABLE(success BOOLEAN, error_message TEXT) AS $$
DECLARE
  v_available_points INTEGER;
  v_current_level INTEGER;
  v_cost INTEGER;
BEGIN
  -- Check available points
  v_available_points := get_available_talent_points(p_user_id);

  IF v_available_points <= 0 THEN
    RETURN QUERY SELECT FALSE, 'No talent points available'::TEXT;
    RETURN;
  END IF;

  -- Insert record if doesn't exist
  INSERT INTO talent_allocations (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current level for the tree
  EXECUTE format('SELECT %I FROM talent_allocations WHERE user_id = $1', p_talent_tree || '_level')
  INTO v_current_level
  USING p_user_id;

  IF v_current_level IS NULL THEN
    v_current_level := 0;
  END IF;

  -- Check if already at max level
  IF v_current_level >= 10 THEN
    RETURN QUERY SELECT FALSE, 'Talent already at max level (10)'::TEXT;
    RETURN;
  END IF;

  -- Calculate cost (next level number)
  v_cost := v_current_level + 1;

  -- Check if have enough points
  IF v_available_points < v_cost THEN
    RETURN QUERY SELECT FALSE, format('Need %s points, have %s', v_cost, v_available_points)::TEXT;
    RETURN;
  END IF;

  -- Allocate point
  EXECUTE format('UPDATE talent_allocations SET %I = %I + 1, updated_at = NOW() WHERE user_id = $1',
    p_talent_tree || '_level', p_talent_tree || '_level')
  USING p_user_id;

  RETURN QUERY SELECT TRUE, ''::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset all talents
CREATE OR REPLACE FUNCTION reset_all_talents(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE talent_allocations
  SET
    money_tree_level = 0,
    shop_tree_level = 0,
    def_build_level = 0,
    dmg_build_level = 0,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no record exists, insert one
  IF NOT FOUND THEN
    INSERT INTO talent_allocations (user_id) VALUES (p_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_talent_allocations_user_id ON talent_allocations(user_id);
