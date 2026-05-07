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

## [2026-05-07] — Phase B: Case & Session Attachments

**Severity:** Medium (new DB tables + RLS + server actions + UI)

**Step 0 — Discovery Results:**
- Cases table: `cases` (PK: `id uuid`)
- Sessions table: `sessions` (PK: `id uuid`)
- Case detail: `/dashboard/cases/[caseId]`
- Session detail: `/dashboard/sessions/[sessionId]`
- No existing `case_attachments` or `session_attachments` tables
- Roles: `owner`, `admin`, `lawyer`, `secretary`, `trainee`

**Database Migration:**
- Migration file: `supabase/migrations/20260507_attachments.sql`
- Created `case_attachments` table (9 columns, RLS enabled)
- Created `session_attachments` table (9 columns, RLS enabled)
- RLS policies: SELECT/INSERT for office members, DELETE for uploader or admin/owner

**Type Updates:**
- `database.ts`: Added `case_attachments` and `session_attachments` full Row/Insert/Update types

**Server Actions (NEW FILE):**
- `src/lib/actions/attachments.ts`
  - `getCaseAttachments(caseId)` → joins profiles for uploader name
  - `uploadCaseAttachment(caseId, formData)` → validates type+size, uploads to `uploads/cases/{caseId}/`
  - `deleteCaseAttachment(attachmentId)` → permission check + storage cleanup
  - `getSessionAttachments(sessionId)` — same pattern
  - `uploadSessionAttachment(sessionId, formData)` — same pattern
  - `deleteSessionAttachment(attachmentId)` — same pattern
- All follow `ActionResult<T>` pattern

**Reusable Component (NEW):**
- `src/components/attachments/AttachmentsSection.tsx`
- Handles: list, upload, delete, empty state, loading state
- File icons by type (📄 PDF, 🖼 image, 📝 Word, 📎 other)
- Human-readable file sizes
- Delete button: visible on hover (always visible on mobile)
- Delete confirmation dialog
- Files open in new tab (`target="_blank"`)

**UI Integration:**
- Case detail: "المستندات" tab replaced with "المرفقات" (enabled, no longer placeholder)
- Session detail: placeholder attachments section replaced with real `AttachmentsSection`
- Both pages now pass `currentUserId` and `userRole` from server component

**Accepted File Types:** JPEG, PNG, WebP, PDF, DOC, DOCX
**Max File Size:** 15MB (server-side validated)

**Storage Paths:**
- `uploads/cases/{case_id}/{timestamp}_{filename}`
- `uploads/sessions/{session_id}/{timestamp}_{filename}`

**Build Status:** ✅ `npm run build` → Exit code: 0
**Dependencies:** None added

---

## [2026-05-07] — Bug Fix: Avatar & Logo Display Issues

**Severity:** Low (UI rendering bugs — no schema changes)

**Root Causes Found & Fixed:**

### 1. Topbar — Avatar Not Showing
- **Root cause:** `Topbar.tsx` يجلب `full_name` فقط من `profiles` — `avatar_url` لم يكن مجلوباً أبداً
- **Fix:** إضافة `avatar_url` لـ select query + إضافة `Image` component + conditional rendering
- **File:** `src/components/layout/Topbar.tsx`

### 2. ProfileForm — Lightbox Not Opening on Avatar Click
- **Root cause:** لم يكن هناك `previewOpen` state ولا lightbox JSX ولا `onClick` على الأفاتار
- **Fix:** إضافة `previewOpen` state + تغليف الأفاتار بـ `onClick` + إضافة lightbox overlay في نهاية الـ component
- **File:** `src/app/dashboard/profile/ProfileForm.tsx`

### 3. SettingsClient — Lightbox Not Opening on Logo Click
- **Root cause:** نفس مشكلة ProfileForm — لم يكن هناك lightbox منفصل للشعار
- **Fix:** إضافة `logoLightboxOpen` state + `cursor-pointer` + `onClick` على الشعار + lightbox JSX
- **File:** `src/app/dashboard/settings/SettingsClient.tsx`

