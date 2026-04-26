# 📖 Development & Issue Log

This file serves as the **centralized, chronological, and structured log** for all changes, issues, and fixes in the "Mizan" project.

All AI Agents MUST read this file before performing any complex modification to:

* Understand system evolution
* Identify dependencies
* Avoid repeating past mistakes
* Prevent breaking existing features

---

# 🧠 CRITICAL RULES

1. **Always add the latest entry at the top** (under "Current Log").
2. **Dependencies must be explicit**: Clearly define relationships between changes.
3. **Every issue must include Root Cause + Prevention**, not just the fix.
4. **Never repeat a previously solved mistake** — always check past logs.
5. **If a change has risk, it MUST include a Regression Risk assessment.**
6. **Agents must append UI/Admin test cases to `TESTING_SCENARIOS.md` for new features.**
7. **Agents must perform a Pre-Execution Checklist before implementing any change.**

---

# 📅 Current Log

---

## [2026-04-27] — تفعيل Nightly Maintenance Cron Job (إغلاق الثغرة المؤجلة)

**Severity:** High

**Details:**
* أغلق هذا التغيير الثغرة المؤجلة من `[2026-04-05]` — دالة `nightly_maintenance()` كانت مكتوبة لكن لم تُستدعى تلقائياً.
* نُشرت **Supabase Edge Function** باسم `nightly-cron` (status: ACTIVE, verify_jwt: false).
* المصادقة تتم عبر `x-cron-secret` header بدلاً من JWT — سر عشوائي يُحفظ في GitHub Secrets و Supabase Edge Function Secrets.
* أُنشئ **GitHub Actions Workflow** (`.github/workflows/nightly-maintenance.yml`) يعمل يومياً الساعة 02:00 UTC.
* الـ Workflow يدعم `workflow_dispatch` للتشغيل اليدوي من واجهة GitHub.
* الـ Workflow يتحقق من HTTP status code ويفشل (`exit 1`) إذا لم تُرجع الـ Function حالة `200`.

**Root Cause:**
* Supabase Free Plan لا يدعم `pg_cron`. كان النظام يعتمد كلياً على `SubscriptionGuard` في الواجهة لتطبيق انتهاء الصلاحية.

**Affected Components:**
* `.github/workflows/nightly-maintenance.yml` [NEW]
* Supabase Edge Function `nightly-cron` [NEW — deployed via MCP]
* **لم يُعدّل أي كود في DB** — الدالة `nightly_maintenance()` لم تتغير.

**Dependencies:**
* يعتمد على migration `20260405000003_nightly_maintenance.sql` (الدالة + `GRANT EXECUTE` لـ `service_role`).
* يتطلب 3 GitHub Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
* يتطلب إضافة `CRON_SECRET` أيضاً في Supabase Edge Function Secrets عبر Dashboard.

**Regression Risk:**
* Zero. لا يعدّل أي كود Frontend أو DB schema. الـ Edge Function معزولة تماماً.

**Solution:**
* Edge Function تستدعي `supabase.rpc('nightly_maintenance')` عبر `service_role` client.
* GitHub Action يستدعي الـ Edge Function عبر `curl` مع `CRON_SECRET` header.

**Prevention:**
* لا تستدعِ `/rest/v1/rpc/nightly_maintenance` مباشرة — استخدم الـ Edge Function دائماً.
* عند الترقية لـ Supabase Pro Plan، يمكن تفعيل `pg_cron` كبديل مباشر وإلغاء الـ GitHub Action.

**⚠️ إعداد مطلوب:**
1. أنشئ `CRON_SECRET` عبر `openssl rand -hex 32`
2. أضفه كـ GitHub Secret باسم `CRON_SECRET`
3. أضفه كـ Supabase Edge Function Secret عبر Dashboard → Edge Functions → nightly-cron → Secrets

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.
* Did you verify the DB function exists? Yes — confirmed in migration `20260405000003`.
* Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-26] — إعادة تصميم وحدة فريق العمل `/team`

