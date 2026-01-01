-- Dynamic shop size based on lizard level
-- Migration for v1.8.0

-- FIRST: Remove old slot constraint and add new one allowing up to 12 slots
ALTER TABLE shop_inventory
DROP CONSTRAINT IF EXISTS shop_inventory_slot_check;

ALTER TABLE shop_inventory
ADD CONSTRAINT shop_inventory_slot_check
CHECK (slot >= 1 AND slot <= 12);

-- THEN: Update refresh_shop to add 1 item per 5 levels (max 12 items at level 30)
CREATE OR REPLACE FUNCTION refresh_shop(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  lizard_level INTEGER;
  num_items INTEGER;
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

  -- Calculate number of shop items based on level
  -- Base: 6 items
  -- +1 item every 5 levels until level 30 (max 12 items)
  num_items := LEAST(6 + FLOOR(lizard_level / 5), 12);

  -- Clear existing shop
  DELETE FROM shop_inventory WHERE user_id = p_user_id;

  -- Generate items
  FOR i IN 1..num_items LOOP
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
