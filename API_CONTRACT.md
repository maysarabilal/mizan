# API Contract — Server Actions

All server actions live in `src/lib/actions/`. Invoked directly from Client Components via Next.js Server Actions (no REST API).

## Common Pattern

```typescript
type ActionResult<T = null> = { data: T | null; error: string | null }
```

Every mutation: `'use server'` → Zod validate → `createClient()` → query → `revalidatePath()`.

---

## `auth.ts`

| Action | Input | Returns |
|---|---|---|
| `signIn(values)` | `loginSchema`: `{email, password}` | `ActionResult<{ redirect: string }>` |
| `signUp(values)` | `registerSchema`: `{email, password, full_name}` | `ActionResult` |
| `signOut()` | — | `ActionResult` |
| `resetPassword(values)` | `resetPasswordSchema`: `{email}` | `ActionResult` |

`signUp` uses `createAdminClient()` to create the initial profile (user not yet authenticated).

---

## `cases.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getCases(searchQuery?)` | optional string | — |
| `createCaseAction(values)` | `caseSchema` | `/dashboard/cases` |
| `updateCaseAction(id, values)` | string + `caseSchema` | `/dashboard/cases` |
| `deleteCaseAction(id)` | string | `/dashboard/cases` |

**`caseSchema` fields:** `client_id` (required), `title` (required, min 2), `case_number` (optional), `case_type` (required), `status` (required), `priority` (required), `litigation_degree` (optional), `assigned_to` (optional), `notes` (optional).

Gets `office_id` via `office_members` query on `user.id`.

---

## `clients.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getClients(searchQuery?)` | optional string | — |
| `createClientAction(values)` | `clientSchema` | `/dashboard/clients` |
| `updateClientAction(id, values)` | string + `clientSchema` | `/dashboard/clients` |
| `deleteClientAction(id)` | string | `/dashboard/clients` |

**`clientSchema` fields:** `name` (required, min 2), `phone` (optional), `email` (optional, validated if present), `notes` (optional).

Gets `office_id` via `supabase.rpc('current_office_id')`. Delete handles RLS `42501` error with specific Arabic message.

---

## `sessions.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getSessions()` | — | — |
| `createSessionAction(values)` | `sessionSchema` | `/dashboard`, `/dashboard/sessions`, `/dashboard/cases/{caseId}` |
| `updateSessionAction(id, values)` | string + `sessionSchema` | `/dashboard/sessions`, `/dashboard/cases/{caseId}` |
| `deleteSessionAction(id, caseId?)` | string + optional string | `/dashboard/sessions`, optionally `/dashboard/cases/{caseId}` |

**`sessionSchema` fields:** `case_id` (required), `session_date` (required, min 10), `session_time` (optional), `court` (optional), `hall` (optional), `session_type` (required), `outcome` (required), `notes` (optional).

Gets `office_id` via `office_members` query. Validates case belongs to same office before insert.

---

## `tasks.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getTasks(searchQuery?)` | optional string | — |
| `createTaskAction(values)` | `taskSchema` | `/dashboard/tasks`, optionally `/dashboard/cases/{caseId}` |
| `updateTaskAction(id, values)` | string + `taskSchema` | `/dashboard/tasks`, optionally `/dashboard/cases/{caseId}` |
| `deleteTaskAction(id)` | string | `/dashboard/tasks` |

**`taskSchema` fields:** `title` (required, min 2), `description` (optional), `status` (enum: `todo`, `in_progress`, `done`), `priority` (enum: `low`, `medium`, `high`), `due_date` (optional), `assigned_to` (optional uuid), `case_id` (optional uuid).

**Enum conversion:** Uses `STATUS_TO_DB` / `PRIORITY_TO_DB` map objects from `enums.ts` to convert English app values to Arabic DB values on write, and `DB_TO_STATUS` / `DB_TO_PRIORITY` on read.

Gets `office_id` via `office_members` query. Validates `case_id` and `assigned_to` belong to same office before insert/update. Insert requires `created_by = user.id`.

---

