# QA Master Plan — Mizan Pre-Launch

## Test Data Baseline
- Office A: active subscription, plan limit `5`, owner + admin + lawyer + secretary + trainee
- Office B: separate tenant with its own clients/cases/tasks/sessions
- Platform Admin account with `profiles.is_admin = true`
- One downgraded office with active member count above plan limit
- One office in each subscription state: `active`, `past_due`, `expired`, `cancelled`
- One disabled member (`disabled_by_admin = true`)

---

## Feature 1: Legal Cases

### Test Scenarios

#### CAS-001 Create case linked to existing client and assigned member
1. Login as Office A owner or user with `add_cases`.
2. Open `/dashboard/cases`.
3. Click add case.
4. Select an existing client from Office A.
5. Fill title, case type, status, priority, litigation degree, assigned lawyer, notes.
6. Save.

**Expected Result (Database & UI)**
- UI: success toast, dialog closes, new row appears in cases table.
- DB: one `cases` row inserted with Office A `office_id`, selected `client_id`, selected `assigned_to`, Arabic field values unchanged.

#### CAS-002 Edit case and change linked client
1. Open an existing case.
2. Change client, status, priority, notes, and assigned lawyer.
3. Save.
4. Refresh page.

**Expected Result (Database & UI)**
- UI: updated values persist after refresh.
- DB: same `cases.id`, updated columns changed, no duplicate row created.

#### CAS-003 Search and visibility by tenant
1. In Office A, create a case with unique title.
2. Search for that title in `/dashboard/cases`.
3. Login as Office B user.
4. Search for the same title.

**Expected Result (Database & UI)**
- UI: Office A sees the case, Office B sees no result.
- DB: row remains scoped to Office A only.

#### CAS-004 Delete case with and without permission
1. Login as user with `delete_cases`.
2. Delete a case with no child session dependency concern.
3. Login as user without `delete_cases`.
4. Attempt delete on another case.

**Expected Result (Database & UI)**
- UI: authorized delete succeeds; unauthorized delete shows Arabic permission error.
- DB: authorized row removed; unauthorized attempt leaves row intact.

#### CAS-005 Attempt create with invalid or foreign references
1. Intercept the create payload.
2. Replace `client_id` with a client UUID from Office B.
3. Retry.
4. Retry again with `assigned_to` set to random UUID.

**Expected Result (Database & UI)**
- UI: generic Arabic failure toast.
- DB: no row inserted.

### Edge Cases
- Create case with extremely long Arabic title and notes.
- Create case with blank `case_number`.
- Reassign case from active lawyer to inactive member UUID.
- Edit same case from two browsers within one minute.

### Break Tests
- Submit dialog by double-clicking save.
- Refresh browser during pending save.
- Delete a case while another user is editing it.
- Import malformed payload with `status: null` or empty `title`.

### Security Tests
- Modify payload `office_id` manually if present client-side; verify DB still uses current office scope only.
- Try direct Server Action call as member lacking `add_cases` or `edit_cases`.
- Try delete by pasting case UUID from another office.
- Verify hidden case rows do not leak through search, counts, or joined client names.

### Automation Suggestions
- Playwright flow for create/edit/delete with toast assertions.
- API-level replay test for tampered `client_id` and `assigned_to`.
- SQL assertion for inserted `office_id`, `client_id`, and no duplicate record on double submit.

---

## Feature 2: Court Sessions

### Test Scenarios

#### SES-001 Create session from list view
1. Login as user with `add_sessions`.
2. Open `/dashboard/sessions`.
3. In list tab, add session.
4. Select an Office A case.
5. Enter date, time, session type, outcome, court, hall, notes.
6. Save.

**Expected Result (Database & UI)**
- UI: success toast, session appears in list sorted by `session_date`.
- DB: one `sessions` row inserted with Office A `office_id` and selected `case_id`.

#### SES-002 Calendar rendering and outcome color mapping
1. Create four sessions with outcomes `scheduled`, `completed`, `postponed`, `cancelled`.
2. Open calendar tab.
3. Verify colors and titles.
4. Click each event and open edit dialog.

**Expected Result (Database & UI)**
- UI: blue scheduled, green completed, yellow postponed, red cancelled; dialog opens with correct data.
- DB: no data mutation from calendar read-only interaction.

#### SES-003 Update session and move date/time
1. Edit an existing session.
2. Change date and time to another day.
3. Save.
4. Reopen in calendar and list.

**Expected Result (Database & UI)**
- UI: old slot disappears, new slot appears, list order updates.
- DB: existing `sessions.id` updated, no duplicate row.

#### SES-004 Create session against foreign case
1. Intercept create payload.
2. Replace `case_id` with Office B case UUID.
3. Submit.

**Expected Result (Database & UI)**
- UI: Arabic error stating the case is not found.
- DB: no session row inserted.

#### SES-005 Delete session with and without permission
1. Delete as user with `delete_sessions`.
2. Repeat as user without delete permission.

**Expected Result (Database & UI)**
- UI: authorized delete succeeds; unauthorized delete shows Arabic permission error.
- DB: row deleted only once, unauthorized attempt leaves row intact.

### Edge Cases
- Same case, same date, same time entered twice.
- Session with date only and no time.
- Session with outcome changed to `cancelled` after completion.
- Browser timezone change around midnight.

### Break Tests
- Bulk-create sessions rapidly for same case/day.
- Edit from calendar while another user deletes the session from list.
- Submit with malformed `session_date`, `session_time`, or blank `case_id`.
- Force very long court and hall values.

### Security Tests
- Replay update/delete action with another office session UUID.
- Attempt session delete as trainee via direct action call.
- Confirm no cross-tenant session titles appear in calendar event feed.
- Attempt to bypass route guard by direct URL to `/dashboard/sessions`.

### Automation Suggestions
- Playwright visual check for calendar color states.
- Action replay tests for foreign `case_id` and unauthorized delete.
- SQL check that `office_id` always matches the case office.

---

## Feature 3: Kanban Tasks

### Test Scenarios

#### TSK-001 Create task with case and assignee
1. Login as user with `add_tasks`.
2. Open `/dashboard/tasks`.
3. Add task from the `todo` column.
4. Fill title, description, status, priority, due date.
5. Assign to active Office A member and link Office A case.
6. Save.

**Expected Result (Database & UI)**
- UI: new card appears in selected column with correct labels.
- DB: one `tasks` row inserted with Arabic `status`/`priority`, valid `assigned_to`, valid `case_id`, and `created_by = auth.uid()`.

#### TSK-002 Drag task across columns
1. Drag a task from `todo` to `in_progress`.
2. Drop onto column body.
3. Refresh page.

