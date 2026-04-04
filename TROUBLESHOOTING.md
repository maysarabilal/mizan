# Troubleshooting

## Common Issues

### "RLS policy violation" or empty data returned

**Cause:** Wrong Supabase client or missing `office_id`.

1. Verify the correct client is used (`createClient()` for RLS, `createAdminClient()` for bypass).
2. Check that `current_office_id()` returns a value — null means no active office membership.
3. For new features, check if an RLS policy exists for the table and operation (SELECT/INSERT/UPDATE/DELETE) in `supabase/migrations/`.

### Task queries return wrong results

**Cause:** Passing English status/priority to a column that stores Arabic strings.

- **Wrong:** `.eq('status', 'todo')` or `.eq('priority', 'high')`
- **Also wrong:** `.eq('status', 'معلقة')` (hardcoded Arabic)
- **Correct:** `.eq('status', toDbStatus('todo'))` or `.eq('status', STATUS_TO_DB['todo'])`
- Both helper functions (`toDbStatus`, `toDbPriority`) and map constants (`STATUS_TO_DB`, `PRIORITY_TO_DB`) from `src/lib/constants/enums.ts` are valid.

### Admin action returns "Forbidden" or "Unauthorized"

1. Check that `profiles.is_admin = true` for the user.
2. Check that the action calls `requireAdmin()` before any DB operation.
3. Admin actions must use `createAdminClient()` — RLS blocks cross-tenant reads.

### "Column does not exist" or type errors on DB fields

**Cause:** `src/types/database.ts` is stale.

- Verify the column exists in `supabase/migrations/`.
- If the column was added in a later migration (e.g., `slug`, `billing_cycle`, `permissions`), the types may not include it.
- Fix: use `as any` cast temporarily, or regenerate types with `npx supabase gen types`.

### `has_permission` RPC errors

- This function was added in a later migration and is not in `database.ts` types.
- Must be called with `as any` cast: `(supabase.rpc as any)('has_permission', { p_perm: 'key' })`.

### `subscription.ts` vs `subscriptions.ts` confusion

- `subscription.ts` — contains `checkSubscriptionStatus()` only.
- `subscriptions.ts` — contains all subscription CRUD: `getCurrentSubscription`, `getAvailablePlans`, `getPaymentHistory`, `getPendingUpgradeRequest`, `requestPlanUpgradeAction`.
- These are different files. Check imports carefully.

### SubscriptionGuard locks dashboard unexpectedly

1. Check `office_subscriptions.status` in the DB.
2. Check `office_subscriptions.current_period_end` — has it passed?
3. Grace period is 3 days after `current_period_end`. After that, `checkSubscriptionStatus()` returns `isValid: false`.
4. Valid statuses: `active`, `trialing`, `past_due` (within 3 days).

### Invitation code not working

1. Check if the code exists in `invitations` table.
2. Check `expires_at` — codes expire after 7 days.
3. Check if the user is already in an office (`office_members` with `is_active = true`).
4. The `redeem_invitation` RPC handles the atomic join — check its return for `res_error`.

### Role mismatch errors

- Initial schema defined roles as `owner|lawyer|assistant`.
- Later migrations expanded to `owner|admin|lawyer|secretary|trainee`.
- TypeScript types use the newer set. If the DB still has old constraints, run pending migrations.

### Build succeeds but runtime error occurs

- `next.config.ts` has `ignoreBuildErrors: true` — TypeScript errors are suppressed at build time.
- A successful `npm run build` does NOT guarantee type safety.
- Always test the affected flow in the browser after building.

### Admin: `canceled` vs `cancelled` spelling mismatch — ✅ FIXED

**Root cause:** Init migration used `canceled` (US spelling). Later migration `subscription_state_machine` changed the CHECK constraint to `cancelled` (UK, double L).

**Fix applied:** Changed `canceled` → `cancelled` and added all 7 subscription statuses in:
- `ManualOverrideModal.tsx` — option values
- `OfficesDirectory.tsx` — status badge switch case
- `SubscriptionOverview.tsx` — status map key

### Admin: `getAdminOverview` mutates production data — ✅ FIXED

**Root cause:** `admin.ts` L39-42 contained a `subscription_plans` UPDATE that ran on every dashboard load.

