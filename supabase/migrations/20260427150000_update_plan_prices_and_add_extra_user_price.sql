-- Add extra_user_price column for future per-user billing
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS extra_user_price numeric DEFAULT 0;

-- Update individual (monthly): 149 → 40, name → الأساس
UPDATE subscription_plans SET name = 'الأساس', price_ils = 40, max_users = 1, extra_user_price = 0
WHERE slug = 'individual';

-- Update office (monthly): 349 → 150, max_users 5 → 10, name → الاحتراف
UPDATE subscription_plans SET name = 'الاحتراف', price_ils = 150, max_users = 10, extra_user_price = 20
WHERE slug = 'office';

-- Update institution (monthly): 699 → 300, max_users 15 → 20, name → الريادة
UPDATE subscription_plans SET name = 'الريادة', price_ils = 300, max_users = 20, extra_user_price = 20
WHERE slug = 'institution';

-- Update individual_yearly: 1490 → 400
UPDATE subscription_plans SET name = 'الأساس — سنوي', price_ils = 400, max_users = 1, extra_user_price = 0
WHERE slug = 'individual_yearly';

-- Update office_yearly: 3490 → 1500, max_users 5 → 10
UPDATE subscription_plans SET name = 'الاحتراف — سنوي', price_ils = 1500, max_users = 10, extra_user_price = 20
WHERE slug = 'office_yearly';

-- Update institution_yearly: 6990 → 3000, max_users 15 → 20
UPDATE subscription_plans SET name = 'الريادة — سنوي', price_ils = 3000, max_users = 20, extra_user_price = 20
WHERE slug = 'institution_yearly';

-- Update enterprise: name → المؤسسات
UPDATE subscription_plans SET name = 'المؤسسات', price_ils = 0, max_users = 9999, extra_user_price = 0
WHERE slug = 'enterprise';