**Expected Result (Database & UI)**
- UI: toast confirms status update; task remains in new column after refresh.
- DB: `tasks.status` changes from Arabic `معلقة` to `قيد التنفيذ`.

#### TSK-003 Reorder inside same column
1. Drag one task above another in same column.
2. Refresh page.

**Expected Result (Database & UI)**
- UI: visual order may change during session only; refresh should not corrupt data.
- DB: no unintended status change or duplicate rows.

#### TSK-004 Reject invalid assignee or foreign case
1. Intercept create or update payload.
2. Replace `assigned_to` with inactive member or Office B member.
3. Retry with `case_id` from Office B.

**Expected Result (Database & UI)**
- UI: Arabic validation/business error.
- DB: no invalid update committed.

#### TSK-005 Delete task with permissions
1. Delete as user with `delete_tasks`.
2. Repeat as user without delete permission.

**Expected Result (Database & UI)**
- UI: authorized delete succeeds; unauthorized delete fails cleanly.
- DB: only authorized delete removes the row.

### Edge Cases
- Drag during poor network and release outside valid drop zone.
- Task without assignee and without case.
- Task title with trailing spaces only.
- Edit task whose linked case was deleted earlier.

### Break Tests
- Drag same card repeatedly between columns before first request resolves.
- Double-click save on create/edit dialog.
- Delete task while another browser is dragging it.
- Inject invalid enum values like `status = archived`.

### Security Tests
- Replay `updateTaskAction` with another office task UUID.
- Try creating task while subscription is expired.
- Attempt delete through direct action without `delete_tasks`.
- Confirm hidden tasks never appear via search or sidebar counts to another office.

### Automation Suggestions
- Playwright drag-and-drop with persistence assertion.
- Contract test for English-to-Arabic enum mapping.
- Replay tests for invalid UUID assignee/case and expired subscription.

---

## Feature 4: Client Directory

### Test Scenarios

#### CLI-001 Create valid client
1. Login as user with `add_clients`.
2. Open `/dashboard/clients`.
3. Add client with Arabic name, phone, email, notes.
4. Save.

**Expected Result (Database & UI)**
- UI: success toast, row appears in client table.
- DB: one `clients` row inserted with Office A `office_id`.

#### CLI-002 Update client and preserve optional blanks
1. Edit existing client.
2. Clear phone and notes.
3. Save.
4. Refresh page.

**Expected Result (Database & UI)**
- UI: empty optional fields display as blank or placeholder.
- DB: cleared optional fields stored as `null` where applicable.

#### CLI-003 Duplicate client handling
1. Create a client with same name and phone as an existing one.
2. Save.
3. Search both records.

**Expected Result (Database & UI)**
- UI: system either allows both or blocks consistently; behavior must be explicit and reproducible.
- DB: if allowed, both rows are distinct and visible only to same office.

#### CLI-004 Delete client referenced by case
1. Ensure client is linked to an existing case.
2. Attempt delete.

**Expected Result (Database & UI)**
- UI: delete fails with Arabic error, no silent success.
- DB: client row remains due to FK `ON DELETE RESTRICT`.

#### CLI-005 Invalid email validation
1. Open add client dialog.
2. Enter invalid email format.
3. Save.

**Expected Result (Database & UI)**
- UI: inline validation error before submit or server error after submit; record not created.
- DB: no row inserted.

### Edge Cases
- Client name with 1 character.
- Email empty string versus `null`.
- Long Arabic company names and multiline notes.
- Search term with partial Arabic diacritics.

### Break Tests
- Create same client rapidly in two tabs.
- Delete client while linked case is being created in another tab.
- Submit phone field with letters, symbols, or extremely long value.
- Paste HTML or script-like content into notes.

### Security Tests
- Replay create/update/delete with Office B client UUID.
- Attempt delete without `delete_clients`.
- Confirm case join does not expose Office B client names.
- Verify direct URL access by trainee without `view_clients` redirects or blocks.

### Automation Suggestions
- Playwright form validation suite for invalid email and duplicate handling.
- DB assertion for FK delete restriction.
- Replay tests for cross-tenant UUID tampering.

---

## Feature 5: Subscription Lifecycle & Guards

### Test Scenarios

#### SUB-001 Active subscription full access
1. Set Office A subscription to `active` with future `current_period_end`.
2. Login as active owner.
3. Open dashboard home and all tenant routes.
4. Execute one mutation in cases or tasks.

**Expected Result (Database & UI)**
- UI: no lock screen, all allowed routes render normally.
- DB: server actions execute successfully.

#### SUB-002 `past_due` within 3-day grace
1. Set subscription status to `past_due`.
2. Set `current_period_end` to within last 1 to 2 days.
3. Login as owner.
4. Browse dashboard and run a mutation.

**Expected Result (Database & UI)**
- UI: amber warning banner appears; dashboard remains usable.
- DB: mutations still commit.

#### SUB-003 `past_due` after grace and `expired`
1. Set status to `past_due` with `current_period_end` older than 3 days.
2. Repeat with status `expired`.
3. Login as owner.
4. Try visiting `/dashboard/cases` and `/dashboard/subscription`.
5. Try calling a Server Action directly.

**Expected Result (Database & UI)**
- UI: lock screen shown; only renewal path is available.
- DB: protected server actions return Arabic subscription error and do not mutate data.

#### SUB-004 `cancelled` state
1. Set status to `cancelled` with past or future end date.
2. Login as owner.
3. Visit dashboard and subscription page.

**Expected Result (Database & UI)**
- UI: system treats office as locked unless business rule says otherwise; no inconsistent partial access.
- DB: no unauthorized mutation permitted.

#### SUB-005 `pending` and `awaiting_payment`
1. Create pending upgrade request.
2. Approve it to `awaiting_payment`.
3. Login as office owner.
4. Open `/dashboard/subscription`.
5. Attempt another upgrade request.

**Expected Result (Database & UI)**
- UI: status shown clearly, buttons reflect locked request state, duplicate request blocked.
- DB: only one open request remains in `pending` or `awaiting_payment`.

#### SUB-006 Rapid manual state changes from admin
1. In admin panel, switch one office through `active -> past_due -> expired -> active -> cancelled`.
2. Refresh admin office list after each change.
3. In parallel, keep an office user session open and refresh dashboard.

**Expected Result (Database & UI)**
- UI: admin badges update correctly; tenant session reflects latest valid state.
- DB: one `office_subscriptions` row updated consistently, no duplicate overage rows from state-only changes.

