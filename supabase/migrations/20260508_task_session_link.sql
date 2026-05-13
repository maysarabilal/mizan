-- Add session_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES sessions(id) ON DELETE SET NULL;
