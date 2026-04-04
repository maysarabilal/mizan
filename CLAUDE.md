# CLAUDE.md — Agent Operational Guide

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run lint     # ESLint
npm run build    # Production build (TS errors ignored)
```

## Layout

```
src/lib/actions/*           → 13 server action files (mutations + queries)
src/lib/validations/*       → 9 Zod schema files
src/lib/supabase/server.ts  → createClient() — RLS enforced
src/lib/supabase/admin.ts   → createAdminClient() — RLS BYPASSED (server-only)
src/lib/constants/enums.ts  → Arabic↔English enum maps + helpers
src/types/database.ts       → STALE — verify columns against supabase/migrations/
src/app/dashboard/*         → Tenant product (10 modules)
src/app/(admin-panel)/admin → Platform admin (isolated, dark theme, requireAdmin() guard)
src/components/ui/*         → 19 shadcn/ui primitives
```

## Rules

1. **Tenant = Office.** Every table has `office_id`. Set from `supabase.rpc('current_office_id')`.
2. **Default to `createClient()`.** Only use `createAdminClient()` for: onboarding, admin panel, invitations, capacity checks.
3. **Never import `admin.ts` in client components.**
4. **Task status/priority are Arabic in DB.** Use `STATUS_TO_DB`/`PRIORITY_TO_DB` maps or `toDbStatus()`/`toDbPriority()` helpers from `enums.ts`. Never hardcode Arabic strings.
5. **`database.ts` is stale.** Always cross-check against `supabase/migrations/`.
6. **All user-facing errors in Arabic.** Internal logs via `console.error()` in English.
7. **Every mutation calls `revalidatePath()`.** Every action validates with Zod first.
8. **Settings schema is `officeSettingsSchema`** (not `settingsSchema`). Settings read action is `getOfficeConfig()` (not `getOfficeSettings`). Profile read is `getProfileAction()`. Notification mark-read is `markAsReadAction()` (not `markNotificationReadAction`).

## Server Action Shape

```typescript
'use server'
type ActionResult<T = null> = { data: T | null; error: string | null }
```

## Key Files

| File | Why |
|---|---|
| `dashboard/layout.tsx` | Office membership gate + SubscriptionGuard |
| `(admin-panel)/admin/layout.tsx` | `is_admin` gate |
| `lib/actions/admin.ts` | `requireAdmin()` pattern |
| `lib/constants/enums.ts` | Arabic↔English task enums |
| `components/layout/SubscriptionGuard.tsx` | Locks dashboard on expired sub |

## Docs

Architecture → `ARCHITECTURE.md` · Schema → `DB_SCHEMA.md` · Actions → `API_CONTRACT.md` · Business rules → `PRODUCT_RULES.md` · Testing → `TESTING.md` · Issues → `TROUBLESHOOTING.md` · Style → `CODE_QUALITY.md`