#### SUB-007 Office suspension and member disable override
1. Suspend office via admin action.
2. Login as active office member.
3. Reactivate office and disable one member via admin.
4. Login as disabled member.

**Expected Result (Database & UI)**
- UI: office suspension shows office lock; disabled member shows member lock.
- DB: `offices.is_active = false` or `office_members.disabled_by_admin = true` reflected accurately.

### Edge Cases
- Subscription expires while user is mid-form submit.
- `current_period_end` missing or malformed.
- No `office_subscriptions` row exists.
- Status/date mismatch caused by cron not running on free plan.

### Break Tests
- Manually set unsupported status string via intercepted admin payload.
- Refresh protected route repeatedly during status transition.
- Call server action from expired session and expired subscription at same time.
- Attempt to trigger mutations from lock screen browser console.

### Security Tests
- Direct URL access to protected routes while locked.
- Direct Server Action replay to bypass `SubscriptionGuard`.
- Tamper hidden form status values in manual override modal.
- Verify no hidden data is rendered under overlay source HTML when locked.

### Automation Suggestions
- State-machine regression suite for `active`, `past_due`, `expired`, `cancelled`, `pending`, `awaiting_payment`.
- Replay tests for blocked server actions during locked states.
- Snapshot tests for warning banner and lock screen variants.

---

## Feature 6: Office User Limits & Overage

### Test Scenarios

#### OVG-001 Reach exact plan limit
1. Use plan with `max_users = 5`.
2. Add members until exactly 5 active members exist.
3. Generate a sixth invite.
4. Redeem the invite if generated.

**Expected Result (Database & UI)**
- UI: fifth member allowed; sixth invite generation or activation blocked cleanly.
- DB: active member count never exceeds allowed path without overage-triggering admin downgrade scenario.

#### OVG-002 Generate invite when already at limit
1. Login as owner/admin of office already at max members.
2. Open `/dashboard/team`.
3. Generate invite.

**Expected Result (Database & UI)**
- UI: `MEMBER_LIMIT_REACHED` error shown.
- DB: no new `invitations` row inserted; platform admins receive notification.

#### OVG-003 Downgrade plan below current active count
1. In admin panel, change office plan to one with lower `max_users`.
2. Refresh admin office row.
3. Login as office owner.

**Expected Result (Database & UI)**
- UI: overage warning banner appears; office remains usable until grace deadline.
- DB: one unresolved `office_member_overage` row created with `current_count`, `max_users`, and 7-day `grace_deadline`.

#### OVG-004 Overage grace expiry and remediation mode
1. Set unresolved overage `grace_deadline` to past timestamp.
2. Login as office user.
3. Try `/dashboard/cases`.
4. Try `/dashboard/team` and `/dashboard/subscription`.

**Expected Result (Database & UI)**
- UI: non-remediation routes locked; team/subscription remain accessible.
- DB: non-remediation server actions blocked; team deactivation actions still allowed.

#### OVG-005 Resolve overage by deactivating extra member
1. In remediation mode, deactivate one active member.
2. Refresh dashboard.

**Expected Result (Database & UI)**
- UI: lock removed once active count is within limit; owner receives success notification.
- DB: `office_member_overage.resolved = true`.

#### OVG-006 Concurrent member additions
1. Use two browsers with owner/admin permissions.
2. Generate or redeem two additions nearly simultaneously when only one seat remains.

**Expected Result (Database & UI)**
- UI: only one path succeeds, second fails clearly.
- DB: active count never exceeds legal limit through race condition.

### Edge Cases
- Reactivate inactive member while at limit.
- Admin reactivates a member disabled by admin.
- Force backfill overage when unresolved record already exists.
- Change plan upward while unresolved overage exists.

### Break Tests
- Call invite generation repeatedly from multiple tabs.
- Attempt direct insert into `office_members` via action replay with forged office.
- Deactivate and reactivate same user rapidly around seat limit.
- Backfill while admin manually edits plan at same time.

### Security Tests
- Bypass seat cap by redeeming invite code directly after UI blocks generation.
- Use Server Action replay to activate disabled member even with `disabled_by_admin = true`.
- Attempt remediation-route access from another office user using copied URLs.
- Verify overage records are readable only by same office or platform admin.

### Automation Suggestions
- Concurrency script for invite redemption and member activation.
- SQL assertions for single unresolved overage record per office.
- Playwright coverage for remediation-mode route access control.

---

## Feature 7: Role & Permissions System

### Test Scenarios

#### PER-001 Role matrix visibility
1. Login separately as owner, admin, lawyer, secretary, trainee.
2. Record sidebar links visible for each role.
3. Compare against assigned permissions JSON.

**Expected Result (Database & UI)**
- UI: owner sees all routes; others see only routes matching granted permissions.
- DB: no mutation; permissions JSON matches visible routes.

#### PER-002 Direct URL access to hidden route
1. Hide `view_team` from a member.
2. Manually browse to `/dashboard/team`.
3. Repeat for `/dashboard/logs`, `/dashboard/settings`, `/dashboard/subscription`.

**Expected Result (Database & UI)**
- UI: redirect to `/dashboard` or locked error state; route does not render private data.
- DB: no unauthorized read or write occurs.

#### PER-003 CRUD permission enforcement
1. For each module, test user with view-only permission.
2. Attempt create, edit, delete through UI.
3. Replay the same mutations directly.

**Expected Result (Database & UI)**
- UI: blocked actions fail with Arabic permission errors.
- DB: no unauthorized row mutation.

#### PER-004 Manage team and permission editing controls
1. Grant a member `manage_team` but not `manage_permissions`.
2. Attempt role changes and permission edits.
3. Grant `manage_permissions` and retry.

**Expected Result (Database & UI)**
- UI: team actions and permission actions respect separate permissions.
- DB: only allowed updates appear in `office_members.permissions` or `role`.

#### PER-005 Self-escalation prevention
1. Login as non-owner with `manage_permissions`.
2. Attempt to change own permissions.
3. Attempt to change own role.
4. Attempt to edit owner permissions.

**Expected Result (Database & UI)**
- UI: explicit Arabic error for self-edit and owner-edit attempts.
- DB: self and owner records unchanged.

#### PER-006 Last owner protection
1. In office with one active owner, try to deactivate owner.
2. Try to downgrade owner role.
3. Add second owner, then retry.

**Expected Result (Database & UI)**
- UI: first attempts blocked, second allowed only when another owner exists.
- DB: office never ends with zero active owners.

#### PER-007 `has_permission` and RLS integrity
1. Remove `view_cases` from a member.
2. Call case list action or direct Supabase query as that member.
3. Regrant permission and retry.