**Fix applied:** Removed the silent migration entirely. If the `max_users` value needs changing, it should be done via a proper migration.

### Admin: Missing status/role badge values — ✅ FIXED

**Fix applied:**
- `OfficesDirectory.getStatusBadge()` now handles all 7 statuses: `active`, `trialing`, `past_due`, `expired`, `cancelled`, `pending`, `awaiting_payment`
- `GlobalUsersList.getRoleBadge()` now handles all 5 current roles: `owner`, `admin`, `lawyer`, `secretary`, `trainee`

### Admin: `rejectPaymentAction` permanently deletes payment records — ✅ FIXED → ✅ REPLACED

**Original fix:** Changed to soft-reject with `status: 'failed'`.

**Current state:** The `rejectPaymentAction` was removed entirely in the subscription workflow redesign. Payments are now created automatically by `confirmRequestPaymentAction` — there are no manual pending payments to reject. Rejection happens at the request level via `rejectUpgradeRequestAction`.

### Admin: Subscription workflow redesigned

**Old flow:** Request → Approve (immediate activation) → Payment confirmation (separate)
**New flow:** Request → Approve (→ awaiting_payment) → Confirm Payment (auto-creates payment + activates)

Key changes:
- `/admin/requests` and `/admin/payments` merged into `/admin/subscriptions`
- Old routes redirect to `/admin/subscriptions`
- `approveUpgradeRequestAction` now transitions to `awaiting_payment` (not `active`)
- `confirmRequestPaymentAction` creates payment record from `subscription_plans.price_ils`
- Old `confirmPaymentAction`, `rejectPaymentAction`, `getPendingPayments` removed
### Admin: `window.confirm()` blocks button handlers silently — ✅ FIXED

**Symptom:** Confirm Payment and Reject buttons in `/admin/subscriptions` do nothing — no error, no loading, no toast.

**Root cause:** All three handlers (`handleApprove`, `handleReject`, `handleConfirmPayment`) started with `if (!confirm('...')) return`. The native `window.confirm()` returns `false` in automated/headless browsers and can be silently suppressed by browser popup settings. When it returns `false`, the handler exits at line 1 — before `setProcessing()` or the server action call.

**Fix:** Removed all `window.confirm()` gates. The server actions validate state server-side (e.g., checking `request.status === 'awaiting_payment'`), and the button labels are unambiguous.

**Rule:** Never use `window.confirm()` or `window.alert()` in admin panel code. Use toast feedback and server-side validation instead.

## Schema Verification

When in doubt about any column, constraint, or status value:

```bash
# Check the initial schema
cat supabase/migrations/20260327000000_init.sql

# List all migration files
ls supabase/migrations/

# Regenerate types from live DB
npx supabase gen types
```

## Security Fixes

### Office Suspension and Subscription Guard Bypass — ✅ FIXED

**Symptom:** Suspended offices (`is_active = false`) could still access the dashboard because the layouts checked `office_members.is_active` instead of `offices.is_active`. Additionally, `SubscriptionGuard` was only a client-side visual blur, allowing users with expired/frozen subscriptions to read/write data using DevTools or by fetching Server Actions directly.

**Fix Applied:**
1. **Server-side Layout Checking:** `src/app/dashboard/layout.tsx` now calls `checkSubscriptionStatus()`. If the office is suspended, it redirects instantly to `/suspended`. If the subscription is blocked, it passes the status to `SubscriptionGuard` to fully block rendering `children` in DOM.
2. **Server Action Guard:** A robust `requireActiveSubscription()` handler was injected at the top of every data mutation/read action (e.g., `cases.ts`, `tasks.ts`, `clients.ts`) to immediately reject illicit POST requests.
3. **Date vs DB Status Integrity:** Fixed `checkSubscriptionStatus` where an `active` string status in DB would ignore `diffDays < 0` and forcefully return `isValid = true` despite a past expiration date. It now strictly honors expiration time regardless of the stale DB status.

## Open Questions

- **Email sending mechanism**: `react-email` templates exist in `src/emails/` but no send function or email service configuration is visible in the codebase. Unknown how (or if) emails are actually sent.