**Verification:**
- `next.config.ts` — `remotePatterns` للـ Supabase storage سليم ✅ (لم يُعدَّل)
- `npm run build` → Exit code: 0 ✅

---

## [2026-05-07] — صور العملاء وأعضاء الفريق [Member & Client Photos — Phase A]

**Severity:** Low (UI enhancement, no DB migration needed)

**Key Finding:** `clients.avatar_url` already exists in DB — no migration needed. The column was added in a prior migration but wasn't being utilized with upload functionality.

**Server Actions Updated:**
- `clients.ts`: إضافة `uploadClientPhoto` — upload to `uploads/clients/{clientId}/photo.{ext}`, validates 2MB + image types
- `team.ts`: توسيع `getTeamMembers` select لتشمل `profiles.avatar_url`

**UI Changes — Team Members List:**
- `TeamMemberList.tsx`: عرض صورة العضو بدلاً من الحروف الأولى عند توفر `avatar_url`
- تحديث `MemberRowExt` type لتشمل `avatar_url`
- Permissions dialog: عرض صورة العضو في header

**UI Changes — Clients List:**
- `ClientTableList.tsx`: استبدال `<img>` بـ `<Image>` من `next/image`

**UI Changes — Client Detail Page:**
- `ClientDetailClient.tsx`: إضافة زر كاميرا لرفع الصورة + optimistic preview
- Lightbox: عرض الصورة بالحجم الكامل عند النقر عليها
- Upload: التحقق من النوع والحجم (client-side + server-side)

**Storage Paths Used:**
- `uploads/clients/{clientId}/photo.{ext}` — صور العملاء (جديد)
- `uploads/avatars/{userId}/avatar.{ext}` — صور الأعضاء (موجود سابقاً)

**Build Status:** ✅ `npm run build` — Exit code: 0
**Lint Status:** ✅ No new lint errors

**Dependencies:** لا توجد مكتبات جديدة

---

## [2026-05-07] — إعادة بناء صفحة الإعدادات + الملف الشخصي [Settings & Profile Rebuild]

**Severity:** Medium (DB migration + new Storage bucket + UI rebuild)

**Migration Applied:** `20260507_settings_profile_columns.sql`
- 7 أعمدة جديدة لجدول `offices`: `logo_url`, `specialization`, `license_number`, `address`, `working_days` (jsonb), `working_hours_start`, `working_hours_end`
- 2 عمودين جديدين لجدول `profiles`: `avatar_url`, `job_title`
- Storage bucket جديد: `uploads` (public) مع policies لـ authenticated users
- مجلدات: `uploads/logos/{office_id}`, `uploads/avatars/{user_id}`

**Server Actions Updated:**
- `settings.ts`: توسيع `updateOfficeSettingsAction` + إضافة `uploadOfficeLogo` + `getActivityLog`
- `profile.ts`: توسيع `updateProfileAction` + إضافة `uploadAvatar`
- جميع Actions تتبع `ActionResult<T>` pattern

**Validation Schemas Updated:**
- `settings.ts`: إضافة `specialization`, `license_number`, `address`, `working_days`, `working_hours_start/end`
- `profile.ts`: إضافة `job_title`

**UI Changes — Settings Page [REBUILT]:**
- حذف `SettingsForm.tsx` → استبدال بـ `SettingsClient.tsx`
- 4 أقسام: هوية المكتب (مع Logo upload) | أوقات العمل | الأمان (سجل النشاط) | الإشعارات
- Logo upload مع preview دائرية + cache-busting
- أيام العمل كـ toggle buttons (بدون Checkbox component)
- سجل نشاط من `audit_logs` (آخر 10 سجلات)

**UI Changes — Profile Page [REBUILT]:**
- Header مع تدرج لوني + Avatar upload دائري + role badge
- حقول: الاسم الكامل | البريد الإلكتروني (read-only) | الهاتف | المسمى الوظيفي | الدور
- Avatar upload مع camera icon overlay

**Types Updated:** `database.ts` — إضافة الأعمدة الجديدة لـ `offices` و `profiles`

**Build Status:** ✅ `npm run build` — Exit code: 0

**Dependencies:** لا توجد مكتبات جديدة

