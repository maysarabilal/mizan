-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Create Nightly Maintenance Cron Job Logic
-- =========================================================================

CREATE OR REPLACE FUNCTION nightly_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grace_period_days INT := 7;
BEGIN
  -- 1. trialing / active -> past_due
  -- (If the subscription has expired according to its date)
  UPDATE office_subscriptions
  SET status = 'past_due', updated_at = NOW()
  WHERE status IN ('trialing', 'active')
    AND current_period_end < NOW()
    AND status != 'past_due';

  -- 2. past_due -> expired
  -- (If the subscription has exceeded the initial grace period)
  UPDATE office_subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'past_due'
    AND current_period_end + (v_grace_period_days * interval '1 day') < NOW()
    AND status != 'expired';

  -- Note on Overage: office_member_overage locks the system dynamically via 
  -- SubscriptionGuard when grace_deadline < NOW(), so no status update is needed for it.
END;
$$;

-- Grant execution securely
GRANT EXECUTE ON FUNCTION nightly_maintenance() TO service_role;

-- =========================================================================
-- OPTIONAL CRON SCHEDULING (Requires Pro Plan & pg_cron extension)
-- =========================================================================
-- If you are on a Supabase Pro Plan, you can uncomment these lines to self-host the cron job:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'nightly-subscription-check', -- Name of the cron job
--   '0 0 * * *',                  -- Runs every day at midnight
--   'SELECT nightly_maintenance();'
-- );
