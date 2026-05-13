-- Only run if opposing_party column doesn't exist
ALTER TABLE cases ADD COLUMN IF NOT EXISTS opposing_party text;
