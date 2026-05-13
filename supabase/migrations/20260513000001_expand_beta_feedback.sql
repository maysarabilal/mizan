-- Add strategic columns to beta_feedback
ALTER TABLE public.beta_feedback
  ADD COLUMN IF NOT EXISTS office_size TEXT,
  ADD COLUMN IF NOT EXISTS current_tool TEXT,
  ADD COLUMN IF NOT EXISTS most_needed_feature TEXT,
  ADD COLUMN IF NOT EXISTS missing_feature TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
