-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Atomic RLS Fortress (Total Lockdown)
-- Migration: 20260402000008
-- =========================================================================

-- 1. WIPEOUT: Remove all legacy and conflicting policies
-- Cases
DROP POLICY IF EXISTS "Members can view own cases" ON cases;
DROP POLICY IF EXISTS "Members can insert cases" ON cases;
DROP POLICY IF EXISTS "Members can update cases" ON cases;
DROP POLICY IF EXISTS "Owners can delete cases" ON cases;
DROP POLICY IF EXISTS "Permissions-based view cases" ON cases;
DROP POLICY IF EXISTS "Permissions-based insert cases" ON cases;
DROP POLICY IF EXISTS "Permissions-based update cases" ON cases;

-- Clients
DROP POLICY IF EXISTS "Members can view own clients" ON clients;
DROP POLICY IF EXISTS "Members can insert clients" ON clients;
DROP POLICY IF EXISTS "Members can update clients" ON clients;
DROP POLICY IF EXISTS "Owners can delete clients" ON clients;
DROP POLICY IF EXISTS "Permissions-based view clients" ON clients;
DROP POLICY IF EXISTS "Permissions-based insert clients" ON clients;
DROP POLICY IF EXISTS "Permissions-based update clients" ON clients;
DROP POLICY IF EXISTS "Permissions-based delete clients" ON clients;
DROP POLICY IF EXISTS "Privileged users can delete clients" ON clients;

-- Sessions
DROP POLICY IF EXISTS "Members can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Members can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Members can update sessions" ON sessions;
DROP POLICY IF EXISTS "Owners/Lawyers can delete sessions" ON sessions;

-- Tasks
DROP POLICY IF EXISTS "Members can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Members can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Owners can delete tasks" ON tasks;

-- Team (office_members)
DROP POLICY IF EXISTS "Members can view own office members" ON office_members;
DROP POLICY IF EXISTS "Owners can manage members" ON office_members;
DROP POLICY IF EXISTS "Permissions-based view team" ON office_members;

-- Audit Logs
DROP POLICY IF EXISTS "Owners can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Sovereign view audit logs" ON audit_logs;

-- 2. FORTIFY: Apply Atomic, Permission-Keyed Policies

-- Cases
CREATE POLICY "RLS_VIEW_CASES" ON cases FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_cases') OR is_platform_admin()));
CREATE POLICY "RLS_ADD_CASES" ON cases FOR INSERT WITH CHECK (office_id = current_office_id() AND (has_permission('add_cases') OR is_platform_admin()));
CREATE POLICY "RLS_EDIT_CASES" ON cases FOR UPDATE USING (office_id = current_office_id() AND (has_permission('edit_cases') OR is_platform_admin()));
CREATE POLICY "RLS_DELETE_CASES" ON cases FOR DELETE USING (office_id = current_office_id() AND (has_permission('delete_cases') OR is_platform_admin()));

-- Clients
CREATE POLICY "RLS_VIEW_CLIENTS" ON clients FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_clients') OR is_platform_admin()));
CREATE POLICY "RLS_ADD_CLIENTS" ON clients FOR INSERT WITH CHECK (office_id = current_office_id() AND (has_permission('add_clients') OR is_platform_admin()));
CREATE POLICY "RLS_EDIT_CLIENTS" ON clients FOR UPDATE USING (office_id = current_office_id() AND (has_permission('edit_clients') OR is_platform_admin()));
CREATE POLICY "RLS_DELETE_CLIENTS" ON clients FOR DELETE USING (office_id = current_office_id() AND (has_permission('delete_clients') OR is_platform_admin()));

-- Sessions
CREATE POLICY "RLS_VIEW_SESSIONS" ON sessions FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_sessions') OR is_platform_admin()));
CREATE POLICY "RLS_ADD_SESSIONS" ON sessions FOR INSERT WITH CHECK (office_id = current_office_id() AND (has_permission('add_sessions') OR is_platform_admin()));
CREATE POLICY "RLS_EDIT_SESSIONS" ON sessions FOR UPDATE USING (office_id = current_office_id() AND (has_permission('edit_sessions') OR is_platform_admin()));
CREATE POLICY "RLS_DELETE_SESSIONS" ON sessions FOR DELETE USING (office_id = current_office_id() AND (has_permission('delete_sessions') OR is_platform_admin()));

-- Tasks
CREATE POLICY "RLS_VIEW_TASKS" ON tasks FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_tasks') OR is_platform_admin()));
CREATE POLICY "RLS_ADD_TASKS" ON tasks FOR INSERT WITH CHECK (office_id = current_office_id() AND (has_permission('add_tasks') OR is_platform_admin()));
CREATE POLICY "RLS_EDIT_TASKS" ON tasks FOR UPDATE USING (office_id = current_office_id() AND (has_permission('edit_tasks') OR is_platform_admin()));
CREATE POLICY "RLS_DELETE_TASKS" ON tasks FOR DELETE USING (office_id = current_office_id() AND (has_permission('delete_tasks') OR is_platform_admin()));

-- Team (office_members)
CREATE POLICY "RLS_VIEW_TEAM" ON office_members FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_team') OR is_platform_admin() OR user_id = auth.uid()));
CREATE POLICY "RLS_MANAGE_TEAM" ON office_members FOR ALL USING (office_id = current_office_id() AND (has_permission('manage_team') OR is_platform_admin()));

-- Audit Logs
CREATE POLICY "RLS_VIEW_LOGS" ON audit_logs FOR SELECT USING (office_id = current_office_id() AND (has_permission('view_audit_logs') OR is_platform_admin()));

-- 3. VALIDATE: Ensure owners are never locked out (Handled already by has_permission function)
COMMENT ON FUNCTION has_permission IS 'Master RBAC logic. Owner bypasses all checks. Members must have explicit JSONB flag.';