**Future TODOs (مسجلة في الكود):**
- Active sessions management with device count
- Geo-location approximation in activity log
- Official holidays calendar integration
- Advanced notification preferences
- Per-member billing logic

---

## [2026-04-27] — ضبط خطط الاشتراك + تحسين تصميم صفحة الاشتراكات [17+18]

**Severity:** High (Production pricing change + DB migration)

**Migration Applied:** `20260427150000_update_plan_prices_and_add_extra_user_price.sql`
- عمود جديد: `extra_user_price numeric DEFAULT 0`
- تحديث أسعار كل الخطط النشطة (ILS)
- تحديث `max_users` (office: 5→10, institution: 15→20)
- تحديث الأسماء التجارية في DB

**New Pricing (ILS):**
| slug | name | monthly | yearly | max_users | extra_user_price |
|---|---|---|---|---|---|
| individual | الأساس | 40 | 400 | 1 | 0 |
| office | الاحتراف | 150 | 1,500 | 10 | 20 |
| institution | الريادة | 300 | 3,000 | 20 | 20 |
| enterprise | المؤسسات | 0 | — | 9999 | 0 |

**UI Changes — PlansGrid.tsx [REBUILT]:**
- Toggle شهري/سنوي بتصميم pill مع badge "وفّر ~17%"
- خطة الاحتراف مميزة كـ "الأكثر شعبية" (ring-2 ring-amber-400)
- `PLAN_DISPLAY_NAMES` للعرض البصري — لا يعتمد على DB names
- السعر السنوي يعرض المكافئ الشهري + "يُدفع سنوياً"
- معلومة الأعضاء الإضافيين تحت السعر
- Enterprise يعرض "تواصل معنا" بدلاً من السعر
- قوائم ميزات لكل خطة
- رمز العملة ₪ (وليس $)

**Page Header — page.tsx [MODIFIED]:**
- عنوان: "خطط الاشتراك" — نص فرعي: "اختر الخطة المناسبة لمكتبك"

**Affected Files:**
- `supabase/migrations/20260427150000_update_plan_prices_and_add_extra_user_price.sql` [NEW]
- `src/app/dashboard/subscription/PlansGrid.tsx` [REBUILT]
- `src/app/dashboard/subscription/page.tsx` [MODIFIED — header]

**⚠️ قرارات مستقبلية مُسجّلة (لا تنسها):**
1. **بوابة دفع** — عند إضافتها، استخدم `extra_user_price` لحساب التكلفة الإضافية
2. **Per-user billing** — `extra_user_price` جاهز في DB ولكن غير مُفعّل بعد
3. **جدول مقارنة الباقات** — مطلوب لصفحة الهبوط، استخدم `PLAN_FEATURES` من PlansGrid
4. **Slugs محمية** — لا تعدّل slugs أبداً (مرتبطة بـ subscriptions قائمة)

**Pre-Execution Checklist:**
- Did you read the latest log entries? Yes.
- Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-27] — إعادة بناء صفحة المهام: من Kanban إلى جدول + تقويم

**Severity:** High (Architecture change — component removal + dependency deletion)

