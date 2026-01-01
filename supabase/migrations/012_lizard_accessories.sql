-- Add more lizard customization options
-- Migration for v1.7.0

-- Add accessory fields to lizards table
ALTER TABLE lizards
  ADD COLUMN IF NOT EXISTS crown TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS hat TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS accessory TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS background_effect TEXT DEFAULT 'none';

-- Available options:
-- crown: 'none', 'gold', 'silver', 'jeweled', 'spike', 'flower'
-- hat: 'none', 'top', 'wizard', 'party', 'baseball', 'cowboy', 'santa'
-- accessory: 'none', 'glasses', 'monocle', 'sunglasses', 'bowtie', 'necklace'
-- background_effect: 'none', 'sparkles', 'flames', 'hearts', 'stars', 'bubbles'
-- pattern: 'solid', 'stripes', 'spots', 'gradient', 'camo'
-- eye_style: 'normal', 'happy', 'angry', 'sleepy', 'heart', 'star'
