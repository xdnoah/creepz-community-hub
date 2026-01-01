-- Lower attack stats in shop items
-- Migration for v1.8.0

-- Update the calculate_stat_value function to have lower attack base values
CREATE OR REPLACE FUNCTION calculate_stat_value(
  p_stat_type TEXT,
  p_rarity TEXT,
  p_level INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  base_value DECIMAL;
  rarity_multiplier DECIMAL;
BEGIN
  -- Base values for each stat type (LOWERED ATK from 5.0 to 1.5)
  CASE p_stat_type
    WHEN 'hp' THEN base_value := 20.0;
    WHEN 'atk' THEN base_value := 1.5;  -- LOWERED from 5.0
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
    ELSE rarity_multiplier := 1.0;
  END CASE;

  -- Calculate final value: base * rarity * (1 + level * 0.1)
  -- This means each level adds 10% more stats
  RETURN base_value * rarity_multiplier * (1 + (p_level * 0.1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