## `team.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getTeamMembers()` | — | — |
| `getCurrentUserRole()` | — | — |
| `getInvitations()` | — | — |
| `generateInviteCodeAction(values)` | `inviteSchema`: `{role}` | `/dashboard/team` |
| `deleteInvitationAction(id)` | string | `/dashboard/team` |
| `updateMemberRoleAction(id, role)` | string + string | `/dashboard/team` |
| `updateMemberPermissionsAction(values)` | `updatePermissionsSchema`: `{memberId, permissions}` | `/dashboard/team` |
| `toggleMemberStatusAction(id, isActive)` | string + boolean | `/dashboard/team` |
| `getAuditLogs()` | — | — |

`generateInviteCodeAction` uses `createAdminClient()` to check seat capacity against `max_users`.

---

## `onboarding.ts`

| Action | Input | Revalidates |
|---|---|---|
| `createOfficeWithTrial(values)` | `createOfficeSchema`: `{office_name, plan_slug}` | `/dashboard` |
| `joinOfficeWithCode(values)` | `joinOfficeSchema`: `{invite_code}` | `/dashboard`, `/setup` |

Both use `createAdminClient()`. `createOfficeWithTrial` creates: office → office_member (owner) → office_subscription (trialing, 7 days) → audit_log. `joinOfficeWithCode` calls `redeem_invitation` RPC.

---

## `subscription.ts`

| Action | Input | Returns |
|---|---|---|
| `checkSubscriptionStatus()` | — | `SubscriptionStatusData` (NOT ActionResult) |

Returns `{ isValid: boolean, status, daysRemaining, planName, maxUsers }`. Used by `SubscriptionGuard`.

---

## `subscriptions.ts`

| Action | Input | Revalidates | Client |
|---|---|---|---|
| `getCurrentSubscription()` | — | — | `createClient()` |
| `getAvailablePlans()` | — | — | `createClient()` |
| `getPaymentHistory()` | — | — | `createClient()` |
| `getPendingUpgradeRequest()` | — | — | `createClient()` |
| `requestPlanUpgradeAction(planId)` | string | `/dashboard/subscription` | `createAdminClient()` |

`requestPlanUpgradeAction` uses `createAdminClient()` to check for existing pending/awaiting_payment requests and to insert the new request.

---

## `settings.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getOfficeConfig()` | — | — |
| `updateOfficeSettingsAction(values)` | `officeSettingsSchema` | `/dashboard/settings` |

**`officeSettingsSchema` fields:** `name` (required, min 2), `session_reminders` (boolean), `task_completed` (boolean), `subscription_updates` (boolean).

Uses `supabase.rpc('current_office_id')` for office context. Update is RLS-restricted to owner role.

---

## `profile.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getProfileAction()` | — | — |
| `updateProfileAction(values)` | `profileSchema` | `/dashboard/profile`, `/dashboard` (layout) |

**`profileSchema` fields:** `full_name` (required, min 2, max 100), `phone` (optional).

`getProfileAction` appends `user.email` from auth (read-only, not in profiles table).

---

## `notifications.ts`

| Action | Input | Revalidates |
|---|---|---|
| `getNotifications(limit?)` | optional number (default 50) | — |
| `getUnreadCount()` | — | — |
| `markAsReadAction(id)` | string | `/dashboard`, `/dashboard/notifications` |
| `markAllAsReadAction()` | — | `/dashboard`, `/dashboard/notifications` |

Notifications are user-scoped (filtered by `user_id = auth.uid()`), not office-scoped.

---

## `admin.ts`

All actions call `requireAdmin()` first, then use `createAdminClient()`.

### Read Actions

| Action | Returns |
|---|---|
| `getAdminOverview()` | `{ totalOffices, pendingRequests, awaitingPayment, platformStats: { cases, clients, sessions, members, revenue } }` |
| `getGlobalUsers()` | All `office_members` with joined `profiles` + `offices` |
| `getOfficesList()` | All `offices` with nested `office_subscriptions` → `subscription_plans` |
| `getAllSubscriptionRequests()` | All `subscription_requests` with joined `offices`, `subscription_plans`, `profiles` |
| `getConfirmedRevenueTotal()` | Sum of `payments.amount` where `status = 'confirmed'` |

### Write Actions