### الوصف
نقل وحدة إدارة الفريق بالكامل لنمط Digital Atelier. تحسين عرض الأعضاء، الصلاحيات، والدعوات بتصميم ذهبي فاخر متناسق مع صفحة العملاء.

### الملفات المُنشأة
| ملف | نوع | وصف |
|---|---|---|
| `team/_components/TeamMemberList.tsx` | Client | جدول الأعضاء المحدث + نافذة الصلاحيات الاحترافية |
| `team/loading.tsx` | Server | Skeleton loading للفريق |

### الملفات المُعدّلة
| ملف | التعديل |
|---|---|
| `team/page.tsx` | إعادة بناء الصفحة لتشمل الإحصائيات والتكامل مع المكونات الجديدة |
| `team/InviteDialog.tsx` | تصميم جديد (gold accent + تجربة نسخ كود الدعوة) |

### الملفات المحذوفة
| ملف | السبب |
|---|---|
| `team/TeamTable.tsx` | استُبدل بـ `_components/TeamMemberList.tsx` |

---


## [2026-04-26] — إعادة تصميم صفحة العملاء `/clients` + حقول جديدة

### الوصف
إعادة تصميم كاملة لصفحة العملاء بنمط Digital Atelier. إضافة 3 أعمدة جديدة للـ DB (`id_number`, `address`, `avatar_url`). إنشاء صفحة تفاصيل عميل جديدة. تحديث بطاقة العميل في جميع المواقع.

### DB Migration: `add_client_extended_fields`
- `id_number text` — رقم الهوية أو جواز السفر
- `address text` — عنوان السكن
- `avatar_url text` — رابط صورة (placeholder حالياً — ينتظر Supabase Storage)

### الملفات المُنشأة
| ملف | نوع | وصف |
|---|---|---|
| `clients/_components/ClientFilters.tsx` | Client | بحث debounced (اسم + هاتف + هوية + بريد) |
| `clients/_components/ClientTableList.tsx` | Client | جدول 7 أعمدة + avatar + صفوف قابلة للنقر |
| `clients/_components/AddClientButton.tsx` | Client | زر ذهبي #C9A84C |
| `clients/_components/ClientPagination.tsx` | Client | pagination بنمط الجلسات |
| `clients/[clientId]/page.tsx` | Server | SSR صفحة تفاصيل عميل |
| `clients/[clientId]/ClientDetailClient.tsx` | Client | ملف شخصي + info grid + قضايا مرتبطة |
| `clients/loading.tsx` | Server | skeleton loading |

### الملفات المُعدّلة
| ملف | التعديل |
|---|---|
| `clients/page.tsx` | SSR + searchParams + pagination |
| `clients/ClientDialog.tsx` | تصميم جديد (gold accent + حقول جديدة + avatar placeholder) |
| `lib/actions/clients.ts` | إضافة حقول جديدة + `getClientById` + `getClientCases` |
| `lib/validations/clients.ts` | إضافة `id_number` + `address` |
| `types/database.ts` | إضافة أنواع الحقول الجديدة |
| `cases/[caseId]/CaseDetailClient.tsx` | بطاقة عميل محدثة (avatar + id_number + address + رابط تفاصيل) |
| `sessions/[sessionId]/SessionDetailClient.tsx` | اسم الموكل قابل للنقر + id_number |

### الملفات المحذوفة
| ملف | السبب |
|---|---|
| `clients/ClientTable.tsx` | استُبدل بـ `_components/ClientTableList.tsx` |

### UI Placeholders (Per UI_Implementation_Protocol)
| العنصر | الحالة | الموقع |
|---|---|---|
| رفع صورة العميل | `disabled`, hover overlay + badge "قريباً" | `ClientDialog.tsx` |

### Dependencies
- **لا حزم جديدة** — يستخدم المكونات الموجودة فقط

---


## [2026-04-24] — تحسينات شاملة للجلسات والقضايا (10 بنود)