**Why dnd-kit was removed:**
مكتبة `@dnd-kit` (core + sortable + utilities) أُزيلت بالكامل للأسباب التالية:
1. **السحب والإفلات لم يكن يعمل بشكل موثوق** — `handleDragOver` كان يعدّل الـ state قبل `handleDragEnd`، مما يمنع حفظ التغييرات في DB.
2. **Kanban غير مناسب لسير عمل مكتب المحاماة** — المحامي يحتاج جدول بفلاتر وتقويم شهري، وليس لوحة كانبان.
3. **تبسيط الـ bundle** — إزالة 4 حزم (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@dnd-kit/accessibility`).

**Details:**
* **حُذفت الملفات:**
  - `KanbanBoard.tsx` — لوحة كانبان بالكامل
  - `TaskCard.tsx` — بطاقة المهمة المرتبطة بالكانبان
* **أُزيلت التبعيات:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
* **أُعيد بناء `TaskTable.tsx`:**
  - عمود الحالة أصبح dropdown تفاعلي (inline) — تغيير الحالة يحدث مباشرة بـ optimistic update دون فتح Dialog
  - `useTransition` لتحديث غير حاجب للواجهة
  - أعمدة الإجراءات (تعديل/حذف) تظهر عند hover
  - التصميم يطابق هوية صفحة الجلسات
* **أُنشئ `TaskCalendarView.tsx`:**
  - منسوخ من `SessionCalendarView.tsx` ومُكيّف للمهام
  - المهام تظهر في يوم `due_date` بألوان الأولوية: ذهبي=عالية، أزرق=متوسطة، رمادي=منخفضة، أحمر=متأخرة
  - تنبيه يظهر عدد المهام بدون `due_date`
  - النقر يفتح `TaskDialog` للتعديل
* **أُعيد بناء `TasksClient.tsx`:**
  - Toggle: قائمة / تقويم (بدل كانبان/قائمة) — الافتراضي: قائمة
  - فلاتر: بحث + حالة + أولوية + قضية مرتبطة + زر مسح
  - Header يطابق صفحة الجلسات تماماً
  - Legend (دليل الألوان) يظهر دائماً
  - `localStorage` بمفتاح `mizan_tasks_view`
* **`TaskDialog.tsx` لم يُلمس** — قرار تصميمي مُعتمد من صاحب المشروع.

**Affected Files:**
* `src/app/dashboard/tasks/KanbanBoard.tsx` [DELETED]
* `src/app/dashboard/tasks/TaskCard.tsx` [DELETED]
* `src/app/dashboard/tasks/TaskTable.tsx` [REBUILT — inline status, optimistic update]
* `src/app/dashboard/tasks/TaskCalendarView.tsx` [NEW]
* `src/app/dashboard/tasks/TasksClient.tsx` [REBUILT — filters, toggle, header]
* `package.json` [MODIFIED — removed 3 dnd-kit packages]

**Regression Risk:**
* Medium. KanbanBoard was the primary tasks UI. Full replacement with Table+Calendar.
* `TaskDialog.tsx` is untouched — all edit/create flows preserved.
* Server Actions (`tasks.ts`) untouched — all CRUD logic preserved.

**Pre-Execution Checklist:**
* Did you read the latest log entries? Yes.
* Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-27] — إصلاحات واجهة وعمليات المهام (Task Fixes)

**Severity:** High (Core functionality bug fixes)

**Details:**
* **حل مشكلة السحب والإفلات (Drag & Drop):** تم إصلاح خطأ `dnd-kit` في `KanbanBoard.tsx` حيث كان `handleDragOver` يقوم بتحديث الـ state قبل استدعاء الدالة الخاصة بالتحديث في قاعدة البيانات (`handleDragEnd`). تم التقاط الكائن الأصلي (`originalTask`) لمقارنة الحالة بشكل صحيح قبل تحديث قاعدة البيانات، مما أصلح مشكلة سحب المهام بين الأعمدة (مثال: من "قيد الانتظار" إلى "مكتمل").
* **حل مشكلة التمرير في النافذة المنبثقة:** تم استبدال مكون `ScrollArea` من Shadcn (الذي كان يواجه مشاكل مع Flexbox في الشاشات الصغيرة) إلى `div` قياسي يستخدم `overflow-y-auto` في `TaskDialog.tsx`، مما يضمن ظهور كل الحقول وإمكانية التمرير بسلاسة على أي شاشة.
* **إضافة خيار الحذف داخل النافذة المنبثقة:** أضيف زر لحذف المهمة نهائياً `Trash2` بجوار أزرار الإلغاء والحفظ داخل الـ `TaskDialog` مع نظام تأكيد (Confirmation).
* **إضافة أزرار إجراءات صريحة لجدول المهام:** أُضيف عمود "إجراءات" إلى `TaskTable.tsx` يظهر عند التمرير (Hover) على كل صف، محتوياً على أزرار مباشرة لـ (التعديل / الحذف) بدلاً من الاكتفاء بالنقر على الصف.

**Affected Files:**
* `src/app/dashboard/tasks/KanbanBoard.tsx` [MODIFIED - Drag & drop logic fix]
* `src/app/dashboard/tasks/TaskDialog.tsx` [MODIFIED - Scroll fix + Delete action]
* `src/app/dashboard/tasks/TaskTable.tsx` [MODIFIED - Added Action buttons column]

**Regression Risk:**
* Low. All fixes target localized UI interaction problems without changing database schemas or global states.

**Pre-Execution Checklist:**
* Did you read the latest log entries? Yes.
* Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-27] — List View Toggle + هوية صفحة المهام [07 + 11]

**Severity:** Low (UI enhancement, no DB or action changes)

**Details:**
* أُنشئ `TaskTable.tsx` — جدول عرض قائمة بأعمدة: العنوان، الحالة، الأولوية، تاريخ الاستحقاق، المُسند إليه، القضية.
  - خلية التاريخ تُلوّن `text-red-600` + أيقونة `AlertTriangle` إذا تجاوز الـ due_date اليوم والمهمة غير مكتملة.
  - كل صف قابل للنقر → يفتح `TaskDialog` للتعديل.
* أُنشئ `TasksClient.tsx` — Client Component يملك state الـ view mode:
  - `viewMode: 'kanban' | 'list'` محفوظ في `localStorage` بمفتاح `mizan_tasks_view`.
  - يُقرأ من `localStorage` عند أول تحميل (default: 'kanban').
  - زر Toggle: `LayoutGrid` (لوحة) / `List` (قائمة) — الزر النشط `bg-amber-50 text-[#92741F]`.
* حُدّث `TaskCard.tsx` — هوية Digital Atelier:
  - أولوية عالية: `border-amber-400/60 bg-amber-50` + badge لون `#C9A84C`.
  - أولوية متوسطة: `border-blue-300/60 bg-blue-50`.
  - أولوية منخفضة: `border-gray-200 bg-gray-50`.
  - متأخرة: `border-red-400 bg-red-50` (يُلغي لون الأولوية).
  - `isOverdue` يتحقق من `status !== 'مكتملة'` بالعربية (متوافق مع DB).
* حُدّث `TaskDialog.tsx` — تصميم Digital Atelier المميز:
  - رأس نافذة بمتدرج أزرق/ذهبي مع لمسات ضوئية.
  - إضافة أيقونات (Lucide) لكل حقل بيانات لتحسين Scannability.
  - حقول إدخال مطورة بحواف `rounded-xl` وتأثيرات تركيز ذهبية.
  - استخدام حدود متقطعة (Dashed borders) للحقول الاختيارية.
  - زر تنفيذ العمليات بلون أزرق عميق مع تأثيرات حركية عند التفاعل.
* حُدّث `page.tsx` — Server Component نظيف يمرر البيانات لـ `TasksClient`.
* Header الصفحة يطابق الآن نمط `/dashboard/cases`: عنوان + badge العدد + أزرار.

**Affected Files:**
* `src/app/dashboard/tasks/TaskTable.tsx` [NEW]
* `src/app/dashboard/tasks/TasksClient.tsx` [NEW]
* `src/app/dashboard/tasks/TaskCard.tsx` [MODIFIED — priority colors + isOverdue fix]
* `src/app/dashboard/tasks/page.tsx` [MODIFIED — delegated to TasksClient]

**Regression Risk:**
* Low. `KanbanBoard.tsx` لم يُلمس. `TaskDialog.tsx` لم يُلمس.
* `isOverdue` في `TaskCard` كان يتحقق من `status !== 'done'` (قيمة إنجليزية) — الآن صُحّح لـ `'مكتملة'` (قيمة DB الحقيقية). هذا إصلاح وليس regression.

**Pre-Execution Checklist:**
* Did you read the latest log entries? Yes.
* Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-27] — بحث موحّد في Topbar (Global Search)

**Severity:** Low (feature addition, no breaking changes)

**Details:**
* أُنشئ **Supabase RPC** `global_search(search_query text)` عبر migration — يبحث في `cases`, `clients`, `sessions`, `tasks` مع حماية multi-tenancy عبر `current_office_id()`.
* كل subquery محدود بـ `LIMIT 5` — أقصى 20 نتيجة إجمالية.
* أُنشئ **Server Action** في `src/lib/actions/search.ts` — يستدعي الـ RPC مع validation (min 2 chars).
* تم تحويل `<Input>` الموجود في `Topbar.tsx` من عنصر زخرفي إلى بحث وظيفي:
  - Debounce 300ms لتقليل الاستعلامات
  - Dropdown يعرض نتائج مُجمّعة بالنوع مع أيقونات Lucide
  - Loading spinner أثناء البحث
  - Click على نتيجة → navigation للصفحة المناسبة
  - Escape أو click-outside → إغلاق Dropdown
  - لا dependencies جديدة — Tailwind + Lucide فقط

**Root Cause:**
* الـ `<Input>` في Topbar كان placeholder بصري بدون أي ربط بالبيانات.

**Affected Components:**
* `supabase/migrations/..._global_search_rpc.sql` [NEW — via MCP]
* `src/lib/actions/search.ts` [NEW]
* `src/components/layout/Topbar.tsx` — أُعيد كتابته مع الحفاظ على كل العناصر الأصلية
* `src/types/database.ts` — أُضيف `global_search` لـ Functions block

**Dependencies:**
* يعتمد على `current_office_id()` DB function (موجودة منذ init).
* يعتمد على RLS policies الموجودة على كل الجداول.

**Regression Risk:**
* Low. الـ Topbar أُعيد كتابته بالكامل لكن بنفس العناصر والأنماط الأصلية بالضبط. لا تغيير في Layout أو Sidebar.
* الـ `database.ts` أُضيف إليه type فقط — لا تعديل على types موجودة.

**Solution:**
* Supabase RPC + Server Action + Client-side debounced search في Topbar.

**Prevention:**
* عند إضافة modules جديدة (مثلاً documents)، يجب تحديث الـ `global_search` RPC بـ `UNION ALL` جديد.
* عند تغيير schema لأي جدول مُشمول في البحث، راجع الـ RPC.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.
* Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-27] — إشعارات تلقائية للمهام المتأخرة (Overdue Task Alerts)