**Expected Result (Database & UI)**
- UI: route access follows permission state immediately after refresh.
- DB: RLS denies rows when permission is missing.

### Edge Cases
- Permission toggles saved while member is active on target page.
- Role changed from admin to trainee while page is still open.
- Permissions JSON contains unknown keys.
- Owner bypass after permissions JSON emptied.

### Break Tests
- Inject `permissions` payload with all keys set true for self.
- Use stale session token after role downgrade.
- Rapidly toggle switches then save once.
- Send `updateMemberRoleAction` with unsupported role string.

### Security Tests
- Attempt cross-tenant permission update by changing `memberId`.
- Confirm RLS blocks raw table queries despite hidden UI.
- Verify audit logs page does not leak rows when `view_audit_logs` missing.
- Attempt to access `/admin` with tenant owner account lacking `is_admin`.

### Automation Suggestions
- Permission matrix test runner seeded by `PERMISSION_KEYS`.
- Replay suite for self-escalation and cross-tenant `memberId`.
- Visual regression for sidebar route visibility by role.

---

## Feature 8: Admin Dashboard

### Test Scenarios

#### ADM-001 Admin navigation and route integrity
1. Login as platform admin.
2. Open `/admin`, `/admin/offices`, `/admin/users`, `/admin/subscriptions`, `/admin/requests`, `/admin/payments`, `/admin/settings`.
3. Use desktop and mobile navigation.

**Expected Result (Database & UI)**
- UI: all routes load without 404, blank shells, or broken navigation.
- DB: read-only views do not mutate data.

#### ADM-002 Upgrade request workflow
1. As tenant owner, submit plan upgrade request.
2. As platform admin, approve it.
3. Confirm payment.
4. Refresh tenant subscription page and admin history.

**Expected Result (Database & UI)**
- UI: request moves `pending -> awaiting_payment -> completed`; tenant sees active updated plan.
- DB: `subscription_requests.status` transitions correctly, one `payments` confirmed row created, `office_subscriptions` updated.

#### ADM-003 Reject workflow from both open states
1. Reject request in `pending`.
2. Create second request and approve to `awaiting_payment`.
3. Reject again.

**Expected Result (Database & UI)**
- UI: rejected requests move to history.
- DB: request status becomes `rejected`; subscription remains unchanged.

#### ADM-004 Manual override modal validation
1. Open manual override for an office.
2. Change status, date, and plan.
3. Save valid data.
4. Retry with invalid date, invalid status, and enterprise plan.

**Expected Result (Database & UI)**
- UI: valid save succeeds; invalid save shows Arabic error; enterprise assignment blocked.
- DB: only valid changes update `office_subscriptions`.

#### ADM-005 Office and member suspension controls
1. Suspend an office.
2. Unsuspend it.
3. Disable a member.
4. Re-enable the member.

**Expected Result (Database & UI)**
- UI: badges and action buttons update immediately.
- DB: `offices.is_active` and `office_members.disabled_by_admin` reflect action; audit logs added for member actions.

#### ADM-006 Concurrent admin actions
1. Use two admin sessions.
2. Admin A approves request while Admin B rejects same request.
3. Admin A confirms payment while Admin B edits plan manually.

**Expected Result (Database & UI)**
- UI: only one final state persists; losing action surfaces a controlled error.
- DB: no duplicate payment, no conflicting final subscription state.

#### ADM-007 Force backfill overage
1. Create office already above plan limit but without unresolved overage record.
2. Click force backfill.
3. Refresh offices list.

**Expected Result (Database & UI)**
- UI: success toast with count; office flagged as overage.
- DB: one unresolved `office_member_overage` row inserted only for affected office.

### Edge Cases
- Admin list filters after rapid status changes.
- Member expand row with very large office member list.
- Office with missing owner profile or missing email.
- Manual override save while another admin updates same office.

### Break Tests
- Spam approve/reject/confirm buttons.
- Switch tabs during pending admin action.
- Open multiple override modals in separate tabs for same office.
- Toggle office active repeatedly and refresh mid-request.

### Security Tests
- Non-admin direct call to `admin.ts` actions.
- Confirm admin-only data is not present in client bundle for tenant users.
- Try enabling enterprise plan through tampered `plan_id`.
- Ensure admin user list and office list do not leak service-role secrets.

### Automation Suggestions
- Playwright admin happy-path and race-condition flows.
- Contract tests for state transition rules.
- DB assertions for payment uniqueness and overage row creation.

---

## Feature 9: Server Actions / Backend Logic

### Test Scenarios

#### ACT-001 Expired session replay
1. Capture a valid Server Action request for create/update.
2. Logout or expire session cookie.
3. Replay the exact request.

**Expected Result (Database & UI)**
- UI/API: request fails as unauthorized.
- DB: no row inserted or changed.

#### ACT-002 Zod validation tampering
1. Capture a create payload for client, task, session, and case.
2. Replace required fields with empty strings, invalid UUIDs, or invalid enums.
3. Replay each request.

**Expected Result (Database & UI)**
- UI/API: action returns Arabic validation error or controlled failure.
- DB: no invalid rows committed.

#### ACT-003 Unauthorized action call
1. Use user lacking module permission.
2. Replay mutation action directly without loading UI.

**Expected Result (Database & UI)**
- UI/API: request blocked by RLS or explicit permission logic.
- DB: target rows unchanged.

#### ACT-004 Locked-subscription mutation call
1. Put office in expired state.
2. Replay create case/client/task/session action directly.

**Expected Result (Database & UI)**
- UI/API: Arabic subscription error returned.
- DB: no mutation occurs.

#### ACT-005 Duplicate replay of non-idempotent actions
1. Replay `confirmRequestPaymentAction` twice quickly.
2. Replay `approveUpgradeRequestAction` twice.
3. Replay onboarding office create if feasible in isolated env.

**Expected Result (Database & UI)**
- UI/API: duplicates are blocked or fail safely.
- DB: no duplicate `payments`, no duplicate subscription completion, no partial onboarding data.

#### ACT-006 Payload mutation for admin actions
1. Replay admin manual override with invalid `status`, malformed `current_period_end`, random `plan_id`.
2. Replay member toggle and office toggle with malformed IDs.

**Expected Result (Database & UI)**
- UI/API: UUID/date/status validation blocks request.
- DB: records unchanged.

### Edge Cases
- Browser retry on flaky connection.
- Action payload from stale page after role removal.
- Action triggered twice by double submit.
- Concurrent mutation against same record.

