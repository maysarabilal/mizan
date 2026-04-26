-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Create Atomic Onboarding RPC (create_office_transaction)
-- =========================================================================

CREATE OR REPLACE FUNCTION create_office_transaction(
  p_user_id UUID,
  p_office_name TEXT,
  p_plan_id UUID,
  p_trial_end TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_office_id UUID;
  v_existing_member_count BIGINT;
BEGIN
  -- 1. Check if user already has an active membership
  SELECT COUNT(*) INTO v_existing_member_count
  FROM office_members
  WHERE user_id = p_user_id
    AND is_active = true;

  IF v_existing_member_count > 0 THEN
    RAISE EXCEPTION 'ACCOUNT_EXISTS';
  END IF;

  -- 2. Insert office
  INSERT INTO offices (name, is_active)
  VALUES (p_office_name, true)
  RETURNING id INTO v_office_id;

  -- 3. Insert owner role into office_members
  INSERT INTO office_members (office_id, user_id, role, is_active, permissions)
  VALUES (v_office_id, p_user_id, 'owner', true, '{}'::jsonb);

  -- 4. Insert trial subscription (linked to office)
  INSERT INTO office_subscriptions (office_id, plan_id, status, current_period_end)
  VALUES (v_office_id, p_plan_id, 'trialing', p_trial_end);

  -- 5. Insert audit log
  INSERT INTO audit_logs (office_id, user_id, action, entity_type, entity_id)
  VALUES (v_office_id, p_user_id, 'office_created', 'office', v_office_id);

  -- If any step fails, Postgres will automatically rollback the entire transaction.
  RETURN json_build_object('office_id', v_office_id);

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- Re-raise the error to Next.js instead of swallowing it
END;
$$;

-- Grant execution to authenticated users (even though it's SECURITY DEFINER, we allow calling it)
GRANT EXECUTE ON FUNCTION create_office_transaction(UUID, TEXT, UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION create_office_transaction(UUID, TEXT, UUID, TIMESTAMPTZ) TO service_role;