**Severity:** Medium

**Details:**
* أُنشئت **Supabase Edge Function** باسم `check-overdue-tasks` (status: ACTIVE, verify_jwt: false).
* تبحث عن مهام تجاوزت `due_date` مع `status != 'مكتملة'` و `assigned_to IS NOT NULL`.
* الاستعلام يعمل بدون `WHERE office_id` عمداً — service_role context على كل المكاتب.
* لكل مهمة: تتحقق من `shouldSendNotification(office_id, 'task_completed')` عبر `offices.settings`.
* **منع التكرار:** تفحص إذا أُرسل إشعار بعنوان "مهمة متأخرة" لنفس الـ `related_entity_id` اليوم.
* **تحسين أداء:** تُخزّن إعدادات المكاتب في `Map` cache لتجنب تكرار الاستعلام لنفس المكتب.
* أُضيف كخطوة ثانية في `.github/workflows/nightly-maintenance.yml` بعد `nightly-cron`.
* رُفع `timeout-minutes` من 2 إلى 5 لاستيعاب الخطوتين.

**Root Cause:**
* `TaskCard.tsx` يحسب `isOverdue` بصرياً فقط — المستخدم يجب أن يدخل لصفحة المهام ليرى ذلك. لا يوجد إشعار تلقائي.

**Affected Components:**
* Supabase Edge Function `check-overdue-tasks` [NEW — deployed via MCP]
* `.github/workflows/nightly-maintenance.yml` — أُضيف Step 2