### Break Tests
- Oversized JSON payload in notes and permissions.
- Unicode control characters in strings.
- Replay action after CSRF token or action hash rotates.
- Batch many action requests in short burst.

### Security Tests
- Inspect request body for hidden mutable fields not enforced server-side.
- Try action replay from another browser origin/session.
- Confirm admin actions always require `requireAdmin()`.
- Verify no client-side import path can expose `createAdminClient()`.

### Automation Suggestions
- HAR-based replay tests for each mutation family.
- Negative test suite feeding invalid Zod payloads.
- Database-level assertion for no side effects after failed replays.

---

## Feature 10: UI / UX / RTL Arabic

### Test Scenarios

#### UI-001 Global RTL correctness
1. Open dashboard, cases, sessions, tasks, team, subscription, admin.
2. Verify drawer, dialogs, tabs, tables, calendars, dropdowns, and badges.

**Expected Result (Database & UI)**
- UI: layout flows RTL, icons and paddings align correctly, no mixed LTR layout except intended numeric/date fields.
- DB: no effect.

#### UI-002 Arabic overflow and truncation
1. Seed very long Arabic names for office, client, case, and user.
2. Open tables, cards, sidebar, and dialogs.

**Expected Result (Database & UI)**
- UI: no overlap, clipped buttons, or broken columns; ellipsis or wrapping is readable.
- DB: stored text intact.

#### UI-003 Responsive behavior
1. Test mobile width, tablet width, and desktop.
2. Open sidebar, topbar, dialogs, calendar, and kanban board.
3. Scroll horizontally and vertically where needed.

**Expected Result (Database & UI)**
- UI: mobile nav opens from correct side, dialogs fit viewport, kanban remains usable, no hidden primary actions.
- DB: no effect.

#### UI-004 Loading and double-click states
1. Open create dialogs for client, case, task, session.
2. Click save twice quickly.
3. Repeat in admin actions.

**Expected Result (Database & UI)**
- UI: loading text appears, second click prevented or harmless.
- DB: one committed mutation only.

#### UI-005 Error messages and toast consistency
1. Trigger validation error, permission error, subscription lock, and server failure.
2. Observe inline messages and toasts.

**Expected Result (Database & UI)**
- UI: all user-facing messages are Arabic, actionable, and not raw stack traces.
- DB: no side effects for failed operations.

#### UI-006 Font loading and visual fallback
1. Load app with normal network.
2. Simulate slow or blocked font load.
3. Verify IBM Plex Sans Arabic usage and fallback readability.

**Expected Result (Database & UI)**
- UI: Arabic remains legible without severe layout shift.
- DB: no effect.

### Edge Cases
- Mixed Arabic + English + numbers in titles.
- Date/time inputs in RTL context.
- Dark admin theme versus light dashboard theme.
- Very small mobile devices with browser zoom.

### Break Tests
- Open multiple dialogs back-to-back.
- Resize window during drag-and-drop.
- Open long tables with browser text size increased.
- Toggle sidebar collapse repeatedly.

### Security Tests
- Ensure locked overlay does not leave active focusable destructive controls behind it.
- Ensure hidden routes are not accessible through visible mobile nav glitches.
- Ensure admin dark theme does not accidentally reveal tenant navigation.
- Validate no secret IDs or raw errors are rendered in toast text.

### Automation Suggestions
- Playwright viewport matrix with screenshots.
- Visual regression for RTL layouts and long Arabic strings.
- Accessibility smoke checks for focus trapping inside dialogs and overlays.

---

## Feature 11: Data Integrity & Transactions

### Test Scenarios

#### DAT-001 Atomic office onboarding
1. Register new user.
2. Create office via `/setup`.
3. Verify redirect to dashboard.
4. Query DB for office, owner membership, subscription, audit log.

**Expected Result (Database & UI)**
- UI: onboarding succeeds or fails as one unit.
- DB: exactly one office, one owner membership, one subscription, one audit log; no orphan records.

#### DAT-002 Invitation redemption atomicity
1. Generate invite code.
2. Redeem with new user.
3. Retry same code.
4. Retry expired code.

**Expected Result (Database & UI)**
- UI: first redemption succeeds, reused or expired codes fail cleanly.
- DB: one membership added once, invite consumed or invalidated correctly.

#### DAT-003 Office deletion or destructive DB operation with active users
1. In staging DB/admin console, attempt office deletion with active members and related data.
2. Observe FK behavior and orphan risk.

**Expected Result (Database & UI)**
- UI/API: destructive path is either unavailable or explicitly blocked.
- DB: no orphan rows remain in subscriptions, members, cases, tasks, sessions, notifications, or logs.

#### DAT-004 Partial failure during payment confirmation
1. Force failure after payment insert but before subscription update if possible in isolated environment.
2. Retry payment confirmation.

**Expected Result (Database & UI)**
- UI/API: failure is explicit.
- DB: no inconsistent state such as confirmed payment with old subscription or duplicated completion.

#### DAT-005 Referential integrity across modules
1. Create client, case linked to client, session linked to case, task linked to case.
2. Attempt destructive deletes in dependency-breaking order.

**Expected Result (Database & UI)**
- UI/API: deletes respect FK rules.
- DB: no broken foreign keys, child behavior matches migration design.

#### DAT-006 Audit and notification consistency
1. Toggle member status, resolve overage, downgrade plan, and reactivate member.
2. Check audit logs and notifications.

**Expected Result (Database & UI)**
- UI: logs page and notifications reflect actions after refresh.
- DB: expected `audit_logs` and `notifications` rows exist once each.

### Edge Cases
- Revalidate path after failed mutation.
- Transaction retries after network interruption.
- Office with no owner email during overage mail send.
- Duplicate unresolved overage insert attempts.

### Break Tests
- Interrupt browser during onboarding.
- Run parallel invite redemption for same code.
- Confirm payment twice under network retry.
- Manual DB edits to create stale foreign references, then open UI.

### Security Tests
- Verify atomic RPCs do not allow partial privilege escalation.
- Verify audit logs are not writable by regular tenants outside allowed actions.
- Ensure notifications remain user-scoped.
- Confirm service-role based operations do not leak data to client responses.

### Automation Suggestions
- SQL fixtures to assert transactional completeness.
- Replay tests for invite redemption single-use guarantee.
- Integrity queries for orphan detection after destructive test set.

---

## Feature 12: Cross-Feature Edge Cases

### Test Scenarios

#### EDG-001 Subscription expires mid-action
1. Open create case dialog while subscription still valid.
2. Expire subscription from admin before submit.
3. Submit form.

**Expected Result (Database & UI)**
- UI/API: save blocked with subscription error.
- DB: no new row created.