### الوصف
تنفيذ 10 تحسينات على وحدتي الجلسات والقضايا تشمل: إصلاح الأداء، فلتر نطاق التاريخ، عرض المحامي، بحث متقدم عبر RPC، صفحة تفاصيل جلسة، أزرار مرفقات placeholder، تحسين التقويم والـ Dialogs.

### DB Migration: `search_sessions` RPC
- دالة `search_sessions()` تبحث عبر: `court, hall, session_type, notes, cases.title, clients.name, profiles.full_name`
- تدعم فلترة بـ: status, type, court, date_from, date_to
- تحترم tenant isolation عبر `current_office_id()`
- Pagination مدمج عبر `OFFSET/LIMIT` + `total_count` window function

### الملفات المُنشأة
| ملف | نوع | وصف |
|---|---|---|
| `sessions/[sessionId]/page.tsx` | Server | SSR page لتفاصيل الجلسة |
| `sessions/[sessionId]/SessionDetailClient.tsx` | Client | واجهة تفاصيل الجلسة (info grid + notes + attachments placeholder) |
| `components/ui/popover.tsx` | UI | مكون Popover من shadcn/ui (مطلوب: `@radix-ui/react-popover`) |

### الملفات المُعدّلة
| ملف | التعديل |
|---|---|
| `sessions/page.tsx` | استخدام `search_sessions` RPC + date range params + lawyer profile في joins |
| `sessions/_components/SessionFilters.tsx` | فلتر نطاق تاريخ فعّال (Popover) + `router.replace()` |
| `sessions/_components/SessionTableList.tsx` | عمود محامي + زر عرض Eye + صف قابل للنقر |
| `sessions/_components/SessionCalendarView.tsx` | DropdownMenu على البطاقات (عرض + تعديل) + أسماء المحامين + زر اليوم |
| `sessions/SessionDialog.tsx` | تصميم جديد (gold accent + dividers + file placeholders + gold save button) |
| `sessions/_components/SessionPagination.tsx` | `router.replace()` بدل `router.push()` |
| `cases/CaseDialog.tsx` | تصميم موحد (gold accent + dividers + file placeholders + gold save button) |
| `cases/_components/AddCaseButton.tsx` | لون ذهبي `#C9A84C` مطابق لزر الجلسات |
| `cases/_components/CaseFilters.tsx` | `router.replace()` بدل `router.push()` |
| `cases/page.tsx` | تحديث AddCaseButton (بدون children) |

### UI Placeholders (Per UI_Implementation_Protocol)
| العنصر | الحالة | الموقع |
|---|---|---|
| إرفاق مذكرة (جلسة) | `disabled`, `opacity-60`, `title="قريباً"` | `SessionDialog.tsx` |
| إرفاق طلب (جلسة) | `disabled`, `opacity-60`, `title="قريباً"` | `SessionDialog.tsx` |
| إرفاق مستند (جلسة) | `disabled`, `opacity-60`, `title="قريباً"` | `SessionDialog.tsx` |
| إرفاق عقد/توكيل (قضية) | `disabled`, `opacity-60`, `title="قريباً"` | `CaseDialog.tsx` |
| إرفاق مستند قضائي (قضية) | `disabled`, `opacity-60`, `title="قريباً"` | `CaseDialog.tsx` |
| إرفاق ملف (قضية) | `disabled`, `opacity-60`, `title="قريباً"` | `CaseDialog.tsx` |
| مرفقات (تفاصيل الجلسة) | `disabled`, `opacity-60`, badge "قريباً" | `SessionDetailClient.tsx` |

### Dependencies الجديدة
- `@radix-ui/react-popover` — مطلوب لمكون Popover (فلتر نطاق التاريخ)

### Performance Improvements
- جميع عمليات الفلترة والـ pagination تستخدم `router.replace()` بدل `router.push()` لتجنب تراكم الـ history stack
- البحث يستخدم `useDebouncedCallback` بـ 300ms للبحث اللحظي

---


