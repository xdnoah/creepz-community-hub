-- Fight History Migration
-- Tracks lizard battle results

CREATE TABLE IF NOT EXISTS fight_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attacker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attacker_name TEXT NOT NULL,
  defender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  defender_name TEXT NOT NULL,
  winner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  winner_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fight_history_attacker ON fight_history(attacker_id, created_at DESC);
CREATE INDEX idx_fight_history_defender ON fight_history(defender_id, created_at DESC);
CREATE INDEX idx_fight_history_created ON fight_history(created_at DESC);

-- RLS Policies
ALTER TABLE fight_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own fight history (as attacker or defender)
CREATE POLICY fight_history_select_own ON fight_history FOR SELECT
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Anyone can insert fight history (fights are public)
CREATE POLICY fight_history_insert_all ON fight_history FOR INSERT
  WITH CHECK (true);
