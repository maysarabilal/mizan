-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Add slug column to subscription_plans for stable programmatic access
-- Idempotent: safe to run multiple times
-- =========================================================================

-- 1. Add the slug column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE subscription_plans ADD COLUMN slug TEXT;
EXCEPTION WHEN duplicate_column THEN
    NULL; -- Column already exists, skip
END $$;

-- 2. Update each plan with its corresponding slug (only if not already set)
UPDATE subscription_plans SET slug = 'individual' WHERE name = 'فردي' AND (slug IS NULL OR slug = '');
UPDATE subscription_plans SET slug = 'office' WHERE name = 'مكتب' AND (slug IS NULL OR slug = '');
UPDATE subscription_plans SET slug = 'enterprise' WHERE name = 'مؤسسي' AND (slug IS NULL OR slug = '');

-- 3. Make the column NOT NULL (safe to run multiple times)
ALTER TABLE subscription_plans ALTER COLUMN slug SET NOT NULL;

-- 4. Add UNIQUE constraint if it doesn't exist (check first)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_plans_slug_key' 
        AND conrelid = 'subscription_plans'::regclass
    ) THEN
        ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);
    END IF;
END $$;

-- 5. Add CHECK constraint to ensure slug is never empty (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_plans_slug_not_empty' 
        AND conrelid = 'subscription_plans'::regclass
    ) THEN
        ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_slug_not_empty CHECK (slug <> '');
    END IF;
END $$;

-- 6. Create an index on slug for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);

-- 7. Add comment for documentation
COMMENT ON COLUMN subscription_plans.slug IS 'Stable identifier for programmatic access (individual, office, enterprise)';