**Dependencies:**
* يعتمد على جدول `tasks` (أعمدة: `due_date`, `status`, `assigned_to`, `office_id`).
* يعتمد على `offices.settings` JSONB لتفضيلات الإشعارات.
* يستخدم نفس `CRON_SECRET` المُعدّ في الخطوة [01].
* يجب إضافة `CRON_SECRET` في Supabase Edge Function Secrets لهذه الـ Function أيضاً (تلقائياً مشترك إذا أُعدّ كـ project-level secret).

**Regression Risk:**
* Zero. لا يعدّل أي كود Frontend أو DB schema. Edge Function معزولة.

**Solution:**
* Edge Function تنفّذ دورياً عبر GitHub Action وتُنشئ صفوفاً في `notifications` للمهام المتأخرة.

**Prevention:**
* لا تُضف `WHERE office_id = current_office_id()` — هذه تعتمد على `auth.uid()` غير المتاح في سياق service_role.
* عند إضافة أنواع إشعارات جديدة للـ Cron، اتبع نفس نمط deduplication عبر `related_entity_id` + `title` + تاريخ اليوم.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.
* Did you run `npm run build`? Yes — Exit code: 0.

---

## [2026-04-27] — تطبيق تفضيلات الإشعارات فعلياً (Notification Preferences Enforcement)

