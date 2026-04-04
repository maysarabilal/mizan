-- Add is_active column if it does not exist
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Deactivate ALL current plans
UPDATE subscription_plans SET is_active = false;

-- Insert the 6 new real plans + 1 Enterprise row
INSERT INTO subscription_plans (slug, name, billing_cycle, price_ils, max_users, features, is_active)
VALUES
  ('individual', 'فردي', 'monthly', 149, 1, '{"team_management": false}'::jsonb, true),
  ('office', 'مكتب', 'monthly', 349, 5, '{"team_management": true}'::jsonb, true),
  ('institution', 'مؤسسة', 'monthly', 699, 15, '{"team_management": true}'::jsonb, true),
  ('individual_yearly', 'فردي سنوي', 'yearly', 1490, 1, '{"team_management": false}'::jsonb, true),
  ('office_yearly', 'مكتب سنوي', 'yearly', 3490, 5, '{"team_management": true}'::jsonb, true),
  ('institution_yearly', 'مؤسسة سنوية', 'yearly', 6990, 15, '{"team_management": true}'::jsonb, true),
  ('enterprise', 'مؤسسي', NULL, NULL, NULL, '{"team_management": true}'::jsonb, true);
