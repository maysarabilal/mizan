-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Subscription Overhaul: 8 Plans, Capacity Checks, and Financials
-- Migration: 20260402000010
-- =========================================================================

-- 1. Add billing_cycle column to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- 1. Add columns if not exists
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- 2. Update existing entries to match new tiered structure and add missing slugs
-- Individual (was 1 user)
UPDATE subscription_plans SET slug = 'individual_monthly', max_users = 1, billing_cycle = 'monthly', price_ils = 59 WHERE slug IS NULL AND name = 'فردي';
-- Office (was 5 users)
UPDATE subscription_plans SET slug = 'office_monthly', max_users = 5, billing_cycle = 'monthly', price_ils = 249 WHERE slug IS NULL AND name = 'مكتب';
-- Enterprise (was 9999 users, now set to 15 as requested)
UPDATE subscription_plans SET slug = 'enterprise_monthly', max_users = 15, billing_cycle = 'monthly', price_ils = 499 WHERE slug IS NULL AND (name = 'مؤسسي' OR name = 'مؤسسة');

-- 3. Insert new tiers and yearly versions (Prevent duplicates with ON CONFLICT)
INSERT INTO subscription_plans (name, slug, price_ils, max_users, billing_cycle, features) VALUES
('فردي (سنوي)', 'individual_yearly', 590, 1, 'yearly', '{"team_management": false}'::jsonb),
('مكتب (سنوي)', 'office_yearly', 2490, 5, 'yearly', '{"team_management": true, "max_members": 5}'::jsonb),
('مؤسسة (شهري)', 'enterprise_monthly', 499, 15, 'monthly', '{"team_management": true, "max_members": 15}'::jsonb),
('مؤسسة (سنوي)', 'enterprise_yearly', 4990, 15, 'yearly', '{"team_management": true, "max_members": 15}'::jsonb),
('مركز قانوني (شهري)', 'grand_monthly', 799, 25, 'monthly', '{"team_management": true, "max_members": 25}'::jsonb),
('مركز قانوني (سنوي)', 'grand_yearly', 7990, 25, 'yearly', '{"team_management": true, "max_members": 25}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET 
  price_ils = EXCLUDED.price_ils,
  max_users = EXCLUDED.max_users,
  features = EXCLUDED.features;

-- Ensure slugs are set for any leftovers
UPDATE subscription_plans SET slug = 'individual_monthly' WHERE slug IS NULL AND name = 'فردي';
UPDATE subscription_plans SET slug = 'office_monthly' WHERE slug IS NULL AND name = 'مكتب';
UPDATE subscription_plans SET slug = 'enterprise_monthly' WHERE slug IS NULL AND (name = 'مؤسسي' OR name = 'مؤسسة');

-- 3. Refactor redeem_invitation RPC with strict capacity check
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
    v_max_users int;
    v_current_total_members bigint;
BEGIN
    -- 1. Lock invitation row
    SELECT id, office_id, role, expires_at
    INTO v_invitation_id, v_office_id, v_role, v_expires_at
    FROM invitations
    WHERE code = p_invite_code
    FOR UPDATE;

    -- Checks
    IF v_invitation_id IS NULL THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة غير صالح أو غير موجود'::text;
        RETURN;
    END IF;

    IF v_expires_at < NOW() THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'رمز الدعوة منتهي الصلاحية'::text;
        RETURN;
    END IF;

    -- Check if user is already a member anywhere
    SELECT COUNT(*) INTO v_existing_member_count
    FROM office_members
    WHERE user_id = p_user_id AND is_active = true;

    IF v_existing_member_count > 0 THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'أنت منضم لمكتب بالفعل'::text;
        RETURN;
    END IF;

    -- CHECK CAPACITY
    -- Get Max Users from office's active plan
    SELECT sp.max_users INTO v_max_users
    FROM office_subscriptions os
    JOIN subscription_plans sp ON os.plan_id = sp.id
    WHERE os.office_id = v_office_id
    LIMIT 1;

    -- Get Current Active Members count
    SELECT COUNT(*) INTO v_current_total_members
    FROM office_members
    WHERE office_id = v_office_id AND is_active = true;

    IF v_current_total_members >= v_max_users THEN
        RETURN QUERY SELECT NULL::uuid, NULL::text, 'نعتذر، وصل هذا المكتب للحد الأقصى للمشتركين المسموح به في الخطة الحالية'::text;
        RETURN;
    END IF;

    -- 2. Success path
    INSERT INTO office_members (office_id, user_id, role, is_active, created_at, updated_at)
    VALUES (v_office_id, p_user_id, v_role, true, NOW(), NOW());

    DELETE FROM invitations WHERE id = v_invitation_id;

    INSERT INTO audit_logs (office_id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (v_office_id, p_user_id, 'member_joined_via_invitation', 'office_members', p_user_id, 
            jsonb_build_object('invite_code', p_invite_code, 'role', v_role, 'plan_limit', v_max_users), NOW());

    RETURN QUERY SELECT v_office_id, v_role, NULL::text;
END;
$$;

-- 4. Update has_permission to handle subscription status (Grace period logic)
-- Note: A simplified version here; real logic would check os.status and os.current_period_end
CREATE OR REPLACE FUNCTION is_subscription_valid()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
    v_office_id uuid;
    v_status text;
    v_period_end timestamptz;
BEGIN
    SELECT office_id INTO v_office_id FROM office_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
    IF v_office_id IS NULL THEN RETURN false; END IF;

    SELECT status, current_period_end INTO v_status, v_period_end
    FROM office_subscriptions
    WHERE office_id = v_office_id
    LIMIT 1;

    IF v_status = 'active' OR v_status = 'trialing' THEN
        RETURN true;
    END IF;

    -- 3-day Grace Period for 'past_due'
    IF v_status = 'past_due' AND v_period_end + interval '3 days' > NOW() THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;
