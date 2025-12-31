-- Equipment System Migration
-- Adds shop and equipment functionality to LizardGoshi

-- Equipment types enum
CREATE TYPE equipment_type AS ENUM (
  'helmet',
  'chest',
  'gloves',
  'boots',
  'weapon',
  'shield',
  'ring',
  'necklace',
  'belt',
  'cape'
);

-- Equipment rarity enum
CREATE TYPE equipment_rarity AS ENUM (
  'common',      -- 57.45%
  'uncommon',    -- 30%
  'rare',        -- 10%
  'epic',        -- 2%
  'legendary',   -- 0.5%
  'mythical'     -- 0.05%
);

-- Stat types that equipment can provide
CREATE TYPE equipment_stat_type AS ENUM (
  'hp',
  'atk',
  'def',
  'crit_rate',
  'crit_damage',
  'gold_per_second'
);

-- User's equipment inventory (owned items)
CREATE TABLE IF NOT EXISTS user_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Equipment properties
  equipment_type equipment_type NOT NULL,
  rarity equipment_rarity NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),

  -- Stats
  stat_type equipment_stat_type NOT NULL,
  stat_value DECIMAL(10,2) NOT NULL,

  -- Economy
  purchase_price BIGINT NOT NULL,

  -- State
  is_equipped BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shop inventory (personal shop for each user, 6 slots)
CREATE TABLE IF NOT EXISTS shop_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Shop slot (1-6)
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 6),

  -- Equipment properties
  equipment_type equipment_type NOT NULL,
  rarity equipment_rarity NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),

  -- Stats
  stat_type equipment_stat_type NOT NULL,
  stat_value DECIMAL(10,2) NOT NULL,

  -- Economy
  price BIGINT NOT NULL,

  -- Shop refresh tracking
  last_refresh TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  -- Only one item per slot per user
  CONSTRAINT unique_user_slot UNIQUE (user_id, slot)
);

-- Indexes for performance
CREATE INDEX idx_user_equipment_user_id ON user_equipment(user_id);
CREATE INDEX idx_user_equipment_equipped ON user_equipment(user_id, is_equipped) WHERE is_equipped = true;
CREATE INDEX idx_shop_inventory_user_id ON shop_inventory(user_id);
CREATE INDEX idx_shop_inventory_refresh ON shop_inventory(user_id, last_refresh);

-- Partial unique index to enforce only one equipped item per type per user
CREATE UNIQUE INDEX unique_equipped_type ON user_equipment(user_id, equipment_type) WHERE is_equipped = true;

-- RLS Policies
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;

-- Users can read their own equipment
CREATE POLICY user_equipment_select_own
  ON user_equipment FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own equipment
CREATE POLICY user_equipment_insert_own
  ON user_equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own equipment
CREATE POLICY user_equipment_update_own
  ON user_equipment FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own equipment
CREATE POLICY user_equipment_delete_own
  ON user_equipment FOR DELETE
  USING (auth.uid() = user_id);

-- Users can read their own shop
CREATE POLICY shop_inventory_select_own
  ON shop_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own shop items (via function)
CREATE POLICY shop_inventory_insert_own
  ON shop_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own shop items
CREATE POLICY shop_inventory_update_own
  ON shop_inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own shop items
CREATE POLICY shop_inventory_delete_own
  ON shop_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_equipment_timestamp
  BEFORE UPDATE ON user_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_timestamp();

-- Function to calculate equipment stat value based on rarity and level
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
  -- Base values per stat type (at level 1, common rarity)
  CASE p_stat_type
    WHEN 'hp' THEN base_value := 5;
    WHEN 'atk' THEN base_value := 2;
    WHEN 'def' THEN base_value := 2;
    WHEN 'crit_rate' THEN base_value := 0.01;  -- 1%
    WHEN 'crit_damage' THEN base_value := 0.02; -- 2%
    WHEN 'gold_per_second' THEN base_value := 1;
  END CASE;

  -- Rarity multipliers
  CASE p_rarity
    WHEN 'common' THEN rarity_multiplier := 1.0;
    WHEN 'uncommon' THEN rarity_multiplier := 2.0;
    WHEN 'rare' THEN rarity_multiplier := 3.0;
    WHEN 'epic' THEN rarity_multiplier := 5.0;
    WHEN 'legendary' THEN rarity_multiplier := 8.0;
    WHEN 'mythical' THEN rarity_multiplier := 12.0;
  END CASE;

  -- Calculate final value: base * rarity * level
  RETURN base_value * rarity_multiplier * p_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate equipment price based on rarity and level
