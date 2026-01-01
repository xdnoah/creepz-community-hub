-- Migration: Fix gold balance issues
-- Prevents negative gold and ensures proper gold updates

-- 1. Add CHECK constraint to prevent negative gold
ALTER TABLE lizards
DROP CONSTRAINT IF EXISTS lizards_gold_check;

ALTER TABLE lizards
ADD CONSTRAINT lizards_gold_check
CHECK (gold >= 0);

-- 2. Add CHECK constraint to prevent negative total_gold_earned
ALTER TABLE lizards
DROP CONSTRAINT IF EXISTS lizards_total_gold_earned_check;

ALTER TABLE lizards
ADD CONSTRAINT lizards_total_gold_earned_check
CHECK (total_gold_earned >= 0);

-- 3. Create a safer gold update function that prevents negative balances
CREATE OR REPLACE FUNCTION safe_deduct_gold(
  p_lizard_id UUID,
  p_amount NUMERIC,
  p_reason TEXT DEFAULT 'deduction'
)
RETURNS TABLE(success BOOLEAN, new_gold NUMERIC, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_gold NUMERIC;
  v_new_gold NUMERIC;
BEGIN
  -- Get current gold with row lock
  SELECT gold INTO v_current_gold
  FROM lizards
  WHERE id = p_lizard_id
  FOR UPDATE;

  -- Check if lizard exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 'Lizard not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate new gold
  v_new_gold := FLOOR(v_current_gold - p_amount);

  -- Check if would go negative
  IF v_new_gold < 0 THEN
    RETURN QUERY SELECT FALSE, v_current_gold, 'Insufficient gold'::TEXT;
    RETURN;
  END IF;

  -- Update gold
  UPDATE lizards
  SET gold = v_new_gold,
      updated_at = NOW()
  WHERE id = p_lizard_id;

  -- Return success
  RETURN QUERY SELECT TRUE, v_new_gold, ''::TEXT;
END;
$$;

-- 4. Create a safe function to add gold (can't go negative)
CREATE OR REPLACE FUNCTION safe_add_gold(
  p_lizard_id UUID,
  p_amount NUMERIC,
  p_add_to_total BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(success BOOLEAN, new_gold NUMERIC, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_gold NUMERIC;
  v_new_gold NUMERIC;
  v_new_total NUMERIC;
BEGIN
  -- Get current gold with row lock
  SELECT gold, total_gold_earned INTO v_current_gold, v_new_total
  FROM lizards
  WHERE id = p_lizard_id
  FOR UPDATE;

  -- Check if lizard exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 'Lizard not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate new gold (ensure non-negative)
  v_new_gold := FLOOR(GREATEST(v_current_gold + p_amount, 0));

  -- Update gold and potentially total
  IF p_add_to_total THEN
    v_new_total := FLOOR(v_new_total + p_amount);
    UPDATE lizards
    SET gold = v_new_gold,
        total_gold_earned = v_new_total,
        updated_at = NOW()
    WHERE id = p_lizard_id;
  ELSE
    UPDATE lizards
    SET gold = v_new_gold,
        updated_at = NOW()
    WHERE id = p_lizard_id;
  END IF;

  -- Return success
  RETURN QUERY SELECT TRUE, v_new_gold, ''::TEXT;
END;
$$;

-- 5. Fix any existing negative gold balances
UPDATE lizards
SET gold = 0
WHERE gold < 0;

-- 6. Add index on gold for faster queries
CREATE INDEX IF NOT EXISTS idx_lizards_gold ON lizards(gold);

-- 7. Add comment to document the constraint
COMMENT ON CONSTRAINT lizards_gold_check ON lizards IS
  'Ensures gold balance never goes negative. Use safe_deduct_gold() function for safe operations.';
