# 🔍 تقرير تدقيق الميزات — نظام ميزان
## Feature Audit Report
**تاريخ التدقيق:** 2026-04-26

---

## [01] تفعيل Cron Job عبر GitHub Actions
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- DB: دالة `nightly_maintenance()` موجودة في `supabase/migrations/20260405000003_nightly_maintenance.sql` — تنقل الاشتراكات من `active/trialing` → `past_due` → `expired`
- Backend: الدالة مُسجّلة ومُعطاة `GRANT EXECUTE` لـ `service_role`
- Frontend: لا ينطبق

**الموجود بالفعل:** الدالة مكتوبة ومنشورة في DB. أسطر `pg_cron` موجودة لكنها **معلّقة (commented out)** بسبب أن المشروع على Free Plan.
**الناقص:** لا يوجد مجلد `.github/workflows/` إطلاقاً. لا يوجد Edge Function بديل. الدالة لا تُستدعى تلقائياً — النظام يعتمد كلياً على `SubscriptionGuard` في الواجهة.

**ملاحظات تقنية:** هذا خطر أمني: إذا دخل مستخدم عبر API مباشرة أو أداة خارجية، لن يتم تطبيق انتهاء الصلاحية. يجب إنشاء GitHub Action أو Edge Function يستدعي `SELECT nightly_maintenance()` يومياً.

---

## [02] تفضيلات الإشعارات التفصيلية
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- DB: `offices.settings` JSONB يحتوي افتراضياً على 3 مفاتيح: `session_reminders`, `task_completed`, `subscription_updates` (من `20260327000000_init.sql` سطر 35)
- Backend: `src/lib/actions/settings.ts` — `updateOfficeSettingsAction()` يحفظ هذه الثلاثة فقط. `src/lib/validations/settings.ts` يعرّف `officeSettingsSchema` بنفس الحقول الثلاثة
- Frontend: `src/app/dashboard/settings/SettingsForm.tsx` — يعرض 3 switches لتفضيلات الإشعارات

**الموجود بالفعل:** UI + Backend + DB متصلين بالكامل لـ 3 أنواع إشعارات
**الناقص:** لا يوجد منطق يقرأ هذه التفضيلات فعلياً قبل إرسال إشعار. لا يوجد أي كود في `notifications.ts` أو أي Server Action آخر يتحقق من `offices.settings` قبل `INSERT INTO notifications`. التفضيلات تُحفظ لكن لا تُطبّق.

**ملاحظات تقنية:** التفضيلات حالياً "ديكور" فقط — تحتاج لإضافة فحص `offices.settings` في كل نقطة تُنشئ إشعاراً.

---

## [03] تنبيهات المواعيد النهائية (Due Date Alerts)
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- DB: عمود `due_date date` موجود في جدول `tasks` (من `20260327000000_init.sql` سطر 153)
- Backend: `src/lib/actions/tasks.ts` — يحفظ ويقرأ `due_date` بشكل صحيح
- Frontend: `src/app/dashboard/tasks/TaskCard.tsx` سطر 52 — يحسب `isOverdue` ويُغيّر لون الكارت للأحمر عند التجاوز

**الموجود بالفعل:** عمود DB + حفظ/قراءة في Actions + تمييز بصري أحمر في `TaskCard` عند تجاوز `due_date`
**الناقص:** لا يوجد أي trigger أو cron أو Server Action يُنشئ إشعاراً تلقائياً عند اقتراب/تجاوز الموعد. التنبيه بصري فقط داخل صفحة المهام.

**ملاحظات تقنية:** يحتاج إلى cron job أو Edge Function يفحص المهام المتأخرة يومياً ويُنشئ إشعارات.

---

## [04] كاشف تضارب المصالح (Conflict of Interest)
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد عمود `opposing_party` في جدول `cases`. بحث في جميع الـ migrations — لا أثر
- Backend: لا يوجد أي منطق تحقق من تكرار أسماء في `src/lib/actions/cases.ts`
- Frontend: لا يوجد حقل "الطرف المقابل" في `CaseDialog`

**الموجود بالفعل:** لا شيء
**الناقص:** كامل الميزة — عمود DB + Action للتحقق + حقل UI + تحذير بصري

---

## [05] Global Search + Command Palette (Cmd+K)
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- DB: لا يوجد RPC للبحث الشامل عبر جداول متعددة. يوجد `search_sessions` RPC فقط
- Backend: كل module له `searchQuery` مستقل (cases, clients, sessions, tasks) — لا يوجد تجميع
- Frontend: `src/components/layout/Topbar.tsx` سطر 110-117 — يوجد حقل بحث بصري (`<Input type="search">`) لكنه **غير متصل بأي منطق**. لا يوجد `cmdk` في `package.json`

**الموجود بالفعل:** حقل بحث في Topbar (شكلي فقط) + بحث مستقل داخل كل module
**الناقص:** ربط حقل البحث بمنطق فعلي — إما RPC شامل أو Command Palette (cmdk). حالياً الحقل لا يعمل.