## [2026-04-24] — إعادة تصميم صفحة الجلسات `/sessions` — مطابقة Figma

### الوصف
إعادة هيكلة كاملة لصفحة الجلسات لتتوافق مع تصميم Figma. تتضمن:
- **عرض القائمة:** جدول 7 أعمدة مع server-side filtering/pagination
- **عرض التقويم:** تصميم مخصص بدون FullCalendar (split view: تقويم شهري 65% + تفاصيل اليوم 35%)
- **فلاتر:** بحث + حالة + نوع (DB-driven) + محكمة (dynamic) + نطاق تاريخ (placeholder)
- **View toggle:** زرّان (قائمة/تقويم) + legend ألوان الحالات

### الملفات المُنشأة
| ملف | نوع | وصف |
|---|---|---|
| `_components/SessionFilters.tsx` | Client | فلاتر search + status + type + court + date range placeholder |
| `_components/SessionTableList.tsx` | Client | جدول 7 أعمدة بألوان Figma |
| `_components/SessionPagination.tsx` | Client | pagination مع active page ذهبي |
| `_components/AddSessionButton.tsx` | Client | زر ذهبي #C9A84C |
| `_components/SessionViewToggle.tsx` | Client | toggle قائمة/تقويم + legend |
| `_components/SessionCalendarView.tsx` | Client | تقويم مخصص + تفاصيل اليوم |
| `loading.tsx` | Server | skeleton loading |

### UI Placeholders (Per UI_Implementation_Protocol)
| العنصر | الحالة | الموقع |
|---|---|---|
| فلتر نطاق التاريخ (Date Range) | Disabled, `opacity-60`, `title="قريباً"` | `SessionFilters.tsx` |
| زر التصدير (Export) | غير مُنفّذ — لم يُضاف كـ placeholder | يُضاف لاحقاً عند الحاجة |

### Dependencies
- يعتمد على `SessionDialog.tsx` الموجود (لم يُعدّل)
- `getSessions()` في `sessions.ts` — لم يُعدّل (التصفية تتم عبر Supabase query مباشرة في page.tsx)

---


## [2026-04-24] — UI Placeholders — صفحة تفاصيل القضية `/cases/[caseId]`

**Severity:** Low | **Regression Risk:** None

**Details:**
تم تطبيق `UI_Implementation_Protocol` على صفحة تفاصيل القضية. العناصر التالية موجودة في تصميم Figma لكن لا يوجد لها منطق وظيفي في المشروع حالياً، وقد أُضيفت كـ `disabled` placeholders فقط بحسب البروتوكول.

| العنصر | الموقع | الوظيفة المتوقعة | الأولوية |
|---|---|---|---|
| زر "تصدير القضية" | Page Header | تصدير PDF/Word لبيانات القضية | متوسطة |
| تبويب "المستندات" | Tabs Panel | رفع وعرض المستندات المرتبطة بالقضية | عالية |
| تبويب "المهام" | Tabs Panel | عرض مهام قضية محددة (يختلف عن `/tasks` العام) | متوسطة |
| تبويب "المصاريف" | Tabs Panel | تتبع مصاريف القضية (رسوم، تكاليف) | متوسطة |
| زر "تحميل المزيد من الجلسات" | Sessions Table Footer | Pagination للجلسات | منخفضة |
| حقل "درجة التقاضي" | Case Information Card | عمود `litigation_degree` غير موجود في DB | متوسطة |
| حقل "القاضي المعيّن" | Case Information Card | عمود `assigned_judge` غير موجود في DB | منخفضة |

**Visual State Applied:** `disabled` + `opacity-60 cursor-not-allowed` + `title="قريباً — ..."` على كل عنصر.

**Affected Components:** `src/app/dashboard/cases/[caseId]/CaseDetailClient.tsx`

**Dependencies:**
- المستندات: يحتاج `case_documents` table + Storage bucket
- المصاريف: يحتاج `case_expenses` table
- المهام: يحتاج `case_id` FK في جدول `tasks`
- درجة التقاضي / القاضي: يحتاج Migration لإضافة الأعمدة في جدول `cases`
- التصدير: يحتاج Edge Function أو PDF library

