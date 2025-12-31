-- Fix feeding logic to not affect total_gold_earned
-- total_gold_earned should only track base income, not the fed multiplier

-- Modified function to calculate both base and total gold
CREATE OR REPLACE FUNCTION calculate_offline_gold_with_base(lizard_id UUID)
RETURNS TABLE(base_gold BIGINT, total_gold BIGINT) AS $$
DECLARE
  lizard_record RECORD;
  time_diff_seconds BIGINT;
  base_income DECIMAL;
  actual_income DECIMAL;
  base_earned BIGINT;
  total_earned BIGINT;
BEGIN
  SELECT * INTO lizard_record FROM lizards WHERE id = lizard_id;

  -- Calculate time difference in seconds
  time_diff_seconds := EXTRACT(EPOCH FROM (NOW() - lizard_record.last_gold_update));

  -- Base income (without multiplier)
  base_income := lizard_record.passive_income;

  -- Actual income (with multiplier if fed)
  actual_income := base_income;
  IF lizard_record.is_fed AND lizard_record.fed_at IS NOT NULL THEN
    IF (NOW() - lizard_record.fed_at) < INTERVAL '12 hours' THEN
      actual_income := actual_income * 2;
    END IF;
  END IF;

  -- Calculate gold earned
  base_earned := FLOOR(base_income * time_diff_seconds);
  total_earned := FLOOR(actual_income * time_diff_seconds);

  -- Cap at reasonable amount (30 days worth)
  IF base_earned > (base_income * 60 * 60 * 24 * 30) THEN
    base_earned := FLOOR(base_income * 60 * 60 * 24 * 30);
  END IF;

  IF total_earned > (actual_income * 60 * 60 * 24 * 30) THEN
    total_earned := FLOOR(actual_income * 60 * 60 * 24 * 30);
  END IF;

  RETURN QUERY SELECT base_earned, total_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update sync function to use base gold for total_gold_earned
CREATE OR REPLACE FUNCTION sync_offline_gold(lizard_id UUID)
RETURNS TABLE(gold_earned BIGINT, new_total BIGINT) AS $$
DECLARE
  base_earned BIGINT;
  total_earned BIGINT;
BEGIN
  -- Calculate offline gold (both base and actual)
  SELECT * INTO base_earned, total_earned FROM calculate_offline_gold_with_base(lizard_id);

  -- Update the lizard
  -- Add total_earned to gold (includes feed multiplier)
  -- Add base_earned to total_gold_earned (excludes feed multiplier)
  UPDATE lizards
  SET
    gold = gold + total_earned,
    total_gold_earned = total_gold_earned + base_earned,
    last_gold_update = NOW(),
    -- Check if feed buff expired
    is_fed = CASE
      WHEN is_fed AND fed_at IS NOT NULL AND (NOW() - fed_at) >= INTERVAL '12 hours'
      THEN false
      ELSE is_fed
    END
  WHERE id = lizard_id;

  -- Return results
  RETURN QUERY SELECT total_earned, (SELECT total_gold_earned FROM lizards WHERE id = lizard_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