---

## [06] Audit Log UI
**الحالة:** ✅ مكتمل

**ما تم فحصه:**
- DB: جدول `audit_logs` موجود (init migration سطر 175). Triggers تلقائية على `cases, clients, sessions, tasks, office_members` (migration `20260402000006`)
- Backend: `src/lib/actions/team.ts` سطر 465 — `getAuditLogs()` يجلب آخر 100 سجل مع فحص صلاحية `view_audit_logs`
- Frontend: صفحة `/dashboard/logs` — `page.tsx` + `LogsTable.tsx` موجودين ويعملان مع حماية صلاحيات

**الموجود بالفعل:** DB (جدول + triggers تلقائية) + Backend (action + permission check) + Frontend (صفحة + جدول) — سلسلة كاملة
**الناقص:** لا شيء — الميزة مكتملة

---

## [07] List View Toggle (Kanban + جدول)
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- Frontend: `src/app/dashboard/tasks/` يحتوي فقط على `KanbanBoard.tsx` و `TaskCard.tsx` و `TaskDialog.tsx`. لا يوجد `TaskTable` أو `ListView`. لا يوجد زر تبديل

**الموجود بالفعل:** عرض Kanban فقط
**الناقص:** مكوّن `TaskTable/ListView` + زر Toggle + حفظ حالة العرض

---

## [08] Home Dashboard Analytics (KPIs)
**الحالة:** ✅ مكتمل

**ما تم فحصه:**
- Backend: `src/app/dashboard/page.tsx` — Server Component يجلب 7 استعلامات بالتوازي: إجمالي القضايا، القضايا النشطة، العملاء، جلسات الأسبوع، قائمة الجلسات القادمة، حالة الاشتراك، عدد الأعضاء
- Frontend: 4 بطاقات KPI + جدول "الجلسات القادمة" + ويدجت الاشتراك مع progress bar + Quick Actions

**الموجود بالفعل:** Dashboard كامل مع KPIs + Upcoming Sessions + Subscription Status
**الناقص:** لا شيء أساسي — يمكن تحسينها لاحقاً بإضافة "المهام المتأخرة" أو charts

---

## [09] أيام وساعات العمل + تحذير العطل
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد مفتاح `workingDays` أو `holidays` في `offices.settings` JSONB الافتراضي
- Backend: `officeSettingsSchema` لا يحتوي أي حقول لأيام العمل
- Frontend: لا يوجد أي تحقق من العطل في `SessionDialog`

**الموجود بالفعل:** لا شيء
**الناقص:** كامل الميزة

---

## [10] ربط المهام بجلسات (Smart Links)
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: جدول `tasks` يحتوي `case_id` فقط. لا يوجد `session_id` (فُحص init migration سطر 146-159)
- Backend: `taskSchema` في `src/lib/validations/tasks.ts` لا يحتوي `session_id`
- Frontend: `TaskDialog` لا يعرض dropdown لاختيار جلسة

**الموجود بالفعل:** ربط المهام بقضايا (`case_id`) فقط
**الناقص:** عمود `session_id` في DB + حقل في Schema + dropdown في TaskDialog

---

## [11] تصميم كروت المهام (UI Enhancement)
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- Frontend: `src/app/dashboard/tasks/TaskCard.tsx` — يستخدم ألوان مختلفة للأولوية (أخضر/أصفر/أحمر) سطر 46-50. يوجد `rounded-lg`, `shadow-sm`, `hover:shadow-md`. تمييز بصري لـ `isOverdue`

**الموجود بالفعل:** تمييز أولوية بالألوان + shadows + rounded + overdue styling
**الناقص:** لا يستخدم هوية "Digital Atelier" (اللون الذهبي `#C9A84C`). الألوان عامة (`bg-red-100`, `bg-yellow-100`) وليست من نظام التصميم المعتمد

---

## [12] Web Push Notifications
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد جدول `push_subscriptions` في أي migration
- Backend: لا يوجد `web-push` في `package.json`. لا يوجد VAPID keys
- Frontend: لا يوجد `public/sw.js` أو Service Worker. لا يوجد `Notification.requestPermission()` في أي ملف

**الموجود بالفعل:** لا شيء — الإشعارات حالياً in-app فقط (جدول `notifications` + `NotificationsList` component)
**الناقص:** كامل البنية التحتية — Service Worker + VAPID + Push Subscription + جدول DB

---

## [13] إدارة الأتعاب القانونية (Client Billing)
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد `case_fees`, `invoices`, أو `client_payments` في أي migration. جدول `payments` الموجود هو لاشتراكات المنصة فقط
- Backend: لا يوجد أي Server Action يتعلق بأتعاب العملاء
- Frontend: لا يوجد قسم مالي في صفحة القضية أو العميل

**الموجود بالفعل:** لا شيء
**الناقص:** كامل الميزة

---

