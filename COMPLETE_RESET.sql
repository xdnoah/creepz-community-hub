-- COMPLETE RESET AND SETUP
-- This will delete everything and start fresh
-- Copy ALL of this and run it in Supabase SQL Editor

-- 1. Drop everything first (clean slate)
DROP TABLE IF EXISTS username_history CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS check_username_available(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  age INTEGER CHECK (age >= 1 AND age <= 150),
  location TEXT CHECK (char_length(location) <= 50),
  bio TEXT CHECK (char_length(bio) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create username_history table
CREATE TABLE username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_username TEXT NOT NULL,
  new_username TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_username_history_user ON username_history(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- 6. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE username_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 8. RLS Policies for messages
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;

CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies for username_history
DROP POLICY IF EXISTS "Anyone can read username history" ON username_history;
DROP POLICY IF EXISTS "Users can insert own history" ON username_history;

CREATE POLICY "Anyone can read username history"
  ON username_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own history"
  ON username_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. Create check_username_available function
CREATE OR REPLACE FUNCTION check_username_available(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = username_to_check
  );
END;
$$;

-- 11. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 12. Verify setup
DO $$
BEGIN
  RAISE NOTICE 'Setup complete!';
  RAISE NOTICE 'Tables created: profiles, messages, username_history';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Realtime enabled for messages';
  RAISE NOTICE 'Ready to use!';
END $$;

-- Show tables that were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'messages', 'username_history')
ORDER BY table_name;