#### EDG-002 Admin suspends office during active usage
1. Keep Office A user active on tasks page.
2. Suspend office from admin.
3. Refresh active tenant tab and attempt mutation.

**Expected Result (Database & UI)**
- UI: office lock appears on next server round-trip or refresh.
- DB: new mutations blocked after suspension.

#### EDG-003 Concurrent edit conflict
1. Open same case or task in two browsers.
2. Save different edits from both.

**Expected Result (Database & UI)**
- UI: last write wins unless app blocks it; no broken JSON or duplicate records.
- DB: one final consistent row version.

#### EDG-004 Last owner degraded while second owner disabled
1. Have two owners, disable one.
2. Attempt to demote or disable remaining active owner.

**Expected Result (Database & UI)**
- UI: action blocked.
- DB: at least one active owner remains.

#### EDG-005 Grace-period date boundaries
1. Set `current_period_end` exactly now, now minus 3 days, and now minus 3 days plus 1 minute.
2. Check lock behavior each time.

**Expected Result (Database & UI)**
- UI: behavior changes exactly at boundary intended by business rule.
- DB: no unintended status mutation required for guard result.

#### EDG-006 No subscription row
1. Remove or hide office subscription in staging.
2. Login as office user.

**Expected Result (Database & UI)**
- UI: lock or setup error shown, no infinite loading.
- DB: no new fallback subscription created accidentally.

### Edge Cases
- Stale browser cache after role or status change.
- Notification badge showing unread state after mass read.
- Team page in remediation mode with max users `1`.
- Office with mixed active/inactive members and pending invites.

### Break Tests
- Use multiple tabs across cases, tasks, team, subscription during admin changes.
- System clock skew between client devices.
- Refresh during `router.refresh()`-driven updates.
- Submit outdated dialog after record deletion.

### Security Tests
- Ensure mid-session privilege reduction takes effect after refresh.
- Ensure cached UI cannot commit hidden actions after role removal.
- Validate no stale HTML contains data user no longer can view.
- Test lock transitions do not reveal cross-route content flashes.

### Automation Suggestions
- Parallel browser session suite for admin-vs-tenant conflicts.
- Time-boundary tests with seeded timestamps.
- Race-condition harness for duplicate edits and deletes.

---

## Feature 13: Platform Security & Tenant Isolation

### Test Scenarios

#### SEC-001 Cross-tenant CRUD tampering
1. Login as Office A user.
2. Capture IDs for Office B client, case, session, task, member.
3. Replay read/update/delete actions using Office B IDs.

**Expected Result (Database & UI)**
- UI/API: all requests fail or return no rows.
- DB: Office B data unchanged; no leakage in error payload.

#### SEC-002 Hidden endpoint and route probing
1. As tenant user, browse `/admin`, `/admin/offices`, `/api/*`, and action routes discovered in DevTools.
2. Replay admin actions directly.

**Expected Result (Database & UI)**
- UI/API: redirect or forbidden behavior only.
- DB: no admin mutation executed.

#### SEC-003 Invitation abuse
1. Brute-force invalid invite codes.
2. Reuse redeemed code.
3. Use expired code.
4. Redeem code while office is over limit.

**Expected Result (Database & UI)**
- UI/API: only valid, unexpired, allowed redemption succeeds.
- DB: no duplicate membership, no over-cap activation bypass.

#### SEC-004 Data leakage through joins and logs
1. As Office A, inspect cases joined to clients, sessions joined to cases, tasks joined to profiles, logs, notifications.
2. Search for Office B known names.

**Expected Result (Database & UI)**
- UI/API: no Office B data appears.
- DB: RLS restricts all join sources correctly.

#### SEC-005 Service-role boundary
1. Inspect browser bundle and network requests.
2. Search for `SUPABASE_SERVICE_ROLE_KEY`, admin client usage, or server-only secrets.

**Expected Result (Database & UI)**
- UI/API: no service-role secret or admin-only client usage exposed client-side.
- DB: no effect.

#### SEC-006 Offensive permission escalation
1. As user with some team permissions, tamper request to set role `owner`.
2. Tamper permissions JSON to add `manage_permissions`, `view_billing`, and delete permissions.
3. Retry actions after tampering.

**Expected Result (Database & UI)**
- UI/API: escalation blocked cleanly.
- DB: attacker record unchanged.

### Edge Cases
- Admin and tenant account on same email identity.
- Inactive member with still-valid session token.
- Suspended office with existing pending upgrade request.
- Office overage plus expired subscription at same time.

### Break Tests
- Enumerate UUIDs from browser logs and retry across tenants.
- Run high-frequency request burst against invite redemption and action endpoints.
- Attempt role escalation after owner demotion race.
- Force raw status variants `canceled` vs `cancelled`.

### Security Tests
- RLS policy validation on every tenant table.
- `has_permission` owner bypass verification and non-owner denial verification.
- Session invalidation after `disabled_by_admin`.
- Cross-tenant leakage in admin-created notifications.

### Automation Suggestions
- Supabase RLS regression queries per table and action.
- HAR replay attack suite.
- Static scan ensuring `admin.ts` never enters client bundle.

---

## OFFENSIVE TESTING SCENARIOS

### OFF-001 Subscription bypass attacker
1. Login as expired office user.
2. Open browser devtools and capture a valid mutation action from another valid session.
3. Replay against expired office with modified cookies or stale session.
4. Retry from routes hidden behind lock screen.

**Goal**
- Prove expired users cannot mutate cases, tasks, sessions, clients, team, or settings through direct action replay.

### OFF-002 Cross-tenant UUID hunter
1. Collect UUIDs exposed in page HTML, network responses, and tables.
2. Swap them into create/update/delete payloads for all modules.
3. Attempt raw Supabase client calls from browser console if session exists.

**Goal**
- Prove RLS blocks cross-office reads and writes even when attacker knows exact UUIDs.

### OFF-003 Role escalation attacker
1. Use account with `manage_team` only.
2. Intercept permission and role update payloads.
3. Replace `memberId` with own ID or owner ID.
4. Add sovereign permissions and retry.

**Goal**
- Prove self-escalation and owner tampering are impossible.

### OFF-004 Admin panel intruder
1. Use tenant owner account.
2. Browse all `/admin/*` routes manually.
3. Replay `approveUpgradeRequestAction`, `confirmRequestPaymentAction`, `toggleOfficeActiveAction`, and `updateSubscriptionDirectlyAction`.

**Goal**
- Prove `profiles.is_admin` is the only valid gate and all admin mutations reject tenant users.