**Regression Risk:** None — العناصر معطّلة ولا تؤثر على أي وظيفة موجودة.

---

## [2026-04-23] - UI Placeholders — Pending Implementation


**Severity:** Low | **Regression Risk:** None

**Details:**
Added several UI buttons and elements during the Digital Atelier UI redesign that do not currently possess underlying Server Actions or logic. They are placed strictly to secure the layout structure for future development phases. All such buttons are visually disabled (`opacity-60`, `cursor-not-allowed`) to prevent user confusion.

| الزر/العنصر | الموقع | الوظيفة المتوقعة | الأولوية |
|---|---|---|---|
| زر ؟ | Topbar | صفحة مساعدة أو Tooltip تعليمي | منخفضة |
| زر الدعم الفني | Sidebar | فتح نافذة تواصل أو رابط واتساب | متوسطة |
| زر إنشاء مستند | Quick Actions | مرتبط بميزة مستقبلية | منخفضة |

**Root Cause:**
* Preparing the UI structure based on the new design system before the backend logic is ready.

**Affected Components:**
* `src/components/layout/Topbar.tsx`
* `src/components/layout/Sidebar.tsx`
* `src/app/dashboard/page.tsx` (Future)

**Dependencies:**
* Requires future implementation of Help/Support systems and Document generation features.

**Regression Risk:**
* None. Elements are functionally disabled and exist only in the DOM.

**Solution:**
* Rendered placeholder elements with appropriate disabled visual states.

**Prevention:**
* Any future AI agent must check this log entry to understand that these buttons lack functionality and must implement their Server Actions before enabling them.

---

## [2026-04-23] - Payment Gateway Decision — Deferred

**Severity:** Low | **Regression Risk:** None

**Details:**
- **Context:** Evaluated the integration of automated payment gateways for subscription management.
- **Constraints:** Stripe is officially unavailable in Palestine.
- **Alternatives Considered:** Paddle, LemonSqueezy, and PayPal were reviewed as potential alternatives.
- **Decision:** Defer automated gateway integration. The platform will continue using the manual payment model (Bank Transfer/IBAN, PalPay, Reflect).
- **Future Roadmap:** 
    - Implement a "Proof of Payment" upload feature in the dashboard to streamline manual verification.
    - Re-evaluate automated gateways (Paddle/PayPal) if the project expands beyond the local market.

---

## [2026-04-23] - Diagnostic: Temporary Email Override (Testing Mode)

**Severity:** Low (Internal Development)

**Details:**
- **UI FIX:** Added missing `email` input field to `InviteDialog.tsx` to enable manual email testing for invitations.
- **TEST OVERRIDE:** Implemented `EMAIL_TEST_OVERRIDE` in `src/lib/resend.ts`. When this environment variable is set, ALL outgoing system emails are redirected to the specified address (e.g., `delivered@resend.dev`).
- **ENVIRONMENT:** Updated `.env.local` with `ADMIN_NOTIFICATION_EMAIL=delivered@resend.dev` and `EMAIL_TEST_OVERRIDE=delivered@resend.dev` to bypass Resend Sandbox delivery restrictions during verification.

> [!CAUTION]
> **PRE-PRODUCTION ACTION REQUIRED:**
> 1. Remove `EMAIL_TEST_OVERRIDE` from `.env.local`.
> 2. Revert/Remove the override logic in `src/lib/resend.ts`.
> 3. Verify that the `from` address is updated to the production domain once verified.

---

## [2026-04-23] - Phase 4: Email System Implementation (Resend + React Email)

**Severity:** High