| Action | Input | Revalidates |
|---|---|---|
| `approveUpgradeRequestAction(requestId)` | string | `/admin`, `/admin/subscriptions`, `/dashboard/subscription` |
| `rejectUpgradeRequestAction(requestId)` | string | `/admin`, `/admin/subscriptions`, `/dashboard/subscription` |
| `confirmRequestPaymentAction(requestId)` | string | `/admin`, `/admin/subscriptions`, `/admin/offices`, `/dashboard/subscription` |
| `toggleOfficeActiveAction(officeId, isActive)` | string + boolean | `/admin`, `/admin/offices` |
| `updateSubscriptionDirectlyAction(officeId, payload)` | string + `{status?, current_period_end?}` | `/admin`, `/admin/offices` |
| `forceBackfillOverageAction()` | — | `/admin/offices` |

### Removed Actions (replaced by new workflow)

- ~~`getPendingRequests()`~~ → replaced by `getAllSubscriptionRequests()`
- ~~`getPendingPayments()`~~ → removed (payments created automatically on confirmation)
- ~~`confirmPaymentAction(paymentId)`~~ → replaced by `confirmRequestPaymentAction(requestId)`
- ~~`rejectPaymentAction(paymentId)`~~ → removed (rejection happens via `rejectUpgradeRequestAction`)

### Subscription Workflow (3-step)

1. **Office submits upgrade** → `requestPlanUpgradeAction` (in `subscriptions.ts`) → request status: `pending`
2. **Admin approves** → `approveUpgradeRequestAction` → request status: `awaiting_payment` (subscription NOT activated)
3. **Admin confirms payment** → `confirmRequestPaymentAction` → creates payment record (amount from `subscription_plans.price_ils`), activates subscription (`status: 'active'`, expiry calculated from `billing_cycle`), marks request `completed`, auto-rejects other pending/awaiting_payment requests

Admin can **reject** at any stage (pending or awaiting_payment) via `rejectUpgradeRequestAction`.

### Behavior Notes

- **`getAdminOverview()`** — pure read. `awaitingPayment` counts `subscription_requests` where `status = 'awaiting_payment'` (not payments table).
- **`confirmRequestPaymentAction()`** derives payment amount from `subscription_plans.price_ils` — admin does NOT enter amount manually.
- **`updateSubscriptionDirectlyAction()`** validates status against `VALID_SUBSCRIPTION_STATUSES` whitelist.
- **No Zod validation:** Admin write actions rely on `requireAdmin()` + manual status/state validation.

---

## Validation Schemas (Complete Field Reference)

| File | Schema | Fields |
|---|---|---|
| `auth.ts` | `loginSchema` | `email` (required, email), `password` (required) |
| `auth.ts` | `registerSchema` | `email` (required, email), `password` (min 8), `full_name` (min 2) |
| `auth.ts` | `resetPasswordSchema` | `email` (required, email) |
| `cases.ts` | `caseSchema` | `client_id`, `title` (min 2), `case_number?`, `case_type`, `status`, `priority`, `litigation_degree?`, `assigned_to?`, `notes?` |
| `clients.ts` | `clientSchema` | `name` (min 2), `phone?`, `email?` (validated), `notes?` |
| `sessions.ts` | `sessionSchema` | `case_id`, `session_date` (min 10), `session_time?`, `court?`, `hall?`, `session_type`, `outcome`, `notes?` |
| `tasks.ts` | `taskSchema` | `title` (min 2), `description?`, `status` (enum), `priority` (enum), `due_date?`, `assigned_to?` (uuid), `case_id?` (uuid) |
| `team.ts` | `inviteSchema` | `role` (enum: INVITE_ROLES) |
| `team.ts` | `updateRoleSchema` | `role` (enum: MEMBER_ROLES) |
| `team.ts` | `updatePermissionsSchema` | `memberId` (uuid), `permissions` (Record<string, boolean>) |
| `onboarding.ts` | `createOfficeSchema` | `office_name` (min 2), `plan_slug` (required) |
| `onboarding.ts` | `joinOfficeSchema` | `invite_code` (min 6) |
| `profile.ts` | `profileSchema` | `full_name` (min 2, max 100), `phone?` |
| `settings.ts` | `officeSettingsSchema` | `name` (min 2), `session_reminders` (bool), `task_completed` (bool), `subscription_updates` (bool) |