### OFF-005 Invite-code abuser
1. Script repeated invite code guesses.
2. Reuse redeemed code.
3. Redeem valid code after office reaches seat limit.
4. Redeem code from suspended or overage-locked office.

**Goal**
- Prove invitation flow cannot be brute-forced into unauthorized membership or seat-cap bypass.

### OFF-006 Payment workflow manipulator
1. Intercept pending request IDs.
2. Confirm payment twice.
3. Confirm payment for `pending` request without approval.
4. Reject and confirm same request simultaneously from two admins.

**Goal**
- Prove no duplicate payment rows or invalid subscription state transitions occur.

### OFF-007 Hidden data extractor
1. While locked by subscription or permissions, inspect page source, React props, preloaded JSON, and network payloads.
2. Search for cases, clients, payments, logs, and owner details.

**Goal**
- Prove unauthorized users are blocked server-side and private data is not merely hidden visually.

### OFF-008 Service-role seeker
1. Scan built JS chunks, source maps if present, env leaks, and network headers.
2. Search for service-role usage, admin endpoints, or Resend credentials.

**Goal**
- Prove server-only secrets never ship to the browser.

---

# Execution Checklist

## Phase 1: Core Functionality (Must Pass 100%)

| ID | Priority | Blocker | Test | Status | Notes |
|---|---|---|---|---|---|
| CAS-001 | Critical | Yes | Create case linked to valid client and lawyer | Pending | |
| CAS-002 | High | Yes | Edit case and persist new client/status/priority | Pending | |
| CAS-003 | High | Yes | Search case within tenant and confirm no cross-tenant visibility | Pending | |
| CLI-001 | Critical | Yes | Create valid client | Pending | |
| CLI-004 | High | Yes | Block deleting client referenced by case | Pending | |
| SES-001 | Critical | Yes | Create session from list view | Pending | |
| SES-002 | Medium | No | Validate calendar colors and open edit dialog | Pending | |
| TSK-001 | Critical | Yes | Create task with assignee and linked case | Pending | |
| TSK-002 | High | Yes | Drag task between columns and persist mapped status | Pending | |
| SUB-001 | Critical | Yes | Active subscription allows full dashboard usage | Pending | |
| SUB-002 | Critical | Yes | `past_due` within 3-day grace remains usable with warning banner | Pending | |
| SUB-003 | Critical | Yes | Expired office is locked and blocked from mutations | Pending | |
| OVG-001 | Critical | Yes | Reach exact member limit and block extra seat | Pending | |
| OVG-003 | Critical | Yes | Downgrade below member count creates unresolved overage | Pending | |
| OVG-004 | Critical | Yes | Overage expiry enters remediation-only mode | Pending | |
| ADM-001 | High | Yes | Admin navigation loads all routes without 404 or dead shell | Pending | |
| ADM-002 | Critical | Yes | Upgrade request workflow `pending -> awaiting_payment -> completed` | Pending | |
| DAT-001 | Critical | Yes | Atomic office onboarding creates complete record set | Pending | |
| DAT-002 | Critical | Yes | Invitation redemption is single-use and atomic | Pending | |

## Phase 2: Permissions & Security

| ID | Priority | Blocker | Test | Status | Notes |
|---|---|---|---|---|---|
| CAS-004 | Critical | Yes | Delete case allowed only with delete permission | Pending | |
| CAS-005 | Critical | Yes | Reject foreign client or assignee in case payload | Pending | |
| SES-004 | Critical | Yes | Reject foreign case when creating session | Pending | |
| SES-005 | High | Yes | Delete session permission enforcement | Pending | |
| TSK-004 | Critical | Yes | Reject invalid assignee or foreign case in task payload | Pending | |
| TSK-005 | High | Yes | Task delete permission enforcement | Pending | |
| CLI-005 | Medium | No | Client invalid email validation | Pending | |
| PER-001 | High | Yes | Sidebar visibility matches role and permissions | Pending | |
| PER-002 | Critical | Yes | Hidden route direct URL access redirects or blocks | Pending | |
| PER-003 | Critical | Yes | CRUD permission enforcement across modules | Pending | |
| PER-004 | High | Yes | `manage_team` and `manage_permissions` separation | Pending | |
| PER-005 | Critical | Yes | Self-escalation and owner permission edit blocked | Pending | |
| PER-006 | Critical | Yes | Last owner cannot be removed or downgraded improperly | Pending | |
| PER-007 | Critical | Yes | `has_permission` and RLS deny unauthorized reads | Pending | |
| SUB-004 | Critical | Yes | `cancelled` state blocks tenant access consistently | Pending | |
| SUB-005 | High | Yes | `pending` and `awaiting_payment` block duplicate upgrade requests | Pending | |
| SUB-007 | Critical | Yes | Office suspension and member disable produce correct lock reasons | Pending | |
| ACT-001 | Critical | Yes | Expired session replay fails without side effects | Pending | |
| ACT-002 | Critical | Yes | Zod payload tampering does not commit invalid data | Pending | |
| ACT-003 | Critical | Yes | Unauthorized direct Server Action call is denied | Pending | |
| ACT-004 | Critical | Yes | Locked subscription cannot mutate through direct action call | Pending | |
| ACT-006 | High | Yes | Admin action payload validation rejects bad IDs and statuses | Pending | |
| SEC-001 | Critical | Yes | Cross-tenant CRUD tampering blocked by RLS | Pending | |
| SEC-002 | Critical | Yes | Hidden admin routes and actions reject tenant users | Pending | |
| SEC-003 | Critical | Yes | Invite abuse does not bypass expiry, single-use, or seat cap | Pending | |
| SEC-004 | Critical | Yes | Joined data and logs do not leak across offices | Pending | |
| SEC-005 | Critical | Yes | Service-role secrets absent from browser bundle | Pending | |
| SEC-006 | Critical | Yes | Offensive permission escalation attempts fail | Pending | |
| OFF-001 | Critical | Yes | Offensive subscription bypass attempt | Pending | |
| OFF-002 | Critical | Yes | Offensive cross-tenant UUID tampering attempt | Pending | |
| OFF-003 | Critical | Yes | Offensive role escalation attempt | Pending | |
| OFF-004 | Critical | Yes | Offensive admin action intrusion attempt | Pending | |
| OFF-005 | High | Yes | Offensive invite-code abuse attempt | Pending | |
| OFF-007 | Critical | Yes | Offensive hidden-data extraction attempt under lock | Pending | |
| OFF-008 | Critical | Yes | Offensive service-role leak attempt | Pending | |

## Phase 3: Edge Cases & Stress Tests

