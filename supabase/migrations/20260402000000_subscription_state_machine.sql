-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Update subscription status constraints for unified state machine
-- =========================================================================

-- 1. Update office_subscriptions status check
ALTER TABLE office_subscriptions 
DROP CONSTRAINT IF EXISTS office_subscriptions_status_check;

ALTER TABLE office_subscriptions 
ADD CONSTRAINT office_subscriptions_status_check 
CHECK (status IN ('trialing', 'active', 'pending', 'awaiting_payment', 'expired', 'cancelled', 'past_due'));

-- 2. Update subscription_requests status check
ALTER TABLE subscription_requests 
DROP CONSTRAINT IF EXISTS subscription_requests_status_check;

ALTER TABLE subscription_requests 
ADD CONSTRAINT subscription_requests_status_check 
CHECK (status IN ('pending', 'awaiting_payment', 'completed', 'rejected'));

-- 3. Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);

-- 4. Comment update
COMMENT ON COLUMN office_subscriptions.status IS 'Unified subscription status: trialing, active, pending, awaiting_payment, expired, cancelled';
COMMENT ON COLUMN subscription_requests.status IS 'Upgrade request status: pending, awaiting_payment, completed, rejected';