## [14] القوائم المرجعية / Checklists (Sub-tasks)
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد عمود `checklist` أو `subtasks` في جدول `tasks`
- Backend: لا يوجد أي منطق للخطوات الفرعية
- Frontend: لا يوجد واجهة checklists في `TaskDialog` أو `TaskCard`

**الموجود بالفعل:** لا شيء
**الناقص:** عمود JSONB في DB + واجهة إضافة/تعديل + progress bar في الكارت

---

## [15] رفع شعار المكتب (Office Branding)
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد عمود `logo_url` في جدول `offices`. لا يوجد `branding` JSONB
- Backend: لا يوجد أي استخدام لـ `supabase.storage` في أي Server Action
- Frontend: لا يوجد زر رفع صورة في الإعدادات. الـ Sidebar لا يعرض شعار مكتب

**الموجود بالفعل:** لا شيء
**الناقص:** عمود DB + Storage Bucket + Upload UI + عرض في Sidebar

---

## [16] إرفاق الملفات والمستندات
**الحالة:** ❌ غير موجود

**ما تم فحصه:**
- DB: لا يوجد جدول `attachments` أو `documents` في أي migration
- Backend: لا يوجد استخدام لـ `supabase.storage` في أي ملف ضمن `src/`
- Frontend: كلمة "attachments" تظهر فقط في `SessionDetailClient.tsx` و `CaseDialog.tsx` كنصوص عرض (labels) — لا يوجد وظيفة رفع فعلية

**الموجود بالفعل:** لا شيء سوى عناصر واجهة وهمية (placeholder labels)
**الناقص:** جدول DB + Storage Bucket + Upload Server Action + UI فعلية

---

## [17] إعادة تسمية خطط الاشتراك
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- DB: migration `20260405000001_restructure_plans.sql` يحتوي 7 خطط فعلية:
  - `individual` → "فردي" (149₪/شهري)
  - `office` → "مكتب" (349₪/شهري)
  - `institution` → "مؤسسة" (699₪/شهري)
  - `individual_yearly` → "فردي سنوي" (1490₪)
  - `office_yearly` → "مكتب سنوي" (3490₪)
  - `institution_yearly` → "مؤسسة سنوية" (6990₪)
  - `enterprise` → "مؤسسي" (0₪, contact)
- Frontend: `PlansGrid.tsx` يعرض `plan.name` من DB مباشرة

**الموجود بالفعل:** بنية الخطط موجودة وقابلة للتعديل عبر DB
**الناقص:** لا يوجد Toggle شهري/سنوي في UI — كل الخطط تُعرض معاً. أوصاف الخطط عامة ("موجهة خصيصاً للتغطية الفعالة" — نفس النص لكل الخطط)

---

## [18] تصميم صفحة الاشتراكات (Pricing Page)
**الحالة:** ⚠️ جزئي

**ما تم فحصه:**
- Frontend: `src/app/dashboard/subscription/page.tsx` — تحتوي 3 أقسام: SubscriptionOverview + PlansGrid + BillingHistoryTable
- `PlansGrid.tsx` — يعرض الخطط في `grid-cols-3`. الخطة الحالية تحصل على `border-primary ring-1`. لا يوجد تمييز "الخطة الموصى بها"

**الموجود بالفعل:** صفحة وظيفية مع كروت خطط + سجل مدفوعات + حالة الاشتراك الحالي
**الناقص:** لا يوجد Toggle شهري/سنوي. لا يوجد تمييز بصري لخطة موصى بها (highlighted). أوصاف الخطط عامة وغير مخصصة. التصميم لا يتبع هوية Digital Atelier.

---

## ملخص تنفيذي

| # | الميزة | الحالة |
|---|--------|--------|
| 01 | Cron Job (GitHub Actions) | ⚠️ جزئي |
| 02 | تفضيلات الإشعارات | ⚠️ جزئي |
| 03 | تنبيهات المواعيد النهائية | ⚠️ جزئي |
| 04 | كاشف تضارب المصالح | ❌ غير موجود |
| 05 | Global Search (Cmd+K) | ⚠️ جزئي |
| 06 | Audit Log UI | ✅ مكتمل |
| 07 | List View Toggle | ❌ غير موجود |
| 08 | Dashboard KPIs | ✅ مكتمل |
| 09 | أيام العمل والعطل | ❌ غير موجود |
| 10 | ربط المهام بجلسات | ❌ غير موجود |
| 11 | تصميم كروت المهام | ⚠️ جزئي |
| 12 | Web Push Notifications | ❌ غير موجود |
| 13 | إدارة الأتعاب القانونية | ❌ غير موجود |
| 14 | Checklists / Sub-tasks | ❌ غير موجود |
| 15 | رفع شعار المكتب | ❌ غير موجود |
| 16 | إرفاق الملفات | ❌ غير موجود |
| 17 | إعادة تسمية الخطط | ⚠️ جزئي |
| 18 | تصميم صفحة الاشتراكات | ⚠️ جزئي |

**الإحصائيات:** ✅ 2 مكتمل | ⚠️ 7 جزئي | ❌ 9 غير موجود
