# Repository Guidelines

## Product Identity

Mizan (ميزان) is a multi-tenant SaaS law firm management platform. Arabic RTL interface. Audience: lawyers and law offices in the Arab world. Currency: ILS. All user-facing text is Arabic.

## Project Structure & Module Organization

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root: Arabic RTL, IBM Plex Sans Arabic
│   ├── page.tsx                      # Public landing page
│   ├── globals.css                   # Tailwind v4 + shadcn design tokens (oklch)
│   ├── (auth)/                       # Login, Register, Forgot Password
│   ├── (onboarding)/setup/           # Office creation or join-by-code
│   ├── dashboard/                    # Tenant product area (10 sub-routes)
│   │   ├── layout.tsx                # Sidebar + Topbar + SubscriptionGuard
│   │   ├── cases/                    # Legal case management
│   │   ├── clients/                  # Client directory
│   │   ├── sessions/                 # Court session scheduling
│   │   ├── tasks/                    # Kanban task board
│   │   ├── team/                     # Team & invitation management
│   │   ├── subscription/             # Plan & billing management
│   │   ├── settings/                 # Office settings
│   │   ├── profile/                  # User profile
│   │   ├── notifications/            # In-app notifications
│   │   └── logs/                     # Audit logs
│   ├── (admin-panel)/admin/          # Platform admin panel (isolated)
│   │   ├── layout.tsx                # Admin gate (is_admin) + dark theme shell
│   │   ├── _components/              # 8 admin-specific components
│   │   ├── offices/                  # Office directory
│   │   ├── users/                    # Global user list
│   │   ├── requests/                 # Upgrade request management
│   │   ├── payments/                 # Payment confirmation
│   │   └── settings/                 # Platform settings
│   └── api/                          # API routes (minimal)
├── components/
│   ├── layout/                       # Sidebar, Topbar, SubscriptionGuard
│   ├── notifications/                # NotificationsList
│   └── ui/                           # 19 shadcn/ui primitives
├── emails/                           # react-email templates
├── lib/
│   ├── actions/                      # 13 server action files
│   ├── constants/enums.ts            # Arabic↔English enum mappings
│   ├── supabase/                     # 4 Supabase client factories
│   ├── validations/                  # 9 Zod schema files
│   └── utils.ts                      # cn() utility
├── middleware.ts                     # Auth + route protection
└── types/database.ts                 # Generated Supabase types (often stale)
```

## Build, Test, and Development Commands

- `npm run dev` — Start the local Next.js dev server.
- `npm run lint` — Run ESLint across the repository.
- `npm run build` — Create a production build. Note: `ignoreBuildErrors: true` for TypeScript.
- `npm run start` — Serve the production build locally.

## Technology Stack

- **Next.js 16.2.1** — App Router with React Compiler enabled.
- **React 19.2.4** — Functional components only.
- **Tailwind CSS v4** — Using `@theme inline` and oklch color functions.
- **shadcn/ui** — base-nova style, 19 components in `src/components/ui/`.
- **Supabase** — Auth + PostgreSQL 15 + RLS + RPC functions.
- **Zod v4** — Input validation in all server actions.
- **react-hook-form v7** — Form state management.
- **@tanstack/react-query v5** — Client-side data fetching.
- **FullCalendar v6** — Court session calendar.
- **@dnd-kit v6** — Kanban drag-and-drop.
- **Recharts v3** — Charts and analytics.
- **Sonner v2** — Toast notifications.
- **Lucide React** — Icon library.

## Coding Style & Naming Conventions

- Use TypeScript and functional React components throughout.
- Follow the existing style: 2-space indentation, single quotes, semicolons omitted.
- Tailwind utility classes inline; use `cn()` from `@/lib/utils` for conditional classes.
- Name route components `page.tsx`, `layout.tsx`, and colocated UI as `PascalCase.tsx`.
- Keep server mutations in `src/lib/actions/*` and validation schemas in `src/lib/validations/*`.
- This repo uses Next.js `16.2.1`, which has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before changing framework-level behavior.

## Server Action Conventions

Every server action file MUST:
1. Start with `'use server'` directive.
2. Declare a local `ActionResult<T>` type: `{ data: T | null; error: string | null }`.
3. Validate input with Zod before any DB operation.
4. Return Arabic error messages for the client; use `console.error()` for internal logging.
5. Call `revalidatePath()` after every mutation.
6. Use `createClient()` (from `server.ts`) for RLS-aware queries.
7. Use `createAdminClient()` (from `admin.ts`) ONLY when bypassing RLS is strictly required.

## Supabase Client Rules

| Context | Client | RLS |
|---|---|---|
| Server Components / Server Actions | `createClient()` from `server.ts` | ✅ Enforced |
| Client Components | `createClient()` from `browser.ts` | ✅ Enforced |
| Admin/cross-tenant operations | `createAdminClient()` from `admin.ts` | ❌ Bypassed |
| Middleware | Direct `createServerClient()` | Session refresh only |

**CRITICAL**: `admin.ts` must NEVER be imported by client-side code. It uses `SUPABASE_SERVICE_ROLE_KEY`.

## Multi-Tenancy Rules

- **Tenant = Office**. Every data table has an `office_id` FK.
- Isolation is enforced by `current_office_id()` PostgreSQL function in RLS policies.
- When inserting records, always set `office_id` from `supabase.rpc('current_office_id').single()`.
- When changing tenancy behavior, review `supabase/migrations/` and confirm RLS policies still enforce tenant isolation.

## Database & Schema Rules

- Schema source of truth: `supabase/migrations/` (13 migration files).
- `src/types/database.ts` is manually maintained and often stale. Verify against actual DB.
- To regenerate types: `npx supabase gen types`.
- Task `status` and `priority` are stored as **Arabic strings** in the DB. Always use `enums.ts` mapping functions (`toDbStatus`, `toAppStatus`, `toDbPriority`, `toAppPriority`).
- Roles evolved from `owner|lawyer|assistant` to `owner|admin|lawyer|secretary|trainee` via migrations. The TypeScript types reflect the newer set.

## Role & Permission System

### Roles (hierarchy)
`owner` → `admin` → `lawyer` → `secretary` → `trainee`

### Permissions
Granular permissions stored as `JSONB` in `office_members.permissions`. Keys defined in `src/lib/validations/team.ts` (`PERMISSION_KEYS`). Use `has_permission` RPC for server-side checks.

## Admin Panel Architecture

- Fully isolated in `(admin-panel)` route group — separate layout, theme, and auth gate.
- All admin server actions call `requireAdmin()` first, then use `createAdminClient()`.
- Admin panel uses a dark theme (zinc-950) with amber accents.
- Admin actions revalidate both admin AND dashboard paths for cross-concern consistency.

## Subscription Engine

- Manual payment model (no Stripe). Admin confirms payments manually.
- Statuses: `trialing` → `active` → `past_due` → `expired` (with `awaiting_payment`, `pending`, `cancelled`).
- `SubscriptionGuard` component locks the dashboard when subscription is invalid.
- 3-day grace period after expiry before full lockout.
- Two action files: `subscription.ts` (status check) and `subscriptions.ts` (CRUD). Be aware of the naming.

## RTL & Arabic Conventions

- Root `<html>` has `lang="ar" dir="rtl"`.
- Use `ms-*` / `me-*` (margin-start/end) instead of `ml-*` / `mr-*`.
- All user-facing error messages and labels are Arabic.
- Font: IBM Plex Sans Arabic (loaded via `next/font/google`).

## Component Patterns

- Feature components are co-located with their route (e.g., `dashboard/cases/CaseDialog.tsx`).
- `*Dialog.tsx` = Create/Edit modal (react-hook-form + zod + shadcn Dialog).
- `*Table.tsx` = Data table with search/filter.
- Pages are Server Components that fetch data and pass to Client Components.

## Testing Guidelines

- No automated test suite configured. No `test` script or test directories.
- Before opening a PR, run `npm run lint` and `npm run build`.
- Manually verify affected dashboard flows, especially auth, RLS-sensitive actions, and form submissions.

## Commit & Pull Request Guidelines

- Prefer Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`.
- Keep commits focused and explain schema-affecting changes clearly.
- PRs should include: short summary, impacted routes/modules, screenshots for UI changes, any required env or migration changes, and manual verification steps.

## Security & Configuration

- Secrets live in `.env.local` — never commit Supabase keys.
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Treat `src/lib/supabase/admin.ts` as server-only.
- `profiles.is_admin` is the ONLY gate for platform admin access.

## Known Technical Debt

1. `next.config.ts` has `ignoreBuildErrors: true` — TypeScript errors are suppressed.
2. `database.ts` types are stale vs the actual schema (13 migrations applied).
3. Two similarly named action files: `subscription.ts` vs `subscriptions.ts`.
4. `ActionResult<T>` type is redeclared in every action file instead of being shared.
5. Some admin actions reference `subscription_plans.billing_cycle` which isn't in the TypeScript types.
6. `getAdminOverview()` contains a silent data migration that should be a proper migration.
