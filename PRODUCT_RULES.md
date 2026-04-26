# Product Rules

## Tenancy

- Every office is an isolated tenant.
- Users belong to exactly one office at a time (via `office_members`).
- Data never crosses office boundaries (enforced by RLS).
- A user without an active office membership is redirected to `/setup`.

## Roles

Hierarchy: `owner` → `admin` → `lawyer` → `secretary` → `trainee`.

| Role | Can create office | Can manage team | Can invite | Can delete data |
|---|---|---|---|---|
| `owner` | Yes (on setup) | Yes | Yes | Yes |
| `admin` | No | Yes | Yes | Per permissions |
| `lawyer` | No | No | No | Sessions only |
| `secretary` | No | No | No | No |
| `trainee` | No | No | No | No |

Granular permissions are stored in `office_members.permissions` (JSONB). 19 permission keys defined in `src/lib/validations/team.ts`.

## Invitations

- Owners and admins can generate 6-character join codes.
- Codes expire after 7 days.
- Each code assigns a pre-defined role.
- Seat capacity is checked against the subscription plan's `max_users` before code generation.

## Subscription Lifecycle

1. **Office creation** → user provides `office_name` + `plan_slug` → 7-day trial (status: `trialing`).
2. **Trial ends** → status: `past_due` → 3-day grace period (warning banner shown).
3. **Grace period exceeded** → status: `expired` → dashboard locked via `SubscriptionGuard`.
4. **Owner requests upgrade** → creates `subscription_request` (status: `pending`). Uses `createAdminClient()` to check for existing pending requests.
5. **Platform admin approves** → request status: `awaiting_payment` (subscription NOT activated).
6. **Payment confirmed** → admin marks payment confirmed → subscription activated, other pending requests for same office auto-rejected.

### Overage Enforcement

If an office exceeds its `max_users` limit across its active members, it is flagged for overage.
- A 7-day grace period is initiated (`grace_deadline`).
- A persistent red warning banner is displayed across the tenant dashboard.
- If the excess members are not disabled before the deadline, the `SubscriptionGuard` mechanism intercepts and locks the dashboard.

### Manual Payment Model

- No automated payment processing (no Stripe/PayPal).
- All payments are confirmed manually by the platform admin.
- Data is preserved when an account is locked — only access is blocked.

## Platform Admin

- A user with `profiles.is_admin = true`.
- Platform admin is **not** an office role — it's a separate privilege.
- Admin panel at `/admin` is fully isolated from the tenant dashboard.
- Admin can: view all offices, approve/reject upgrade requests, confirm/reject payments, suspend/unsuspend offices, override subscription status.

## Arabic Content Rules

- All user-facing text is Arabic.
- Error messages returned to the client are Arabic.
- Task `status` and `priority` are stored as Arabic strings in the database.
- Case `case_type`, `status`, `priority`, and `litigation_degree` use Arabic values.

## Currency

- All prices are in ILS (Israeli New Shekel).
- Stored in `subscription_plans.price_ils`.
