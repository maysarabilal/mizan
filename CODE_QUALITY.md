# Code Quality

## Style

- 2-space indentation, single quotes, no semicolons
- Functional components only (no class components)
- Tailwind utility classes inline, `cn()` for conditional merging
- RTL: `ms-*`/`me-*` instead of `ml-*`/`mr-*`

## Naming

| Element | Convention | Example |
|---|---|---|
| Route pages | `page.tsx` | Always |
| Route layouts | `layout.tsx` | Always |
| Feature components | `PascalCase.tsx` | `CaseDialog.tsx` |
| Server actions (write) | `verbNounAction` | `createCaseAction` |
| Server actions (read) | `getNoun` | `getCases` |
| Validation schemas | `nounSchema` | `caseSchema` |
| Constants | `SCREAMING_SNAKE` | `PLAN_SLUGS` |

## File Organization

- Server actions → `src/lib/actions/<module>.ts`
- Validation schemas → `src/lib/validations/<module>.ts`
- Feature components → co-located with route: `src/app/dashboard/<feature>/`
- Shared UI → `src/components/ui/`
- Admin components → `src/app/(admin-panel)/admin/_components/`

## Server Action Rules

1. Start with `'use server'`
2. Declare local `ActionResult<T>` type
3. Validate input with Zod before any DB call
4. Return Arabic error messages to client
5. Use `console.error()` for internal logging
6. Call `revalidatePath()` after every mutation
7. Default to `createClient()` (RLS); `createAdminClient()` only when required

## Error Message Pattern

```typescript
if (error) {
  console.error('Error creating case:', error)           // English internal
  return { data: null, error: 'حدث خطأ أثناء إضافة القضية' }  // Arabic user-facing
}
```

## Enum Safety

Never hardcode Arabic DB values. Use `src/lib/constants/enums.ts`:
- **Helper functions:** `toDbStatus()` / `toAppStatus()` / `toDbPriority()` / `toAppPriority()`
- **Map constants:** `STATUS_TO_DB` / `DB_TO_STATUS` / `PRIORITY_TO_DB` / `DB_TO_PRIORITY`

Both are valid. The codebase uses map constants in `tasks.ts` actions and exports helper functions for convenience.

## Commit Conventions

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`
- One logical change per commit
- Schema-affecting changes explained in commit body

## Known Technical Debt

1. `ignoreBuildErrors: true` in `next.config.ts` — TS errors suppressed
2. `database.ts` types stale vs 13 applied migrations
3. `subscription.ts` vs `subscriptions.ts` naming confusion
4. `billing_cycle` referenced in code but missing from types
5. `PendingRequests.tsx` and `PendingPayments.tsx` are dead code — replaced by `SubscriptionManagement.tsx`