| ID | Priority | Blocker | Test | Status | Notes |
|---|---|---|---|---|---|
| CLI-003 | Medium | No | Duplicate client handling remains explicit and stable | Pending | |
| SES-003 | High | No | Session date/time move persists across list and calendar | Pending | |
| TSK-003 | Medium | No | Reorder within column does not corrupt task data | Pending | |
| SUB-006 | Critical | Yes | Rapid admin subscription state changes stay consistent | Pending | |
| OVG-005 | Critical | Yes | Resolve overage by deactivating extra member | Pending | |
| OVG-006 | Critical | Yes | Concurrent member additions do not exceed plan cap | Pending | |
| ADM-003 | High | Yes | Reject request cleanly from `pending` and `awaiting_payment` | Pending | |
| ADM-004 | High | Yes | Manual override rejects invalid date/status/enterprise plan | Pending | |
| ADM-005 | High | Yes | Office and member suspension controls remain consistent | Pending | |
| ADM-006 | Critical | Yes | Concurrent admin actions do not create conflicting final state | Pending | |
| ADM-007 | High | No | Force backfill overage inserts only missing unresolved rows | Pending | |
| ACT-005 | Critical | Yes | Duplicate replay of non-idempotent actions does not duplicate payments or onboarding data | Pending | |
| DAT-003 | Critical | Yes | Destructive office deletion path does not orphan data | Pending | |
| DAT-004 | Critical | Yes | Partial payment confirmation failure does not corrupt billing state | Pending | |
| DAT-005 | Critical | Yes | Referential integrity across clients/cases/sessions/tasks holds under deletes | Pending | |
| DAT-006 | High | No | Audit logs and notifications are consistent after admin/team changes | Pending | |
| EDG-001 | Critical | Yes | Subscription expiry mid-action blocks commit | Pending | |
| EDG-002 | Critical | Yes | Admin suspends office during active tenant usage | Pending | |
| EDG-003 | High | No | Concurrent edit conflict ends with one consistent row state | Pending | |
| EDG-004 | Critical | Yes | Last active owner cannot disappear through mixed owner states | Pending | |
| EDG-005 | Critical | Yes | Grace-period date boundaries behave exactly at cutoff | Pending | |
| EDG-006 | High | Yes | Missing subscription row locks safely without infinite loop | Pending | |
| OFF-006 | Critical | Yes | Offensive payment workflow manipulation attempt | Pending | |

## Phase 4: UI / UX Polish

| ID | Priority | Blocker | Test | Status | Notes |
|---|---|---|---|---|---|
| UI-001 | High | Yes | Global RTL correctness across tenant and admin interfaces | Pending | |
| UI-002 | High | No | Arabic overflow and truncation remain readable | Pending | |
| UI-003 | High | Yes | Responsive behavior on mobile, tablet, and desktop | Pending | |
| UI-004 | High | Yes | Loading and double-click states prevent duplicate mutations | Pending | |
| UI-005 | High | Yes | Error messages and toasts stay Arabic and user-safe | Pending | |
| UI-006 | Medium | No | IBM Plex Sans Arabic loading and fallback readability | Pending | |

---

## Blocker Tests

- Any failure in cross-tenant isolation, role escalation prevention, admin-only gating, subscription lock enforcement, duplicate payment prevention, onboarding atomicity, overage lock/remediation, or missing-owner protection is a launch blocker.
- Any failure where locked or unauthorized users can mutate data is a launch blocker.
- Any failure where tenant data from Office A is visible to Office B is a launch blocker.
- Any failure where plan seat limit can be bypassed through race conditions, direct action replay, or invitation abuse is a launch blocker.
- Any failure where payment confirmation creates inconsistent billing state is a launch blocker.
---

## Feature 11: Email Notification System (Resend + React Email)

### Test Scenarios

#### EML-001 Team Invitation Dispatch
1. Login as Office Owner.
2. Navigate to Team page and generate an invitation.
3. Provide a valid email address.
4. Save.

**Expected Result (Database & UI)**
- UI: success toast confirms invitation created and email sent.
- DB: `invitations` row created with the `email` field populated.
- Inbox: RTL Arabic email received with office name, inviter name, and correct registration link.

#### EML-002 Admin Notification: Upgrade Request
1. As Office Owner, request a plan upgrade.
2. Check the mailbox of the Admin Email (defined in `CONFIG`).

**Expected Result (Database & UI)**
- UI: success toast in tenant dashboard.
- Inbox: Admin receives a notification with requester details and target plan name.

#### EML-003 Subscription Status: Approved (Payment Instructions)
1. As Platform Admin, approve a pending upgrade request.
2. Check the Office Owner's email.

**Expected Result (Database & UI)**
- UI: request moves to "Awaiting Payment" in admin panel.
- Inbox: Owner receives an email with the status "Approved" and clear payment instructions (IBAN, PalPay, Reflect placeholders).

#### EML-004 Subscription Status: Rejected (Admin Notes)
1. As Platform Admin, reject a pending upgrade request.
2. Provide a specific reason in the "Admin Note" field.
3. Check the Office Owner's email.

**Expected Result (Database & UI)**
- UI: request moves to "Rejected" in admin panel history.
- Inbox: Owner receives a rejection email clearly displaying the "Admin Note" provided by the admin.

#### EML-005 Subscription Activation: Welcome to New Plan
1. As Platform Admin, confirm payment for an "Awaiting Payment" request.
2. Check the Office Owner's email.

**Expected Result (Database & UI)**
- UI: subscription becomes `active`, request completed.
- Inbox: Owner receives a "Plan Activated" email with the plan name and the correct expiry date.

#### EML-006 Overage Warning Dispatch
1. As Platform Admin, downgrade an office so it exceeds seat limits.
2. Check the Office Owner's email.

**Expected Result (Database & UI)**
- UI: office flagged for overage in admin panel.
- Inbox: Owner receives a warning email explaining the seat limit violation and the 7-day grace period.

### RTL & Brand Standards
- All emails MUST be aligned Right-to-Left.
- Shared `EmailFooter` MUST appear in all transactional emails with working (placeholder) links.
- Font: IBM Plex Sans Arabic (or fallback sans-serif) must render clearly in major email clients (Gmail, Outlook).

### Safety & Error Handling
- Fail dispatch by providing an invalid email address (e.g., `invalid-email`).
- Verify that the database transaction (e.g., creating the invitation) STILL SUCCEEDS despite the email failure (`sendEmailSafe` pattern).

### Automation Suggestions
- Integration tests using Mailtrap or Resend Test mode to verify payload delivery.
- Snapshot tests for React Email components to prevent RTL layout regressions.
