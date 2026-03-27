# Mizan Task Breakdown

This document enumerates the atomic tasks required to complete the MVP. Tasks are grouped by Phase per the Build Order (Section 5).

## Phase 1: Foundation (DB, Auth, Layout)
| Task ID | Title | Est (hrs) | Dependencies | Acceptance Criteria | Phase |
|---------|-------|-----------|--------------|---------------------|-------|
| T-001 | Init Next 15 Project & Tailwind RTL | 1 | None | App boots up on `npm run dev` with RTL working and IBM Plex font loaded. | 1 |
| T-002 | Supabase Local Setup & DB Schema Run | 1 | T-001 | `supabase start` works. All tables from `DATABASE_SCHEMA.sql` are generated. | 1 |
| T-003 | Supabase Client Utilities | 2 | T-002 | Browser, Server, Admin, and Middleware clients implemented exactly as structure specifies. | 1 |
| T-004 | Generate & Map DB/App TypeScript Types | 1 | T-002 | `database.ts`, `app.ts`, `forms.ts` created with 0 lint errors. | 1 |
| T-005 | Frontend Layout: Auth Pages | 2 | T-004 | `/login` and `/register` accessible and responsive with proper forms. | 1 |
| T-006 | Auth Server Actions (signIn, signUp) | 2 | T-003, T-005 | Users can hit form, register, and see their profile row populate in DB. | 1 |
| T-007 | Onboarding Flow (Setup) | 4 | T-006 | Three paths functional: Join code, Free trial office, UI handles redirect to `/dashboard`. | 1 |
| T-008 | Dashboard Layout Shell (Sidebar/Topbar) | 3 | T-007 | `/dashboard/*` has responsive layout with Arabic RTL, sidebar handles collapse. | 1 |
| **GATE 1** | Verification Check 1 | - | T-001..T-008 | 0 type errors, no console errors, onboarding flow e2e works. | 1 |

## Phase 2: Cases & Clients
| Task ID | Title | Est (hrs) | Dependencies | Acceptance Criteria | Phase |
|---------|-------|-----------|--------------|---------------------|-------|
| T-009 | Clients List & Empty State | 2 | T-008 | `/clients` displays list fetched from DB or empty component. | 2 |
| T-010 | Add/Edit Client Modal & Server Actions | 2 | T-009 | Client CRUD operations work accurately respecting RLS. | 2 |
| T-011 | Cases List, Search & Filters | 3 | T-010 | `/cases` with stats bar and filter logic functions. | 2 |
| T-012 | Add/Edit Case Form | 3 | T-011 | Complex form with exact enums, linked strictly to active clients. | 2 |
| T-013 | Case Detail Page (Tabs Structure) | 3 | T-012 | Details show nicely, dummy tabs prepared for Sessions/Tasks. | 2 |

## Phase 3: Sessions & Calendar
| Task ID | Title | Est (hrs) | Dependencies | Acceptance Criteria | Phase |
|---------|-------|-----------|--------------|---------------------|-------|
| T-014 | Monthly Calendar View via FullCalendar | 4 | T-013 | `/sessions` calendar localizes to 'ar', correctly renders event dots on grid. | 2 |
| T-015 | Add Session Modal & Server Actions | 3 | T-014 | Creating a session updates DB, reflects on calendar immediately. | 2 |
| T-016 | Integrate Sessions into Case View Tab | 2 | T-015 | Case detail 'Sessions' tab shows list of related sessions. | 2 |

## Phase 4: Tasks & Team
| Task ID | Title | Est (hrs) | Dependencies | Acceptance Criteria | Phase |
|---------|-------|-----------|--------------|---------------------|-------|
| T-017 | Task Kanban Board Base Setup (dnd-kit) | 4 | T-008 | Columns visually correct, dummy cards can be dragged nicely. | 2 |
| T-018 | Real Tasks Hooks & Status Drag Updates | 3 | T-017 | Board interacts with Server Action `updateTaskStatus`, stays in sync. | 2 |
| T-019 | Task Creation Modal | 2 | T-018 | Cards enter Kanban via form. | 2 |
| T-020 | Team Settings & Invite Generation | 3 | T-008 | `/team` lists members, Owner can generate code for joining. | 2 |
| T-021 | Realtime Notifications Dropdown Base | 3 | T-008 | Bell icon reads `notifications` table count. | 2 |
| **GATE 2** | Verification Check 2 | - | T-009..T-021 | All core CRUD operations validated end-to-end. | 2 |

## Phase 5: Subscriptions & Admin
| Task ID | Title | Est (hrs) | Dependencies | Acceptance Criteria | Phase |
|---------|-------|-----------|--------------|---------------------|-------|
| T-022 | Office Settings Form (`offices` table) | 2 | T-008 | Owner can update name and JSON settings. | 3 |
| T-023 | Subscription Settings Panel & Upgrade | 3 | T-020 | Shows visual pricing selection, creates pending `subscription_request` record. | 3 |
| T-024 | Admin Layout Shell & Route Guard | 2 | T-008 | `/admin` strictly locked behind `is_admin` profile flag. | 3 |
| T-025 | Admin Stats View | 3 | T-024 | Aggregates DB to show total revenue, active plans, offices count. | 3 |
| T-026 | Admin Pending Subscriptions Appproval | 3 | T-025 | Action effectively flips request state and actual tenant state. | 3 |
| **GATE 3** | Verification Check 3 | - | T-022..T-026 | Subscription flows manually tested from Owner request -> Admin approve -> Owner view. | 3 |

## Phase 6: Landing Page & Polish
| Task ID | Title | Est (hrs) | Dependencies | Acceptance Criteria | Phase |
|---------|-------|-----------|--------------|---------------------|-------|
| T-027 | React Email Templates Development | 4 | None | Beautiful RTL templates created, tested in preview mode. | 4 |
| T-028 | Edge Functions for Cron (Reminders) | 4 | T-027 | Supabase function triggers email delivery for Sessions tomorrow. | 4 |
| T-029 | Marketing Landing Page + Components | 4 | None | Marketing site up, SEO friendly, hits Lighthouse > 85. | 4 |
| T-030 | Error Boundary & Skeketons Polish | 3 | Global | Every route has a nice fallback. | 4 |
| **GATE 4** | Final Verification | - | T-027..T-030 | Product ready for deployment and usage. | 4 |
