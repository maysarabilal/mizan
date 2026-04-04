-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Fix Onboarding RLS & Sync Audit Logs
-- Migration: 20260402000007
-- =========================================================================

-- 1. CRITICAL: Allow users to view their own profile even without 'view_team'
-- This is required for the Dashboard layout and Sidebar to function for new members.
DROP POLICY IF EXISTS "Members can view own record" ON office_members;
CREATE POLICY "Members can view own record" ON office_members 
    FOR SELECT USING (user_id = auth.uid());

-- 2. SYNC: Clean up redeem_invitation to avoid double audit logs
-- The 'trigger_audit_log' on office_members already captures 'INSERT' actions.
DROP FUNCTION IF EXISTS redeem_invitation(uuid, text);

CREATE OR REPLACE FUNCTION redeem_invitation(
    p_user_id uuid,
    p_invite_code text
)
RETURNS TABLE (
    office_id uuid,
    role text,
    error text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_invitation_id uuid;
    v_office_id uuid;
    v_role text;
    v_expires_at timestamptz;
    v_existing_member_count bigint;
BEGIN
    -- Lock the invitation row
    SELECT id, office_id, role, expires_at
    INTO v_invitation_id, v_office_id, v_role, v_expires_at
    FROM invitations
    WHERE code = UPPER(TRIM(p_invite_code))
    FOR UPDATE;

    IF v_invitation_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة غير صالح أو غير موجود'::text;
        RETURN;
    END IF;

    IF v_expires_at < NOW() THEN
        DELETE FROM invitations WHERE id = v_invitation_id;
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة منتهي الصلاحية'::text;
        RETURN;
    END IF;

    -- Check existing membership
    SELECT COUNT(*) INTO v_existing_member_count
    FROM office_members
    WHERE user_id = p_user_id AND is_active = true;

    IF v_existing_member_count > 0 THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'أنت منضم لمكتب بالفعل'::text;
        RETURN;
    END IF;

    -- Insert into office_members (This triggers 'trigger_audit_log' automatically)
    INSERT INTO office_members (office_id, user_id, role, is_active, permissions, created_at, updated_at)
    VALUES (v_office_id, p_user_id, v_role, true, '{}'::jsonb, NOW(), NOW());

    -- Delete the used invitation
    DELETE FROM invitations WHERE id = v_invitation_id;

    -- REMOVED: Manual insert into audit_logs (Handled by Trigger)

    RETURN QUERY SELECT v_office_id, v_role, NULL::text;
END;
$$;

COMMENT ON POLICY "Members can view own record" ON office_members IS 'Allows users to see their own membership record essential for system initialization.';
