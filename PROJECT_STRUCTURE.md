# Mizan Codebase Map & Directory Structure

This document outlines the complete directory tree of the Mizan project. Every directory listed here exists for a specific architectural purpose.

```text
/
├── app/                      → Next.js App Router (Pages & Layouts)
│   ├── (auth)/               → Authentication pages (no sidebar, public/guest access)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (onboarding)/         → Post-registration flow (creating/joining an office)
│   │   └── setup/page.tsx
│   ├── (dashboard)/          → Protected office user workspace (requires active office_member)
│   │   ├── layout.tsx        → Sidebar + Topbar shell
│   │   ├── page.tsx          → لوحة التحكم (Main Dashboard)
│   │   ├── cases/            → القضايا (Case Management)
│   │   ├── clients/          → العملاء (Client Management)
│   │   ├── sessions/         → الجلسات (Session Scheduling & Calendar)
│   │   ├── tasks/            → المهام (Kanban Task Board)
│   │   ├── team/             → الفريق (Team & Role Management)
│   │   ├── notifications/    → الإشعارات (All Notifications)
│   │   └── settings/         → الإعدادات (Office Settings & Subscriptions)
│   │       ├── page.tsx      → Office Settings & Notification Preferences
│   │       └── subscription/ → Subscription Management
│   ├── (marketing)/          → Main Landing Page (Public facing)
│   │   └── page.tsx          → Static landing page, hero, pricing, FAQ
│   └── (admin)/              → Protected admin workspace (System-level management)
│       ├── layout.tsx        → Separate admin layout shell
│       ├── page.tsx          → Admin Dashboard Stats
│       ├── offices/          → All Offices List
│       ├── subscriptions/    → Pending Subscription Requests
│       └── audit-log/        → System Audit Logs
├── components/               → React UI Components
│   ├── ui/                   → shadcn/ui base components (buttons, dialogs, inputs)
│   ├── layout/               → Shell components: Sidebar, Topbar, PageHeader
│   ├── cases/                → Case-specific UI (Case cards, filters, stats bar)
│   ├── clients/              → Client-specific UI (Client lists, details)
│   ├── sessions/             → Session-specific UI (FullCalendar integration, daily lists)
│   ├── tasks/                → Task-specific UI (dnd-kit Kanban logic, Task cards)
│   ├── notifications/        → Notification UI (Dropdowns, Notification list items)
│   └── shared/               → Reusable components (Empty States, Skeleton Loaders)
├── lib/                      → Utilities, configurations, and core logic
│   ├── supabase/             → Supabase Client Factories
│   │   ├── browser.ts        → Client-side Supabase instance
│   │   ├── server.ts         → Server-side Supabase instance (with cookies)
│   │   ├── admin.ts          → Server-only service_role instance (NEVER leak to browser)
│   │   └── middleware.ts     → Next.js Middleware for session refresh & protection
│   ├── validations/          → Zod schemas for all entities (shared client/server validation)
│   ├── actions/              → Next.js Server Actions (Mutations & DB calls)
│   ├── utils/                → Pure utility functions (cn.ts, formatters)
│   └── constants/            → App-wide constants (Subscription Plans, Enums)
├── hooks/                    → Custom React hooks (e.g., useTenant, useRealtime)
├── types/                    → TypeScript type definitions
│   ├── database.ts           → Auto-generated from Supabase schema
│   ├── app.ts                → Application-level types and extensions
│   └── forms.ts              → Form input types derived from Zod schemas
├── emails/                   → React Email templates (RTL, Arabic)
│   ├── WelcomeEmail.tsx
│   ├── SessionReminderEmail.tsx
│   ├── TrialExpiryEmail.tsx
│   ├── SubscriptionApprovedEmail.tsx
│   └── SubscriptionRejectedEmail.tsx
├── supabase/                 → Supabase Platform Configuration
│   ├── migrations/           → Ordered SQL migration files for Schema creation
│   ├── functions/            → Edge Functions (Deno) for sensitive/scheduled tasks
│   └── seed.sql              → Development seed data (Subscription Plans, Admin user)
├── docs/                     → All Project Specification Documents
│   ├── AGENTS.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DATABASE_SCHEMA.sql
│   ├── FEATURES_SPEC.md
│   ├── API_SPEC.md
│   ├── TASK_BREAKDOWN.md
│   └── DECISIONS_LOG.md
├── public/                   → Static assets (Logos, Icons, Illustrations)
├── .env.example              → Environment variables template
├── next.config.ts            → Next.js compiler configuration
├── tailwind.config.ts        → Tailwind styling configuration (with RTL plugin reference)
└── tsconfig.json             → TypeScript strict configuration
```
