# Architecture

## System Overview

Mizan is a multi-tenant SaaS platform. Each tenant is an **Office**. Data isolation is enforced at the database level via PostgreSQL Row-Level Security (RLS).

```
Browser (Arabic RTL)
  ↓ HTTPS
Next.js 16 (App Router)
  ├── Server Components → fetch data
  ├── Server Actions    → mutate data
  └── Client Components → interactive UI
  ↓ Supabase JS SDK
Supabase
  ├── Auth (email/password, session cookies)
  ├── PostgreSQL 15 (14 tables, RLS on all)
  └── RPC Functions (current_office_id, has_role, etc.)
```

## Route Groups

| Group | URL Prefix | Purpose | Auth Gate |
|---|---|---|---|
| Root | `/` | Public landing page | None |
| `(auth)` | `/login`, `/register`, `/forgot-password` | Authentication | Redirect if signed in |
| `(onboarding)` | `/setup` | Office creation / join | Redirect if already in office |
| `dashboard` | `/dashboard/*` | Tenant product (10 modules) | `office_members` record required |
| `(admin-panel)` | `/admin/*` | Platform admin | `profiles.is_admin = true` |

## Auth Flow

```
Request → Middleware (session refresh)
  → Public route? Pass through
  → Not authenticated? → /login
  → Authenticated? → Layout gate:
      Dashboard: Has office_members record? → render : /setup
      Admin: profiles.is_admin? → render : /dashboard
```

## Multi-Tenancy Model

- **Tenant = Office** (`offices` table)
- Every data table has `office_id` FK
- `current_office_id()` PostgreSQL function returns the office for `auth.uid()`
- RLS policies: `WHERE office_id = current_office_id()`
- Platform admins bypass via `OR is_platform_admin()`

## Supabase Clients

| Client | File | RLS | Use When |
|---|---|---|---|
| `createClient()` | `server.ts` | ✅ | Server Components, Server Actions |
| `createClient()` | `browser.ts` | ✅ | Client Components |
| `createAdminClient()` | `admin.ts` | ❌ | Admin panel, onboarding, invitations |
| `createServerClient()` | `middleware.ts` | — | Session refresh only |

**`admin.ts` must never be imported in client-side code.**

## Dashboard Modules

| Module | Route | Key Components |
|---|---|---|
| Cases | `/dashboard/cases` | CaseDialog, CaseTable |
| Clients | `/dashboard/clients` | ClientDialog, ClientTable |
| Sessions | `/dashboard/sessions` | SessionDialog, SessionTable, SessionCalendar |
| Tasks | `/dashboard/tasks` | TaskDialog, TaskCard, KanbanBoard |
| Team | `/dashboard/team` | InviteDialog, TeamTable |
| Subscription | `/dashboard/subscription` | PlansGrid, SubscriptionOverview, BillingHistoryTable |
| Settings | `/dashboard/settings` | SettingsForm |
| Profile | `/dashboard/profile` | ProfileForm |
| Notifications | `/dashboard/notifications` | NotificationsList |
| Logs | `/dashboard/logs` | LogsTable |

## Admin Panel

Isolated in `(admin-panel)` route group with separate layout, dark theme (zinc-950 + amber), and `requireAdmin()` guard on every server action.

| Route | Component | Purpose |
|---|---|---|
| `/admin` | AdminGlobalStats | Dashboard with platform-wide metrics |
| `/admin/offices` | OfficesDirectory | Office list with subscription details |
| `/admin/users` | GlobalUsersList | All members across tenants |
| `/admin/requests` | PendingRequests | Upgrade request management |
| `/admin/payments` | PendingPayments | Payment confirmation |
| `/admin/settings` | — | Platform settings (placeholder) |

## Component Architecture

```
src/components/
├── layout/          # Sidebar, Topbar, SubscriptionGuard
├── notifications/   # NotificationsList
└── ui/              # 19 shadcn/ui primitives (avatar, badge, button, card, etc.)

src/app/dashboard/<feature>/
├── page.tsx         # Server Component: fetches data
├── *Dialog.tsx      # Client Component: create/edit modal
└── *Table.tsx       # Client Component: data table with search
```

## Data Flow Pattern

```
page.tsx (Server Component)
  → calls getItems() from src/lib/actions/module.ts
  → passes data to <ItemTable items={data} />

ItemTable.tsx (Client Component)
  → renders table UI
  → opens ItemDialog for create/edit

ItemDialog.tsx (Client Component)
  → uses react-hook-form + zod schema
  → calls createItemAction() / updateItemAction()
  → shows toast via Sonner on success/error
```

**Two patterns for getting office_id in actions:**
1. `supabase.rpc('current_office_id').single()` — used in `clients.ts`, `settings.ts`, `subscriptions.ts`
2. `office_members` query filtered by `user.id` + `is_active: true` — used in `tasks.ts`, `sessions.ts`, `cases.ts`

Both are valid. Pattern 2 is used when the action also needs membership verification.
