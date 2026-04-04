CREATE TABLE IF NOT EXISTS office_member_overage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    current_count integer NOT NULL,
    max_users integer NOT NULL,
    grace_deadline timestamptz NOT NULL,
    resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS & Triggers
ALTER TABLE office_member_overage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own office overage" 
  ON office_member_overage FOR SELECT 
  USING (office_id = current_office_id() OR is_platform_admin());

-- Ensure the trigger exists natively.
CREATE OR REPLACE TRIGGER update_office_member_overage_updated_at
  BEFORE UPDATE ON office_member_overage
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
