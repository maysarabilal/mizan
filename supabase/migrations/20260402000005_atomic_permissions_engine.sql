-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Atomic Permissions Engine (Zero-Trust)
-- Migration: 20260402000005
-- =========================================================================

-- Recreate fine-grained permission check function with 20+ atomic keys
-- Logic: 
--   1. Owner always returns true.
--   2. Others: Only returns true if an EXPLICIT 'true' exists in JSONB.
--   3. Default is false (Zero-Trust).
CREATE OR REPLACE FUNCTION has_permission(p_perm text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
    v_role text;
    v_permissions jsonb;
BEGIN
    SELECT role, permissions INTO v_role, v_permissions
    FROM office_members
    WHERE user_id = auth.uid()
      AND is_active = true
    LIMIT 1;

    -- 1. No membership = No permission
    IF v_role IS NULL THEN
        RETURN false;
    END IF;

    -- 2. Owner always has absolute power
    IF v_role = 'owner' THEN
        RETURN true;
    END IF;

    -- 3. Zero-Trust Check: Only explicitly granted permissions in JSONB are allowed
    -- If the key exists AND is true, grant access. Otherwise, denied.
    IF v_permissions ? p_perm THEN
        RETURN (v_permissions ->> p_perm)::boolean;
    END IF;

    -- 4. Fallback: All non-owners start with zero permissions
    RETURN false;
END;
$$;

-- Update RLS policies to use the new atomic keys

-- 1. Cases: View
DROP POLICY IF EXISTS "Members can view own cases" ON cases;
CREATE POLICY "Permissions-based view cases" ON cases
    FOR SELECT USING (
        office_id = current_office_id() 
        AND (has_permission('view_cases') OR is_platform_admin())
    );

-- 2. Cases: Insert
DROP POLICY IF EXISTS "Members can insert cases" ON cases;
CREATE POLICY "Permissions-based insert cases" ON cases
    FOR INSERT WITH CHECK (
        office_id = current_office_id() 
        AND (has_permission('add_cases') OR is_platform_admin())
    );

-- 3. Cases: Update
DROP POLICY IF EXISTS "Members can update cases" ON cases;
CREATE POLICY "Permissions-based update cases" ON cases
    FOR UPDATE USING (
        office_id = current_office_id() 
        AND (has_permission('edit_cases') OR is_platform_admin())
    );

-- 4. Clients: CRUD (Similar patterns)
DROP POLICY IF EXISTS "Members can view own clients" ON clients;
CREATE POLICY "Permissions-based view clients" ON clients FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_clients') OR is_platform_admin()));

DROP POLICY IF EXISTS "Members can insert clients" ON clients;
CREATE POLICY "Permissions-based insert clients" ON clients FOR INSERT WITH CHECK (office_id = current_office_id() AND (has_permission('add_clients') OR is_platform_admin()));

DROP POLICY IF EXISTS "Members can update clients" ON clients;
CREATE POLICY "Permissions-based update clients" ON clients FOR UPDATE USING (office_id = current_office_id() AND (has_permission('edit_clients') OR is_platform_admin()));

DROP POLICY IF EXISTS "Privileged users can delete clients" ON clients;
CREATE POLICY "Permissions-based delete clients" ON clients FOR DELETE USING (office_id = current_office_id() AND (has_permission('delete_clients') OR is_platform_admin()));

-- 5. Team: View
DROP POLICY IF EXISTS "Members can view own office members" ON office_members;
CREATE POLICY "Permissions-based view team" ON office_members FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_team') OR is_platform_admin()));

-- 6. Audit Logs: Sovereign Access
DROP POLICY IF EXISTS "Owners can view audit logs" ON audit_logs;
CREATE POLICY "Sovereign view audit logs" ON audit_logs FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_audit_logs') OR is_platform_admin()));