**Severity:** Medium

**Details:**
* أنشئ `src/lib/utils/notifications.ts` يحتوي دالة `shouldSendNotification()` تقرأ تفضيلات الإشعارات من `offices.settings` JSONB.
* تدعم 3 أنواع: `session_reminders`, `task_completed`, `subscription_updates`.
* تُعيد `true` افتراضياً إذا فشل جلب الإعدادات (لا تكتم الإشعارات بسبب أخطاء).
* تم ربط الدالة في 4 ملفات Server Actions:

| الملف | الحدث | نوع التفضيل | المُشعَر |
|---|---|---|---|
| `tasks.ts` | إكمال مهمة (→ مكتملة) | `task_completed` | منشئ المهمة أو المُكلّف |
| `sessions.ts` | إنشاء جلسة جديدة | `session_reminders` | المحامي المُسند للقضية |
| `subscriptions.ts` | طلب ترقية اشتراك | `subscription_updates` | مالك المكتب |
| `cases.ts` | إسناد قضية (إنشاء + تعديل) | `session_reminders` | المحامي المُسند الجديد |

**Root Cause:**
* `SettingsForm.tsx` كان يحفظ التفضيلات في DB بنجاح، لكن لا يوجد كود يقرأها قبل `INSERT INTO notifications`. كانت مجرد switches بدون تأثير فعلي.

**Affected Components:**
* `src/lib/utils/notifications.ts` [NEW]
* `src/lib/actions/tasks.ts` — أُضيف إشعار إكمال المهمة + فحص التفضيل
* `src/lib/actions/sessions.ts` — أُضيف إشعار إنشاء جلسة + فحص التفضيل
* `src/lib/actions/subscriptions.ts` — أُضيف إشعار طلب ترقية + فحص التفضيل
* `src/lib/actions/cases.ts` — أُضيف إشعار إسناد قضية (create + update) + فحص التفضيل

**Dependencies:**
* يعتمد على عمود `offices.settings` JSONB (موجود منذ `20260327000000_init.sql`).
* يعتمد على جدول `notifications` (موجود منذ الـ init migration).
* لا يعتمد على أي حزمة جديدة.

**Regression Risk:**
* Low. جميع كتل الإشعار ملفوفة بـ `try/catch` (fire-and-forget). فشل الإشعار لا يؤثر على العملية الأساسية.
* تغيير في `cases.ts`: أُضيف `supabase.auth.getUser()` + `.select('id').single()` للـ insert — هذا لازم لتحديد من يجب إشعاره.
* تغيير في `tasks.ts`: أُضيف حقول إضافية لـ `existingTask` select (`status, title, created_by, assigned_to`).
* تغيير في `sessions.ts`: الـ insert أصبح يُرجع `.select('id').single()` للحصول على `related_entity_id`.

**Solution:**
* دالة مركزية واحدة (`shouldSendNotification`) تُستدعى من كل نقطة إنشاء إشعار. dynamic import لتجنب circular dependencies.

**Prevention:**
* أي إشعار جديد يُضاف مستقبلاً **يجب** أن يستدعي `shouldSendNotification()` أولاً.
* لا تُضف أنواع تفضيل جديدة بدون إضافتها في `SettingsForm.tsx` و `officeSettingsSchema`.

**Pre-Execution Checklist (for future agents):**
* Did you read the latest log entries? Yes.
* Did you run `npm run build`? Yes — Exit code: 0.

---

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
