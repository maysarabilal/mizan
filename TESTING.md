# Testing

## Current State

- **No automated test suite.** No test runner, test directories, or `test` script in `package.json`.
- **TypeScript build errors are suppressed** (`ignoreBuildErrors: true` in `next.config.ts`).
- All verification is manual.

## Required Checks (Every Change)

### Static Analysis

```bash
npm run lint    # Must pass with no new errors
npm run build   # Must complete without new failures
```

### Route Changes

- [ ] Page loads without runtime errors
- [ ] Server Component data fetching works
- [ ] Client Components render and are interactive
- [ ] Navigation between affected routes works

### Server Action Changes

- [ ] Zod validation rejects invalid input
- [ ] Success returns `{ data: ..., error: null }`
- [ ] Error returns `{ data: null, error: 'Arabic message' }`
- [ ] `revalidatePath()` called for all affected routes
- [ ] Correct Supabase client used (`createClient` vs `createAdminClient`)

### Multi-Tenancy Changes

- [ ] Data only returns rows for the current tenant
- [ ] Inserts set `office_id` from `current_office_id()` RPC
- [ ] Admin bypass only uses `createAdminClient()` with documented reason
- [ ] No data leaks across offices

### Subscription Changes

- [ ] All 7 status values are handled
- [ ] SubscriptionGuard locks/unlocks correctly
- [ ] Grace period logic (3 days) preserved
- [ ] Admin + dashboard paths both revalidated

### UI / RTL Changes

- [ ] Layout renders correctly in RTL
- [ ] Uses `ms-*`/`me-*` (not `ml-*`/`mr-*`)
- [ ] All visible text is Arabic
- [ ] Font renders (IBM Plex Sans Arabic)

## Completion Gate

**If any check above fails, the task is NOT complete.** Either fix the failure or document what remains and why.

## What Not to Do

- Do not add test frameworks unless explicitly requested.
- Do not remove `ignoreBuildErrors: true`.
- Do not rely on TypeScript compilation alone — TS errors are currently ignored.