CREATE OR REPLACE FUNCTION calculate_equipment_price(
  p_rarity equipment_rarity,
  p_level INTEGER
)
RETURNS BIGINT AS $$
DECLARE
  base_price BIGINT := 200;
  rarity_multiplier DECIMAL;
  level_multiplier DECIMAL;
BEGIN
  -- Rarity multipliers for price
  CASE p_rarity
    WHEN 'common' THEN rarity_multiplier := 1.0;
    WHEN 'uncommon' THEN rarity_multiplier := 2.0;
    WHEN 'rare' THEN rarity_multiplier := 3.0;
    WHEN 'epic' THEN rarity_multiplier := 5.0;
    WHEN 'legendary' THEN rarity_multiplier := 10.0;
    WHEN 'mythical' THEN rarity_multiplier := 20.0;
  END CASE;

  -- Level multiplier (balanced scaling)
  level_multiplier := 1.0 + (p_level - 1) * 0.5;

  -- Calculate final price
  RETURN FLOOR(base_price * rarity_multiplier * level_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate random rarity based on drop rates
CREATE OR REPLACE FUNCTION generate_random_rarity()
RETURNS equipment_rarity AS $$
DECLARE
  roll DECIMAL;
BEGIN
  -- Generate random number between 0 and 100
  roll := random() * 100;

  -- Apply drop rates (cumulative)
  IF roll < 0.05 THEN
    RETURN 'mythical'::equipment_rarity;  -- 0.05%
  ELSIF roll < 0.55 THEN
    RETURN 'legendary'::equipment_rarity; -- 0.5%
  ELSIF roll < 2.55 THEN
    RETURN 'epic'::equipment_rarity;      -- 2%
  ELSIF roll < 12.55 THEN
    RETURN 'rare'::equipment_rarity;      -- 10%
  ELSIF roll < 42.55 THEN
    RETURN 'uncommon'::equipment_rarity;  -- 30%
  ELSE
    RETURN 'common'::equipment_rarity;    -- 57.45%
  END IF;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to generate random equipment type
CREATE OR REPLACE FUNCTION generate_random_equipment_type()
RETURNS equipment_type AS $$
DECLARE
  types equipment_type[] := ARRAY[
    'helmet', 'chest', 'gloves', 'boots', 'weapon',
    'shield', 'ring', 'necklace', 'belt', 'cape'
  ]::equipment_type[];
BEGIN
  RETURN types[1 + floor(random() * array_length(types, 1))];
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to generate random stat type
CREATE OR REPLACE FUNCTION generate_random_stat_type()
RETURNS equipment_stat_type AS $$
DECLARE
  types equipment_stat_type[] := ARRAY[
    'hp', 'atk', 'def', 'crit_rate', 'crit_damage', 'gold_per_second'
  ]::equipment_stat_type[];
BEGIN
  RETURN types[1 + floor(random() * array_length(types, 1))];
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to generate random level based on lizard level
CREATE OR REPLACE FUNCTION generate_random_level(lizard_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Equal chance for any level from 1 to lizard_level
  RETURN 1 + floor(random() * lizard_level);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to refresh shop inventory (generates 6 new items)
CREATE OR REPLACE FUNCTION refresh_shop(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  lizard_level INTEGER;
  i INTEGER;
  new_type equipment_type;
  new_rarity equipment_rarity;
  new_level INTEGER;
  new_stat_type equipment_stat_type;
  new_stat_value DECIMAL;
  new_price BIGINT;
BEGIN
  -- Get user's lizard level
  SELECT level INTO lizard_level
  FROM lizards
  WHERE id = p_user_id;

  -- Default to level 1 if no lizard found
  IF lizard_level IS NULL THEN
    lizard_level := 1;
  END IF;

  -- Delete existing shop items
  DELETE FROM shop_inventory WHERE user_id = p_user_id;

  -- Generate 6 new items
  FOR i IN 1..6 LOOP
    new_type := generate_random_equipment_type();
    new_rarity := generate_random_rarity();
    new_level := generate_random_level(lizard_level);
    new_stat_type := generate_random_stat_type();
    new_stat_value := calculate_equipment_stat_value(new_stat_type, new_rarity, new_level);
    new_price := calculate_equipment_price(new_rarity, new_level);

    INSERT INTO shop_inventory (
      user_id, slot, equipment_type, rarity, level,
      stat_type, stat_value, price, last_refresh
    ) VALUES (
      p_user_id, i, new_type, new_rarity, new_level,
      new_stat_type, new_stat_value, new_price, NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
