-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Atomic Invitation Redemption with Row-Level Locking
-- Prevents race condition where same invitation code could be used twice
-- =========================================================================

-- Drop the existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS redeem_invitation(uuid, text);

-- Create the atomic redemption function
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
    -- Start by locking the invitation row FOR UPDATE to prevent concurrent redemption
    -- This is the key to preventing the race condition
    SELECT id, office_id, role, expires_at
    INTO v_invitation_id, v_office_id, v_role, v_expires_at
    FROM invitations
    WHERE code = p_invite_code
    FOR UPDATE;

    -- Check if invitation was found
    IF v_invitation_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة غير صالح أو غير موجود'::text;
        RETURN;
    END IF;

    -- Check if invitation has expired
    IF v_expires_at < NOW() THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة منتهي الصلاحية'::text;
        RETURN;
    END IF;

    -- Check if user already has an active membership
    SELECT COUNT(*) INTO v_existing_member_count
    FROM office_members
    WHERE user_id = p_user_id
    AND is_active = true;

    IF v_existing_member_count > 0 THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'أنت منضم لمكتب بالفعل'::text;
        RETURN;
    END IF;

    -- Insert the user into office_members
    INSERT INTO office_members (office_id, user_id, role, is_active, created_at, updated_at)
    VALUES (v_office_id, p_user_id, v_role, true, NOW(), NOW());

    -- Delete the used invitation (one-time use)
    DELETE FROM invitations WHERE id = v_invitation_id;

    -- Log the action in audit_logs
    INSERT INTO audit_logs (office_id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (v_office_id, p_user_id, 'member_joined_via_invitation', 'office_members', p_user_id, 
            jsonb_build_object('invite_code', p_invite_code, 'role', v_role), NOW());

    -- Return success with office_id and role
    RETURN QUERY SELECT v_office_id, v_role, NULL::text;
END;
$$;

-- Grant execute permission to authenticated users (needed for RPC calls)
GRANT EXECUTE ON FUNCTION redeem_invitation(uuid, text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION redeem_invitation IS 'Atomically redeems an invitation code. Returns office_id, role, and error message. Uses FOR UPDATE locking to prevent concurrent redemption.';
