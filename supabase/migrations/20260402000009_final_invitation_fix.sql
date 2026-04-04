-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Final Invitation Fix (Unambiguous Column Names)
-- Migration: 20260402000009
-- =========================================================================

-- 1. DROP the existing function first to ensure we can change the return type signature
DROP FUNCTION IF EXISTS redeem_invitation(uuid, text);

-- 2. CREATE the function with prefixed result columns (res_*) 
-- naming them 'res_' prefixes avoids conflicts with table columns like 'office_id'
CREATE OR REPLACE FUNCTION redeem_invitation(
    p_user_id uuid,
    p_invite_code text
)
RETURNS TABLE (
    res_office_id uuid,
    res_role text,
    res_error text
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
    -- 1. Lock the invitation row for update
    SELECT id, office_id, role, expires_at
    INTO v_invitation_id, v_office_id, v_role, v_expires_at
    FROM invitations
    WHERE code = UPPER(TRIM(p_invite_code))
    FOR UPDATE;

    -- Check if invitation exists
    IF v_invitation_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة غير صالح أو غير موجود'::text;
        RETURN;
    END IF;

    -- Check expiry
    IF v_expires_at < NOW() THEN
        DELETE FROM invitations WHERE id = v_invitation_id;
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة منتهي الصلاحية'::text;
        RETURN;
    END IF;

    -- Check for existing active membership
    SELECT COUNT(*) INTO v_existing_member_count
    FROM office_members
    WHERE user_id = p_user_id AND is_active = true;

    IF v_existing_member_count > 0 THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'أنت منضم لمكتب بالفعل'::text;
        RETURN;
    END IF;

    -- 2. Insert into office_members (Atomic operation)
    -- This insert is now safe from ambiguity because output cols are renamed to res_*
    INSERT INTO office_members (office_id, user_id, role, is_active, permissions, created_at, updated_at)
    VALUES (v_office_id, p_user_id, v_role, true, '{}'::jsonb, NOW(), NOW());

    -- 3. Cleanup: Delete the used invitation
    DELETE FROM invitations WHERE id = v_invitation_id;

    -- 4. Return Success using unambiguous aliases
    RETURN QUERY SELECT v_office_id, v_role, NULL::text;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION redeem_invitation(uuid, text) TO authenticated;

COMMENT ON FUNCTION redeem_invitation IS 
'Unambiguously redeem an invitation code. Return columns are res_ prefixed to avoid naming collisions with table columns.';
