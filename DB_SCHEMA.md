# Database Schema

Source of truth: `supabase/migrations/` (13 migration files).

> **Warning:** `src/types/database.ts` is manually maintained and often stale. Always verify against migrations.

## Tables (14)

### `profiles`
Extends `auth.users`. One row per registered user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | text | Required |
| `phone` | text | Nullable |
| `is_admin` | boolean | Platform admin flag (default false) |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto via trigger |

### `offices`
Tenant root.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Required |
| `settings` | jsonb | `{session_reminders, task_completed, subscription_updates}` |
| `is_active` | boolean | Admin can suspend |
| `created_at` / `updated_at` | timestamptz | Auto |

### `office_members`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `office_id` | uuid FK | → offices |
| `user_id` | uuid FK | → profiles |
| `role` | text | `owner`, `admin`, `lawyer`, `secretary`, `trainee` |
| `is_active` | boolean | Soft deactivation |
| `permissions` | jsonb | `Record<string, boolean>` |
| UNIQUE | | `(office_id, user_id)` |

### `subscription_plans`

Stores the 6 active plans (+ 1 Enterprise). Currency is ILS.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Arabic plan name (e.g. الأساس, الاحتراف, etc) |
| `price_ils` | numeric | Price in ILS |
| `max_users` | int | Seat limit |
| `extra_user_price` | numeric | Per-extra-user price (default 0, used for future per-user billing) |
| `features` | jsonb | Feature flags |
| `slug` | text | Unique identifier (e.g., individual, office) |
| `billing_cycle` | text | 'monthly' or 'yearly' |
| `is_active` | boolean | Default true |

### `office_subscriptions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `office_id` | uuid FK | UNIQUE — one per office |
| `plan_id` | uuid FK | → subscription_plans |
| `status` | text | `trialing`, `active`, `pending`, `awaiting_payment`, `past_due`, `expired`, `cancelled` |
| `current_period_end` | timestamptz | Subscription expiry date |

### `subscription_requests`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `requested_plan_id` | uuid FK | |
| `status` | text | `pending`, `awaiting_payment`, `completed`, `rejected` |
| `requested_by` | uuid FK | → profiles |
| `admin_note` | text | Nullable |

### `payments`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `amount` | numeric | |
| `status` | text | `pending`, `confirmed`, `failed` |
| `payment_method` | text | Default `bank_transfer` |
| `confirmed_at` | timestamptz | Nullable |

### `office_member_overage`
Tracks offices that have exceeded their member limit, enforcing a 7-day grace period.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `office_id` | uuid FK | UNIQUE |
| `current_count` | int | Number of active members at detection |
| `max_users` | int | Limit of the current plan |
| `grace_deadline` | timestamptz | Date when office will be locked out |
| `resolved` | boolean | Default false |
| `created_at` | timestamptz | Auto |

### `invitations`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `code` | text UNIQUE | 6-char uppercase |
| `role` | text | Role assigned on join |
| `email` | text | Target email for the invitation (added in Phase 4) |
| `expires_at` | timestamptz | 7-day TTL |
| `created_by` | uuid FK | → profiles |

### `clients`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `name` | text | Required |
| `phone` | text | Nullable |
| `email` | text | Nullable |
| `notes` | text | Nullable |

### `cases`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `client_id` | uuid FK | → clients, ON DELETE RESTRICT |
| `title` | text | Required |
| `case_number` | text | Nullable |
| `case_type` | text | Arabic values |
| `status` | text | Default `جارية` |
| `priority` | text | Default `متوسطة` |
| `litigation_degree` | text | Nullable |
| `assigned_to` | uuid FK | → profiles, ON DELETE SET NULL |
| `notes` | text | Nullable |

### `sessions`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `case_id` | uuid FK | → cases, ON DELETE CASCADE |
| `session_date` | date | Required |
| `session_time` | time | Nullable |
| `court` | text | Nullable |
| `hall` | text | Nullable |
| `session_type` | text | Nullable |
| `outcome` | text | Nullable |
| `notes` | text | Nullable |

### `tasks`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `title` | text | Required |
| `description` | text | Nullable |
| `status` | text | Arabic: `معلقة`, `قيد التنفيذ`, `مكتملة` |
| `priority` | text | Arabic: `عالية`, `متوسطة`, `منخفضة` |
| `due_date` | date | Nullable |
| `assigned_to` | uuid FK | → profiles |
| `case_id` | uuid FK | → cases, nullable |
| `created_by` | uuid FK | → profiles, required |

### `notifications`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | |
| `user_id` | uuid FK | Target user |
| `type` | text | `session`, `task`, `payment`, `system` |
| `title` / `body` | text | |
| `is_read` | boolean | Default false |
| `related_entity_id` | uuid | Polymorphic |

### `audit_logs`

| Column | Type | Notes |
|---|---|---|
| `office_id` | uuid FK | Nullable |
| `user_id` | uuid FK | Nullable |
| `action` | text | e.g., `office_created` |
| `entity_type` | text | e.g., `office`, `case` |
| `entity_id` | uuid | |
| `details` | jsonb | Nullable |

## RPC Functions

| Function | Purpose |
|---|---|
| `current_office_id()` | Returns office_id for current user |
| `has_role(required_roles text[])` | Checks user role |
| `is_platform_admin()` | Checks `profiles.is_admin` |
| `has_permission(p_perm text)` | Checks specific JSONB permission (added in later migration) |
| `redeem_invitation(p_user_id, p_invite_code)` | Atomic invitation redemption |
| `trigger_set_updated_at()` | Auto `updated_at` trigger |

## RLS Summary

All 14 tables have RLS enabled. General pattern:

- **SELECT**: `office_id = current_office_id() OR is_platform_admin()`
- **INSERT**: `office_id = current_office_id()`
- **UPDATE**: `office_id = current_office_id()`
- **DELETE**: `office_id = current_office_id() AND has_role(ARRAY['owner'])`

Exceptions:
- `profiles`: SELECT via office membership, UPDATE own only
- `subscription_plans`: Public read, admin-only write
- `notifications`: User-scoped read (`user_id = auth.uid()`)
- `sessions` DELETE: allows `owner` or `lawyer`

## Known Schema Drift

| Issue | Details |
|---|---|
| Roles | Init migration: `owner\|lawyer\|assistant`. Current: `owner\|admin\|lawyer\|secretary\|trainee` |
| Subscription statuses | Init: 4 values (`active\|past_due\|canceled\|trialing`). Current: 7 values |
| `canceled` vs `cancelled` | Init migration: `canceled` (US). Later migration `subscription_state_machine`: `cancelled` (UK). DB CHECK constraint now expects `cancelled`. Admin panel + dashboard code still use `canceled` |
| `billing_cycle` | Exists in DB (migration), missing from `database.ts` |
| `slug` on plans | Added in migration `20260331000000` |
| `has_permission` RPC | Added in later migration, not in `database.ts` types |

## Regenerate Types

```bash
npx supabase gen types
```