**Details:**
* Established a centralized notification architecture using `Resend` and `react-email`.
* Designed 6 responsive, RTL-supported email templates: `WelcomeEmail`, `TeamInvitationEmail`, `OverageWarningEmail`, `UpgradeRequestAdminEmail` (for admins), `SubscriptionStatusEmail` (Approved/Rejected), and `SubscriptionActivatedEmail`.
* Created a shared `EmailFooter` component for brand consistency and easy management of contact/social links.
* Integrated email triggers into core Server Actions:
    * `team.ts`: Sends invitation emails when generating a member code.
    * `subscriptions.ts`: Notifies platform admins of new plan upgrade requests.
    * `admin.ts`: Notifies office owners of upgrade request approvals, rejections, and plan activations.
* Implemented `sendEmailSafe` pattern to ensure email dispatch failures do not block database transactions.
* Created `src/lib/constants/config.ts` for centralized app-wide settings (Admin Email, Site URL, etc.).
* Successfully verified the entire implementation with `npm run build` under strict TypeScript mode.

**Root Cause:**
* Mizan lacked a professional notification system. User interactions like team invites and subscription changes were silent, relying solely on in-app notifications.

**Affected Components:**
* `src/emails/*` (All templates and footer)
* `src/lib/actions/team.ts`
* `src/lib/actions/subscriptions.ts`
* `src/lib/actions/admin.ts`
* `src/lib/constants/config.ts`
* `supabase/migrations/20260423000000_add_email_to_invitations.sql`

**Dependencies:**
* Requires `Resend` API key in environment variables.
* Built upon the strict TypeScript foundations established in Phase 3.

**Regression Risk:**
* Low. Emails are sent as "fire-and-forget" tasks using `try/catch` wrappers. The main risk is email delivery failure if Resend quota is exceeded or API keys are invalid.

**Solution:**
* Unified all transactional communications under a single React-based template engine with full Arabic/RTL support.

**Prevention:**
* Always use the shared `CONFIG` object for system emails and URLs to avoid hardcoding.
* Always wrap email dispatch in `sendEmailSafe` (or similar) to prevent blocking main UI threads or transactions.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - Added Comprehensive Pre-Launch QA Master Plan

**Severity:** Medium

**Details:**
* Created `QA_MASTER_PLAN.md` as a repo-grounded, execution-ready QA document for pre-production validation.
* Covered tenant core flows, subscription lifecycle, overage enforcement, RBAC/RLS, admin workflows, server actions, RTL UI behavior, transactional integrity, edge cases, and offensive attacker scenarios.
* Converted all major scenarios into a phased execution checklist with IDs, priorities, blocker marking, default status fields, and notes columns for manual QA tracking.

**Root Cause:**
* The repository had partial testing notes in `TESTING_SCENARIOS.md`, but it lacked one unified, deep pre-launch master plan spanning product, QA, and offensive security execution.

**Affected Components:**
* `QA_MASTER_PLAN.md`

**Dependencies:**
* Built directly from current subscription guard behavior, admin workflow logic, team permissions, and multi-tenant RLS architecture documented in the existing codebase and logs.
* Depends on the latest subscription and overage implementations already logged on 2026-04-05.

**Regression Risk:**
* Low. Documentation-only change. Main risk is plan drift if business logic changes later without updating this file.

**Solution:**
* Added a single master QA artifact structured for manual execution before launch.

**Prevention:**
* Keep `QA_MASTER_PLAN.md` synchronized whenever subscription rules, permissions, onboarding, admin operations, or tenant data boundaries change materially.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - Phase 3: Enforcing Strict TypeScript Compilation

**Severity:** Critical

**Details:**
* Removed `ignoreBuildErrors: true` from `next.config.ts`, asserting production-grade strict compilation standards.
* Injected `gen:types` script into `package.json` to allow straightforward schema-to-type synchronization.
* Manually mapped missing database tables (e.g., `office_member_overage`) and newly implemented RPCs (`create_office_transaction`, `has_permission`, `nightly_maintenance`) directly into `src/types/database.ts` due to missing `project-id` locally.
* Purged unsafe `(db as any)` castings in Next.js Server Actions (specifically `admin.ts`, `team.ts`, `subscription.ts`, `onboarding.ts`, and `settings.ts`), replacing them with exact statically-typed derivations.
* Successfully ran `npm run build` with `0` type errors across the framework.

