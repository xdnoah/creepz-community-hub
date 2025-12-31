-- Rich Profile Fields Migration

-- Add new profile fields for a richer user experience
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS favorite_singer TEXT,
ADD COLUMN IF NOT EXISTS favorite_show TEXT,
ADD COLUMN IF NOT EXISTS favorite_movie TEXT,
ADD COLUMN IF NOT EXISTS favorite_food TEXT,
ADD COLUMN IF NOT EXISTS favorite_country TEXT,
ADD COLUMN IF NOT EXISTS favorite_animal TEXT;

-- Add comment explaining the new fields
COMMENT ON COLUMN profiles.favorite_singer IS 'User''s favorite singer or band';
COMMENT ON COLUMN profiles.favorite_show IS 'User''s favorite TV show';
COMMENT ON COLUMN profiles.favorite_movie IS 'User''s favorite movie';
COMMENT ON COLUMN profiles.favorite_food IS 'User''s favorite food';
COMMENT ON COLUMN profiles.favorite_country IS 'Best country user has visited';
COMMENT ON COLUMN profiles.favorite_animal IS 'User''s favorite animal';
