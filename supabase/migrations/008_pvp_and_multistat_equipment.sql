-- PvP and Multi-Stat Equipment Migration
-- Adds PvP stats (attack_speed, regeneration) and updates equipment to support multiple stats

-- 1. Add new stats to lizards table
ALTER TABLE lizards
  ADD COLUMN IF NOT EXISTS attack_speed INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS regeneration DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 2. Add new stat types to enum
ALTER TYPE equipment_stat_type ADD VALUE IF NOT EXISTS 'attack_speed';
ALTER TYPE equipment_stat_type ADD VALUE IF NOT EXISTS 'regeneration';

-- 3. Drop and recreate user_equipment table with JSONB stats
DROP TABLE IF EXISTS user_equipment CASCADE;

CREATE TABLE user_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Equipment properties
  equipment_type equipment_type NOT NULL,
  rarity equipment_rarity NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),

  -- Stats - now supports multiple stats per item
  -- Format: [{"type": "hp", "value": 100}, {"type": "atk", "value": 50}, ...]
  stats JSONB NOT NULL,

  -- Economy
  purchase_price BIGINT NOT NULL,

  -- State
  is_equipped BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Drop and recreate shop_inventory table with JSONB stats
DROP TABLE IF EXISTS shop_inventory CASCADE;

CREATE TABLE shop_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Shop slot (1-6)
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 6),

  -- Equipment properties
  equipment_type equipment_type NOT NULL,
  rarity equipment_rarity NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),

  -- Stats - now supports multiple stats per item
  stats JSONB NOT NULL,

  -- Economy
  price BIGINT NOT NULL,

  -- Shop refresh tracking
  last_refresh TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_slot UNIQUE (user_id, slot)
);

-- 5. Recreate indexes
CREATE INDEX idx_user_equipment_user_id ON user_equipment(user_id);
CREATE INDEX idx_user_equipment_equipped ON user_equipment(user_id, is_equipped) WHERE is_equipped = true;
CREATE UNIQUE INDEX unique_equipped_type ON user_equipment(user_id, equipment_type) WHERE is_equipped = true;
CREATE INDEX idx_shop_inventory_user_id ON shop_inventory(user_id);
CREATE INDEX idx_shop_inventory_refresh ON shop_inventory(user_id, last_refresh);

-- 6. Recreate RLS policies
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_equipment_select_own ON user_equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_equipment_insert_own ON user_equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_equipment_update_own ON user_equipment FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY user_equipment_delete_own ON user_equipment FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY shop_inventory_select_own ON shop_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY shop_inventory_insert_own ON shop_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY shop_inventory_update_own ON shop_inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY shop_inventory_delete_own ON shop_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Update stat value calculation function
CREATE OR REPLACE FUNCTION calculate_equipment_stat_value(
  p_stat_type equipment_stat_type,
  p_rarity equipment_rarity,
  p_level INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  base_value DECIMAL;
  rarity_multiplier DECIMAL;
BEGIN
  -- Base values for each stat type
  CASE p_stat_type
    WHEN 'hp' THEN base_value := 20.0;
    WHEN 'atk' THEN base_value := 5.0;
    WHEN 'def' THEN base_value := 3.0;
    WHEN 'crit_rate' THEN base_value := 0.01;
    WHEN 'crit_damage' THEN base_value := 0.02;
    WHEN 'gold_per_second' THEN base_value := 0.5;
    WHEN 'attack_speed' THEN base_value := 2.0;
    WHEN 'regeneration' THEN base_value := 1.0;
  END CASE;

  -- Rarity multipliers
  CASE p_rarity
    WHEN 'common' THEN rarity_multiplier := 1.0;
    WHEN 'uncommon' THEN rarity_multiplier := 1.5;
    WHEN 'rare' THEN rarity_multiplier := 2.0;
    WHEN 'epic' THEN rarity_multiplier := 3.0;
    WHEN 'legendary' THEN rarity_multiplier := 5.0;
    WHEN 'mythical' THEN rarity_multiplier := 8.0;
  END CASE;

  RETURN base_value * rarity_multiplier * p_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Create function to generate random stats based on rarity
CREATE OR REPLACE FUNCTION generate_equipment_stats(
  p_rarity equipment_rarity,
  p_level INTEGER
)
RETURNS JSONB AS $$
DECLARE
  num_stats INTEGER;
  stats JSONB := '[]'::jsonb;
  stat_types equipment_stat_type[] := ARRAY[]::equipment_stat_type[];
  all_stat_types equipment_stat_type[] := ARRAY['hp', 'atk', 'def', 'crit_rate', 'crit_damage', 'gold_per_second', 'attack_speed', 'regeneration']::equipment_stat_type[];
  selected_type equipment_stat_type;
  stat_value DECIMAL;
  i INTEGER;
BEGIN
  -- Determine number of stats based on rarity
  CASE p_rarity
    WHEN 'common' THEN num_stats := 1;
    WHEN 'uncommon' THEN num_stats := 1;
    WHEN 'rare' THEN num_stats := 2;
    WHEN 'epic' THEN num_stats := 2;
    WHEN 'legendary' THEN num_stats := 3;
    WHEN 'mythical' THEN num_stats := 4;
  END CASE;

  -- Randomly select unique stat types
  FOR i IN 1..num_stats LOOP
    LOOP
      selected_type := all_stat_types[1 + floor(random() * array_length(all_stat_types, 1))::int];
      EXIT WHEN NOT (selected_type = ANY(stat_types));
    END LOOP;

    stat_types := stat_types || selected_type;
    stat_value := calculate_equipment_stat_value(selected_type, p_rarity, p_level);

    stats := stats || jsonb_build_object(
      'type', selected_type::text,
      'value', stat_value
    );
  END LOOP;

  RETURN stats;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 9. Update refresh_shop function to use new stats system
CREATE OR REPLACE FUNCTION refresh_shop(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  lizard_level INTEGER;
  i INTEGER;
  generated_stats JSONB;
  generated_rarity equipment_rarity;
  generated_type equipment_type;
  generated_level INTEGER;
  calculated_price BIGINT;
BEGIN
  -- Get user's lizard level
  SELECT level INTO lizard_level FROM lizards WHERE id = p_user_id;
  IF lizard_level IS NULL THEN
    lizard_level := 1;
  END IF;

  -- Clear existing shop
  DELETE FROM shop_inventory WHERE user_id = p_user_id;

  -- Generate 6 new items
  FOR i IN 1..6 LOOP
    generated_rarity := generate_random_rarity();
    generated_type := generate_random_equipment_type();
    generated_level := generate_random_level(lizard_level);
    generated_stats := generate_equipment_stats(generated_rarity, generated_level);
    calculated_price := calculate_equipment_price(generated_rarity, generated_level);

    INSERT INTO shop_inventory (
      user_id,
      slot,
      equipment_type,
      rarity,
      level,
      stats,
      price,
      last_refresh
    ) VALUES (
      p_user_id,
      i,
      generated_type,
      generated_rarity,
      generated_level,
      generated_stats,
      calculated_price,
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
