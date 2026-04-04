-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Full Roles & Invitations Revamp (FIXED FOR AMBIGUITY)
-- Fixes: Join Failure due to Check Constraints + Column Ambiguity in RPC
-- =========================================================================

-- 1. Drop old ROLE check constraints in office_members
ALTER TABLE office_members DROP CONSTRAINT IF EXISTS office_members_role_check;

-- 2. Add new ROLE check constraint for office_members
ALTER TABLE office_members ADD CONSTRAINT office_members_role_check 
CHECK (role IN ('owner', 'admin', 'lawyer', 'secretary', 'trainee'));

-- 3. Drop old ROLE check constraints in invitations
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_role_check;

-- 4. Add new ROLE check constraint for invitations
ALTER TABLE invitations ADD CONSTRAINT invitations_role_check 
CHECK (role IN ('owner', 'admin', 'lawyer', 'secretary', 'trainee'));

-- 5. Recreate the atomic redemption function with UNIQUE output names to avoid ambiguity
DROP FUNCTION IF EXISTS redeem_invitation(uuid, text);

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
    -- 1. Find the invitation (Case-Insensitive)
    SELECT id, office_id, role, expires_at
    INTO v_invitation_id, v_office_id, v_role, v_expires_at
    FROM invitations
    WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_invite_code))
    FOR UPDATE;

    -- 2. Validate Existence
    IF v_invitation_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة غير صالح أو غير موجود'::text;
        RETURN;
    END IF;

    -- 3. Validate Expiration
    IF v_expires_at < NOW() THEN
        DELETE FROM invitations WHERE id = v_invitation_id;
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة منتهي الصلاحية'::text;
        RETURN;
    END IF;

    -- 4. Check for existing membership
    SELECT COUNT(*) INTO v_existing_member_count
    FROM office_members
    WHERE user_id = p_user_id AND is_active = true;

    IF v_existing_member_count > 0 THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'أنت منضم لمكتب بالفعل'::text;
        RETURN;
    END IF;

    -- 5. Atomic Join
    BEGIN
        INSERT INTO office_members (office_id, user_id, role, is_active, permissions, created_at, updated_at)
        VALUES (v_office_id, p_user_id, v_role, true, '{}'::jsonb, NOW(), NOW());
    EXCEPTION 
        WHEN OTHERS THEN
            RETURN QUERY SELECT NULL::uuid, NULL::text, ('فشل تقني أثناء الانضمام: ' || SQLERRM)::text;
            RETURN;
    END;

    -- 6. Cleanup & Audit
    DELETE FROM invitations WHERE id = v_invitation_id;

    INSERT INTO audit_logs (office_id, user_id, action, entity_type, entity_id, details)
    VALUES (v_office_id, p_user_id, 'member_joined_via_invitation', 'office_members', p_user_id, 
            jsonb_build_object('invite_code', p_invite_code, 'role', v_role));

    -- Success (Mapping to res_ prefixed output columns)
    RETURN QUERY SELECT v_office_id, v_role, NULL::text;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION redeem_invitation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_invitation(uuid, text) TO service_role;

COMMENT ON FUNCTION redeem_invitation IS 'Atomic redemption of invitation codes with case-insensitivity and unique output column names.';
