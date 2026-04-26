# 🧪 Mizan Quality Assurance & Testing Scenarios

This document serves as the master test plan for the Mizan SaaS. Every UI-facing or Admin-impacting architectural change MUST have a defined test scenario here.
Agents must update this file whenever a new feature is deployed.

---

## 📅 Active Scenarios

### 1. Atomic Onboarding Integrity (DB Transactions)
- **Severity & Priority:** Critical / P1
- **Logic:** Registration uses a PostgreSQL RPC (`create_office_transaction`) to ensure atomicity. If a step fails, the entire transaction rolls back.
- **Steps:**
  1. Access the Next.js UI `/setup` route.
  2. Attempt to register a new law office using valid data.
- **Expected Outcome:** 
  - The office is successfully created.
  - You are redirected to `/dashboard`.
  - In Supabase, 4 records are generated simultaneously: `offices`, `office_members` (as owner), `office_subscriptions` (trialing status), and `audit_logs`.

### 2. Subscription Overage Lockout
- **Severity & Priority:** High / P2
- **Logic:** Upgrading/Downgrading a plan checks if active members exceed the new plan limit. If true, a 7-day grace period is initiated.
- **Steps:**
  1. Go to Admin Panel `/admin/offices`.
  2. Change a test office's plan to a lower tier that supports fewer users than currently exist in that office.
  3. Login as the owner of that office.
- **Expected Outcome:**
  - Owner receives an overage notification in UI.
  - If the 7-day grace period has technically expired (manipulate timestamp in DB to test), the `SubscriptionGuard` will lock the dashboard routing exclusively to the Billing/Team adjustment screens.

### 3. Welcome Email Trigger (Resend Integration)
- **Severity & Priority:** Medium / P2
- **Logic:** After `create_office_transaction` successfully commits, Next.js renders the React Email `WelcomeEmail.tsx` and dispatches it via Resend to the authenticated user's email.
- **Steps:**
  1. Ensure `RESEND_API_KEY` is configured in `.env.local`.
  2. Register a new law office via `/setup` using an email address you have access to (or track it via `onboarding@resend.dev` in Resend logs).
  3. Verify the office is created successfully and you are redirected to `/dashboard`.
- **Expected Outcome:**
  - A welcome email formatted in RTL Arabic arrives in the inbox.
  - The email correctly displays the dynamically inserted Office Name and Trial Duration.
  - The Resend Dashboard / API Log shows a `200 OK` Sent event.

### 4. Overage Warning Email Trigger (Resend Integration)
- **Severity & Priority:** High / P2
- **Logic:** When an admin forcibly downgrades a subscription via `admin.ts`, the system detects an overage, applies DB records, and simultaneously fetches the owner's email via Auth Admin API to send a warning.
- **Steps:**
  1. Login as Platform Admin and go to `/admin/offices`.
  2. Select an office that has 3 active members.
  3. Downgrade their subscription to an "Individual" plan (Limit: 1 user).
  4. Wait for the success toast.
- **Expected Outcome:**
  - An Overage violation record is created in the DB.
  - The Office Owner receives an email titled "تنبيه تجاوز الحد الأقصى لأعضاء مكتبك" instantly.
  - The email correctly states current users (3) vs maximum allowed (1).

### 5. Team Invitation Email Flow
- **Severity & Priority:** High / P2
- **Logic:** `generateInviteCodeAction` in `team.ts` saves the target email to the `invitations` table and dispatches an invitation email with a personalized registration link.
- **Steps:**
  1. Login as Office Owner, go to Team settings.
  2. Generate a new invite code and provide an email address you can access.
- **Expected Outcome:**
  - Invitation record in DB contains the email.
  - Recipient receives an email titled "دعوة للانضمام إلى [اسم المكتب]".
  - The email contains a link format: `https://mizan-app.com/register?invite=CODE`.
  - Layout is correctly RTL with the shared brand footer.

### 6. Admin Notification: Upgrade Request
- **Severity & Priority:** Medium / P3
- **Logic:** `requestPlanUpgradeAction` in `subscriptions.ts` sends an email to the site admin (defined in `config.ts`) when a tenant requests a plan change.
- **Steps:**
  1. Login as Office Owner, go to Subscription page.
  2. Request an upgrade to a higher tier.
- **Expected Outcome:**
  - Admin receives an email titled "طلب ترقية جديد من مكتب [اسم المكتب]".
  - Email contains requester name, office name, and requested plan.

### 7. Subscription Approval/Rejection Cycle
- **Severity & Priority:** High / P2
- **Logic:** Admin actions in `admin.ts` trigger `SubscriptionStatusEmail` with dynamic content based on whether the request was approved (showing payment instructions) or rejected (showing admin notes).
- **Steps:**
  1. As Admin, navigate to Subscription Requests.
  2. Approve a request → check owner inbox for payment instructions email.
  3. Reject a request with a reason → check owner inbox for rejection email with notes.
- **Expected Outcome:**
  - Approval email includes IBAN/PalPay/Reflect placeholders.
  - Rejection email includes the `admin_note` provided during rejection.

### 8. Subscription Activation Post-Payment
- **Severity & Priority:** High / P2
- **Logic:** When an admin confirms payment for a request, `confirmRequestPaymentAction` triggers a welcome email for the new plan activation.
- **Steps:**
  1. As Admin, confirm a payment for an "Awaiting Payment" request.
- **Expected Outcome:**
  - Owner receives an email titled "تم تفعيل اشتراك مكتب [اسم المكتب] بنجاح".
  - Email displays the plan name and the calculated expiry date.

---

## 🛠 Testing Template
*(For future Agent use when appending new tests)*

```markdown
### [Scenario Name]
- **Severity & Priority:** [Critical/High/Medium/Low] / [P1/P2/P3]
- **Logic:** [Briefly explain the backend/frontend logic]
- **Steps:**
  1. [Step 1]
  2. [Step 2]
- **Expected Outcome:** [Exact visual or database outcome]
```
