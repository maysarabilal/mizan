-- New columns for offices table
ALTER TABLE offices ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS specialization text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS working_days jsonb DEFAULT '["sunday","monday","tuesday","wednesday","thursday"]';
ALTER TABLE offices ADD COLUMN IF NOT EXISTS working_hours_start text DEFAULT '08:00';
ALTER TABLE offices ADD COLUMN IF NOT EXISTS working_hours_end text DEFAULT '16:00';

-- New columns for profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