**Root Cause:**
* Suppressing build compilation errors via `ignoreBuildErrors` hid lethal database relational disconnects which resulted in unpredictable payload structures downstream. Wait-and-see types mapping with `any` bypassed crucial Supabase typing features.

**Affected Components:**
* `next.config.ts`
* `package.json`
* `src/types/database.ts`
* All major server actions inside `src/lib/actions/*`

**Dependencies:**
* Derived implicitly from schema alignment carried out in Phase 1 and 2.
* Precludes the final phase Phase 4 (Email System).

**Regression Risk:**
* Minimal. The type checking correctly guarantees runtime safety, provided that `database.ts` accurately mirrors the production deployed PostgreSQL schema (which it now does).

**Solution:**
* Stripped bypass mechanisms enforcing TS compiler validation strictly at `next build` phase.

**Prevention:**
* NEVER use `ignoreBuildErrors: true` in production, and never bypass newly added DB constructs with `(db as any)` moving forward. Use `npm run gen:types` instead.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - CRITICAL DEFERRAL: Nightly Maintenance Cron Activation

**Severity:** Low (Currently) / High (When scaling)

**Details:**
* Successfully wrote the database schema logic for the State Machine `nightly_maintenance()`.
* Deferred the actual scheduling/triggering of this Postgres function because the project is currently utilizing a Supabase Free Plan where the `pg_cron` extension is locked.

**Root Cause:**
* Supabase platform restrictions limiting `pg_cron` to Pro Plans ($25/mo) and beyond.

**Affected Components:**
* Infrastructure / Background Processes (No frontend or DB downtime).

**Dependencies:**
* Requires an infrastructure upgrade.

**Regression Risk:**
* Zero.

**Solution:**
* Relying exclusively on React's `SubscriptionGuard` to trap users trying to bypass the software logic based on dates. Technically, a user's subscription inside DB remains `active` if they never log back in, but if they hit the site, the UI blocks them.

**Prevention:**
* MUST remember to activate either a free external GitHub Action (firing edge function HTTP requests) or `pg_cron` when migrating to production/Pro to normalize statistical charts and sales records safely.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - Phase 2: Subscription State Machine (Nightly Maintenance)

**Severity:** High

**Details:**
* Created SQL Migration `20260405000003_nightly_maintenance.sql`.
* Implemented `nightly_maintenance()` Postgres Function to transition subscription states securely within the database based on predefined grace periods.
* Handled transitions: (`active`/`trialing` -> `past_due`) and (`past_due` -> `expired` after 7 days).
* Left Overage tracking unaffected since `SubscriptionGuard` intrinsically validates dynamic deadlines without requiring static state synchronization.
* Prepared `pg_cron` schedule query for manual activation depending on Supabase Plan rules.

**Root Cause:**
* "Lazy Evaluation" mechanism natively resulted in accurate runtime locks but inaccurate static data. Subscriptions were not chronologically transitioning correctly without interaction.

**Affected Components:**
* Supabase Database schema (`public.nightly_maintenance`)

**Dependencies:**
* Depends on the presence of the 7 statuses previously implemented.
* Precedes TypeScript Phase 3.

**Regression Risk:**
* Low. Does not modify UI logic. Acts only as a database cleaner correcting historical states behind the scenes. Idempotent logic restricts query side-effects.

**Solution:**
* Unified scheduled state management centrally in the Database (`plpgsql`) enforcing the business logic State Machine directly at the persistence layer, avoiding Next.js edge timeouts.

**Prevention:**
* Ensure cron functions implement `WHERE status != 'TARGET'` to remain Idempotent and avoid updating `updated_at` timestamps needlessly on subsequent executions.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - Phase 1: Atomic Onboarding Implementation (DB Transactions)

**Severity:** Critical

