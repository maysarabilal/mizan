# Mizan Server Actions & API Specification

This document details all server actions for the application mutations and any necessary API routes as defined by the MVP spec.
**Note:** All mutations below use Next.js Server Actions unless otherwise specified as API Routes (e.g. webhooks).

## General Action Response
All Server Actions return a discriminated union:
`{ data: T; error: null } | { data: null; error: string }`

---

## 1. Authentication & Onboarding Actions

### `signIn`
- **Type:** Server Action
- **Input:** `z.object({ email: z.string().email(), password: z.string() })`
- **Output:** `{ data: { user: User, redirect: string }; error: string | null }`
- **Auth:** Public
- **Authz:** None
- **Errors:** "البريد الإلكتروني أو كلمة المرور غير صحيحة" (401 mapping)

### `signUp`
- **Type:** Server Action
- **Input:** `z.object({ email: z.string().email(), password: z.string().min(8), full_name: z.string() })`
- **Output:** `{ data: { user: User }; error: string | null }`
- **Auth:** Public
- **Authz:** None
- **Errors:** "هذا البريد مستخدم مسبقاً"

### `createOfficeWithTrial`
- **Type:** Server Action
- **Input:** `z.object({ office_name: z.string() })`
- **Output:** `{ data: { office_id: string }; error: string | null }`
- **Auth:** Required
- **Authz:** Only users currently without an active `office_members` record.
- **Errors:** "أنت منضم لمكتب بالفعل"

### `joinOfficeWithCode`
- **Type:** Server Action
- **Input:** `z.object({ invite_code: z.string() })`
- **Output:** `{ data: { office_id: string }; error: string | null }`
- **Auth:** Required
- **Authz:** Only users currently without an active `office_members` record.
- **Errors:** "رمز الدعوة غير صالح أو منتهي الصلاحية"

---

## 2. Client Management

### `createClient`
- **Type:** Server Action
- **Input:** `ClientSchema` (name, phone, email, notes)
- **Output:** `{ data: Client; error: null }`
- **Auth:** Required
- **Authz:** Any active office member.
- **Errors:** Standard validation.

### `updateClient` / `deleteClient`
- **Type:** Server Action
- **Input:** `UpdateClientSchema` / `DeleteEntitySchema(id)`
- **Output:** `{ data: Client | null; error: string | null }`
- **Auth:** Required
- **Authz:** `updateClient`: Any active office member. `deleteClient`: Owner only.

---

## 3. Case Management

### `createCase`
- **Type:** Server Action
- **Input:** `CaseSchema` (title, client_id, case_type, status, priority, etc.)
- **Output:** `{ data: Case; error: null }`
- **Auth:** Required
- **Authz:** Any active office member.
- **Errors:** "يجب اختيار العميل"

### `updateCase` / `closeCase`
- **Type:** Server Action
- **Input:** `UpdateCaseSchema` / `CloseCaseSchema(id)`
- **Output:** `{ data: Case; error: null }`
- **Auth:** Required
- **Authz:** Any active office member.
- **Errors:** Standard errors or "لا تملك صلاحية لإلغاء القضية".

---

## 4. Session Scheduling

### `createSession`
- **Type:** Server Action
- **Input:** `SessionSchema` (case_id, session_date, time, court, etc.)
- **Output:** `{ data: Session; error: null }`
- **Auth:** Required
- **Authz:** Any active office member.

### `updateSession` / `deleteSession`
- **Type:** Server Action
- **Input:** `UpdateSessionSchema` / `DeleteEntitySchema(id)`
- **Output:** `{ data: Session | null; error: null }`
- **Auth:** Required
- **Authz:** Any active office member for update. Owner/Lawyer only for delete.

---

## 5. Task Management

### `createTask`
- **Type:** Server Action
- **Input:** `TaskSchema` (title, description, status, due_date, assigned_to_user_id)
- **Output:** `{ data: Task; error: null }`
- **Auth:** Required
- **Authz:** Any active office member.

### `updateTaskStatus`
- **Type:** Server Action
- **Input:** `z.object({ task_id: string, new_status: TaskStatusEnum })`
- **Output:** `{ data: Task; error: null }`
- **Auth:** Required
- **Authz:** Any active office member.

### `deleteTask`
- **Type:** Server Action
- **Input:** `DeleteEntitySchema(id)`
- **Output:** `{ data: null; error: null }`
- **Auth:** Required
- **Authz:** Owner only.

---

## 6. Team & Subscriptions

### `generateInviteCode`
- **Type:** Server Action
- **Input:** `z.object({ role: RoleEnum })`
- **Output:** `{ data: { invite_code: string }; error: null }`
- **Auth:** Required
- **Authz:** Owner only. Checks plan limits before allowing generation.
- **Errors:** "ترقية الخطة مطلوبة" (Plan Limit Reached)

### `updateMemberRole` / `removeMember`
- **Type:** Server Action
- **Input:** `UpdateRoleSchema` / `DeleteEntitySchema(member_id)`
- **Output:** `{ data: any; error: null }`
- **Auth:** Required
- **Authz:** Owner only.

### `requestSubscriptionUpgrade`
- **Type:** Server Action
- **Input:** `z.object({ requested_plan_id: string })`
- **Output:** `{ data: { success: boolean }; error: null }`
- **Auth:** Required
- **Authz:** Owner only.

---

## 7. Admin API Routes / Actions

### `adminApproveSubscription`
- **Type:** Server Action
- **Input:** `z.object({ request_id: string, action: 'approve' | 'reject', admin_note?: string })`
- **Output:** `{ data: { success: boolean }; error: null }`
- **Auth:** Required
- **Authz:** `is_admin` strictly true. Uses `admin` service role client.

### `adminSuspendOffice`
- **Type:** Server Action
- **Input:** `z.object({ office_id: string })`
- **Output:** `{ data: { success: boolean }; error: null }`
- **Auth:** Required
- **Authz:** `is_admin` strictly true.

---

*Note: Data fetching operations (`getCases`, `getClients`, etc.) will primarily use Supabase JS Client directly inside React Server Components or via React Query within Client Components, authenticated via middleware-managed cookies. Server actions listed here are specifically for Mutations.*
