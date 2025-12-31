-- User Settings System Setup
-- Run this in Supabase SQL Editor

-- 1. Add settings columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#008080',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS chat_name_color TEXT DEFAULT '#00FF00',
ADD COLUMN IF NOT EXISTS enable_sounds BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS timestamp_format TEXT DEFAULT '12h',
ADD COLUMN IF NOT EXISTS theme_preset TEXT DEFAULT 'classic';

-- 2. Add constraints to ensure valid values
ALTER TABLE profiles
ADD CONSTRAINT valid_font_size CHECK (font_size IN ('small', 'medium', 'large', 'xlarge'));

ALTER TABLE profiles
ADD CONSTRAINT valid_timestamp_format CHECK (timestamp_format IN ('12h', '24h'));

ALTER TABLE profiles
ADD CONSTRAINT valid_theme_preset CHECK (theme_preset IN ('classic', 'dark', 'pastel', 'high-contrast'));

-- Verify setup
SELECT 'User settings system setup complete!' as status;