**Details:**
* Created SQL Migration `20260405000002_atomic_onboarding.sql` containing the `create_office_transaction` RPC.
* Refactored `createOfficeWithTrial` in `src/lib/actions/onboarding.ts` to call this single RPC instead of executing 4 sequential manual insert calls.
* Temporarily bypassed TypeScript `rpc` type errors visually `(adminSupabase.rpc as any)` until types are explicitly generated in Phase 3.

**Root Cause:**
* Onboarding workflow used non-atomic sequential inserts across `offices`, `office_members`, `office_subscriptions`, and `audit_logs` tables. 
* Any network failure or generic insert failure mid-operation created orphaned database records (e.g. an office without an owner or a trial).

**Affected Components:**
* `src/lib/actions/onboarding.ts`
* Supabase Database schema (`public.create_office_transaction`)

**Dependencies:**
* Requires `20260405000001_restructure_plans.sql` to be fully applied to correctly map plan structure.
* Precedes Phase 2 (Cron Jobs).

**Regression Risk:**
* Medium. Modifies the primary law-firm registration gateway. If the RPC signature differs from the frontend expectations, registration completely drops.

**Solution:**
* Offloaded the entire creation operation to Postgres (`plpgsql`) using a `SECURITY DEFINER` function with `EXCEPTION WHEN OTHERS THEN RAISE;`, assuring strict Atomicity.

**Prevention:**
* Never perform sequential inserts for core interdependent DB setups in standard Server Actions. Must use RPC / Edge functions encapsulating transactions. 
* Always ensure RPC exception is correctly picked up and mapped to Arabic user-facing errors in Next.js Server Actions.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - Activate Strict Execution Mode (AI Enforcement)

**Severity:** High

**Details:**
* Created `.agent/rules/00-strict-execution.mdc` based on the AI Agent Enforcement Prompt.
* Updated `AGENTS.md` to reference this new strict rule forcefully.
* Standardized `DEVELOPMENT_LOG.md` to use the English Structural Template for better AI processing.

**Root Cause:**
* AI naturally drifts towards blind execution without forced chain-of-thought and risk constraints.

**Affected Components:**
* AI Agent environment (`.agent/rules` directory, `AGENTS.md`).

**Dependencies:**
* Depends on the foundational logging system introduced previously.

**Regression Risk:**
* Low. Only affects agent prompts and prevents dangerous overrides.

**Solution:**
* Created a global rule (`00-strict-execution.mdc`) to force Chain-of-Thought (Context, Risk, Dependency Validation) before code execution.

**Prevention:**
* Auto-stop rule added for agents who do not complete the checklist.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.

---

## [2026-04-05] - Establish Persistent Logging System & Agent Rules

**Severity:** Critical

**Details:**
* Created `DEVELOPMENT_LOG.md` as the central project memory system.
* Added `AI Agent Behavior & Maintenance Rules` inside `AGENTS.md`.
* Enforced rule: Agents must read and update this log in every session.

**Root Cause:**
* AI agents were losing context between sessions.
* No persistent memory of past issues, dependencies, or fixes.

**Affected Components:**
* Entire system (global impact)
* All future features and modifications

**Dependencies:**
* This is the foundational change.
* ALL future changes depend on this system.

**Regression Risk:**
* High: If ignored, system instability and repeated bugs will occur.

**Solution:**
* Enforced mandatory logging system.
* Integrated log-reading behavior into agent workflow via `AGENTS.md`.

**Prevention:**
* Agents must always read this file before making changes and update it after tasks.

**Pre-Execution Checklist (for future agents):**
* N/A

---

# 🧬 Suggested Future Structure (Template)

Use this template for all future entries:

---

## [DATE] - Title

**Severity:** Critical / High / Medium / Low

**Details:**
...

**Root Cause:**
...

**Affected Components:**
* ...

**Dependencies:**
* ...

**Regression Risk:**
* High / Medium / Low + explanation

**Solution:**
...

**Prevention:**
...

**Pre-Execution Checklist (for future agents):**
* ...

---
