-- =========================================================================
-- MIZAN: Team Roles & Fine-Grained Permissions
-- Migration: 20260402000001
-- =========================================================================

-- 1. Update role check on office_members
ALTER TABLE office_members
  DROP CONSTRAINT IF EXISTS office_members_role_check;

ALTER TABLE office_members
  ADD CONSTRAINT office_members_role_check
  CHECK (role IN ('owner', 'admin', 'lawyer', 'secretary', 'trainee'));

-- 2. Update role check on invitations
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('admin', 'lawyer', 'secretary', 'trainee'));

-- 3. Add JSONB permissions column to office_members
--    Structure: {"can_delete_cases": true, "can_view_billing": false, ...}
ALTER TABLE office_members
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb NOT NULL;

-- 4. Drop existing has_role function and recreate with new roles
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM office_members
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;

  RETURN user_role = ANY(required_roles);
END;
$$;

-- 5. Create fine-grained permission check function
--    Logic:
--      - Owner always has all permissions.
--      - Admin has all permissions except billing (controlled by override).
--      - Others: check role defaults THEN override in JSONB.
CREATE OR REPLACE FUNCTION has_permission(p_perm text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  rec record;
  override_val boolean;
BEGIN
  SELECT role, permissions INTO rec
  FROM office_members
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;

  IF rec IS NULL THEN
    RETURN false;
  END IF;

  -- Owner always has every permission
  IF rec.role = 'owner' THEN
    RETURN true;
  END IF;

  -- Check if there's an explicit override in JSONB
  IF rec.permissions ? p_perm THEN
    RETURN (rec.permissions ->> p_perm)::boolean;
  END IF;

  -- Default permission matrix by role
  CASE p_perm
    WHEN 'can_delete_cases' THEN
      RETURN rec.role IN ('admin', 'lawyer');
    WHEN 'can_delete_sessions' THEN
      RETURN rec.role IN ('admin', 'lawyer');
    WHEN 'can_delete_tasks' THEN
      RETURN rec.role IN ('admin', 'lawyer');
    WHEN 'can_delete_clients' THEN
      RETURN rec.role IN ('admin');
    WHEN 'can_manage_team' THEN
      RETURN rec.role IN ('admin');
    WHEN 'can_view_billing' THEN
      RETURN false; -- Only owner; no role default
    WHEN 'can_manage_invitations' THEN
      RETURN rec.role IN ('admin');
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 6. Update RLS policies to use has_permission() where applicable

-- Cases: delete
DROP POLICY IF EXISTS "Owners can delete cases" ON cases;
CREATE POLICY "Privileged users can delete cases" ON cases
  FOR DELETE USING (
    office_id = current_office_id()
    AND (has_permission('can_delete_cases') OR is_platform_admin())
  );

-- Sessions: delete
DROP POLICY IF EXISTS "Owners/Lawyers can delete sessions" ON sessions;
CREATE POLICY "Privileged users can delete sessions" ON sessions
  FOR DELETE USING (
    office_id = current_office_id()
    AND (has_permission('can_delete_sessions') OR is_platform_admin())
  );

-- Tasks: delete
DROP POLICY IF EXISTS "Owners can delete tasks" ON tasks;
CREATE POLICY "Privileged users can delete tasks" ON tasks
  FOR DELETE USING (
    office_id = current_office_id()
    AND (has_permission('can_delete_tasks') OR is_platform_admin())
  );

-- Clients: delete
DROP POLICY IF EXISTS "Owners can delete clients" ON clients;
CREATE POLICY "Privileged users can delete clients" ON clients
  FOR DELETE USING (
    office_id = current_office_id()
    AND (has_permission('can_delete_clients') OR is_platform_admin())
  );

-- Invitations: manage
DROP POLICY IF EXISTS "Owners can manage invitations" ON invitations;
CREATE POLICY "Privileged users can manage invitations" ON invitations
  FOR ALL USING (
    (office_id = current_office_id() AND has_permission('can_manage_invitations'))
    OR is_platform_admin()
  );

-- Office Members: manage
DROP POLICY IF EXISTS "Owners can manage members" ON office_members;
CREATE POLICY "Privileged users can manage members" ON office_members
  FOR ALL USING (
    (office_id = current_office_id() AND has_permission('can_manage_team'))
    OR is_platform_admin()
  );

-- 7. Add index for faster JSONB lookups
CREATE INDEX IF NOT EXISTS idx_office_members_permissions ON office_members USING gin(permissions);

COMMENT ON COLUMN office_members.permissions IS
  'Fine-grained permission overrides per member. Keys: can_delete_cases, can_delete_sessions, can_delete_tasks, can_delete_clients, can_manage_team, can_view_billing, can_manage_invitations';
