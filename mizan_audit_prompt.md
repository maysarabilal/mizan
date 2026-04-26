# 🔍 مهمة تدقيق شاملة — نظام ميزان
## Comprehensive Feature Audit Task

---

## الهدف من هذه المهمة

قم بفحص قاعدة الكود الكاملة وأجب بدقة على حالة كل مقترح من المقترحات الـ 18 أدناه. لكل مقترح، حدد واحدة من ثلاث حالات:

- ✅ **موجود ومكتمل** — الميزة مطبقة بالكامل (DB + Backend + Frontend)
- ⚠️ **موجود جزئياً** — جزء منها مطبق (مثلاً: DB موجود لكن UI ناقص)
- ❌ **غير موجود** — لا يوجد أي أثر لها في الكود

---

## تعليمات الفحص

لكل مقترح، افحص هذه المستويات بالترتيب:
1. **قاعدة البيانات** — هل يوجد جدول / عمود / JSONB field / RPC يدعم هذه الميزة في `supabase/migrations/`؟
2. **الـ Server Actions** — هل يوجد action في `src/lib/actions/` يتعامل مع هذه الميزة؟
3. **الـ UI** — هل يوجد مكوّن / صفحة / واجهة في `src/app/` أو `src/components/` تعرض هذه الميزة؟
4. **ما الناقص بالضبط** — إذا كانت جزئية، حدد بالضبط ما هو موجود وما هو مفقود.

---

## المقترحات الـ 18 المطلوب فحصها

---

### [01] تفعيل Cron Job عبر GitHub Actions
**ما تبحث عنه:**
- هل ملف `.github/workflows/` موجود؟ وهل يوجد workflow يستدعي `nightly_maintenance`؟
- هل دالة `nightly_maintenance` موجودة في migrations وهل هي مفعّلة؟
- هل يوجد Supabase Edge Function مخصص لهذا؟
- **السياق:** سجل التطوير يذكر أن الدالة مكتوبة لكن `pg_cron` معطل بسبب Free Plan.

---

### [02] تفضيلات الإشعارات التفصيلية
**ما تبحث عنه:**
- في `offices.settings JSONB`: ما هي المفاتيح الموجودة حالياً؟ (المعروف: `sessionreminders`, `taskcompleted`, `subscriptionupdates`)
- في `src/lib/actions/settings.ts`: ما هي الحقول التي يقبلها `officeSettingsSchema`؟
- هل يوجد UI في صفحة الإعدادات يعرض checkboxes لكل نوع إشعار؟
- هل يوجد منطق يقرأ هذه التفضيلات قبل إرسال الإشعار؟

---

### [03] تنبيهات المواعيد النهائية (Due Date Alerts)
**ما تبحث عنه:**
- في جدول `tasks`: هل عمود `duedate` موجود؟
- هل يوجد أي trigger في DB أو Server Action يُنشئ إشعاراً عند اقتراب/تجاوز الـ duedate؟
- في الـ UI (TaskCard / KanbanBoard): هل يوجد منطق يغير لون الكارت إذا تجاوز الـ duedate؟
- هل يوجد أي scheduled job أو cron يفحص المهام المتأخرة؟

---

### [04] كاشف تضارب المصالح (Conflict of Interest)
**ما تبحث عنه:**
- في جدول `cases`: هل يوجد عمود `opposing_party` أو ما يشابهه؟
- في `src/lib/actions/cases.ts`: هل يوجد أي منطق يتحقق من تكرار اسم الطرف المقابل في جدول العملاء؟
- في UI إضافة قضية (CaseDialog): هل يوجد حقل للطرف المقابل؟ وهل يوجد تحذير بصري؟

---

### [05] Global Search + Command Palette (Cmd+K)
**ما تبحث عنه:**
- هل يوجد RPC أو Server Action يبحث في أكثر من جدول في نفس الوقت؟
- في الـ Topbar أو أي مكوّن عام: هل يوجد شريط بحث عام؟
- هل يوجد `cmdk` أو أي مكتبة Command Palette في `package.json`؟
- كل `searchQuery` موجود حالياً مستقل لكل module — هل يوجد أي تجميع؟

---

### [06] Audit Log UI
**ما تبحث عنه:**
- جدول `auditlogs` موجود في DB — مؤكد. السؤال هو عن الـ UI فقط.
- هل يوجد صفحة `/dashboard/logs` أو تبويب في الإعدادات يعرض هذه البيانات؟
- في `src/lib/actions/team.ts`: هل `getAuditLogs` action مكتوب ويُعيد بيانات؟
- هل يوجد مكوّن `LogsTable` أو ما يشابهه في `src/components/`؟

---

### [07] List View Toggle (Kanban + جدول)
**ما تبحث عنه:**
- في صفحة المهام `/dashboard/tasks`: هل يوجد زر للتبديل بين عرض Kanban وعرض List/Table؟
- هل يوجد مكوّن `TaskTable` أو `ListView` بجانب `KanbanBoard`؟
- هل حالة الـ View محفوظة (local state / localStorage / URL param)؟

---

### [08] Home Dashboard Analytics (KPIs)
**ما تبحث عنه:**
- في صفحة `/dashboard` الرئيسية: ما الذي يُعرض حالياً؟ هل هي صفحة ترحيب فارغة أم تحتوي KPIs؟
- هل يوجد Server Action يجمع إحصائيات المكتب (عدد القضايا المفتوحة، المهام المتأخرة، الجلسات القادمة)؟
- هل يوجد ويدجت "الجلسات القادمة هذا الأسبوع"؟
- هل يوجد أي chart أو رسم بياني في dashboard المكتب (ليس admin)?

---

### [09] أيام وساعات العمل + تحذير العطل
**ما تبحث عنه:**
- في `offices.settings JSONB`: هل يوجد مفتاح `workingDays` أو `holidays` أو ما يشابهه؟
- في `src/lib/actions/settings.ts`: هل يوجد حقل لأيام العمل في الـ schema؟
- في UI إضافة جلسة (SessionDialog): هل يوجد أي تحقق من أن التاريخ ليس يوم عطلة؟

---

### [10] ربط المهام بجلسات (Smart Links)
**ما تبحث عنه:**
- في جدول `tasks`: هل يوجد عمود `sessionid` بالإضافة للـ `caseid` الموجود؟
- في `src/lib/actions/tasks.ts` و `taskSchema`: هل يوجد حقل `sessionid`؟
- في `TaskDialog`: هل يوجد dropdown لاختيار جلسة معينة؟

---

### [11] تصميم كروت المهام (UI Enhancement)
**ما تبحث عنه:**
- في `TaskCard` component: هل يوجد تمييز بصري للأولوية العالية (لون مختلف / border / badge)؟
- هل يتم استخدام اللون الذهبي أو أي لون مميز للـ `priority: high`؟
- هل الكروت تستخدم shadows وrounded corners من نظام التصميم؟

---

### [12] Web Push Notifications
**ما تبحث عنه:**
- هل يوجد ملف `public/sw.js` أو `service-worker.js`؟
- هل يوجد جدول `push_subscriptions` في DB migrations؟
- هل يوجد أي كود VAPID keys أو `web-push` في `package.json`؟
- هل يوجد أي كود يطلب إذن `Notification` من المتصفح؟

---

### [13] إدارة الأتعاب القانونية (Client Billing)
**ما تبحث عنه:**
- هل يوجد جدول `case_fees` أو `invoices` أو `client_payments` في DB migrations؟
- هل يوجد أي Server Action في `src/lib/actions/` يتعلق بالأتعاب أو الفواتير للعملاء؟
- في صفحة القضية أو العميل: هل يوجد أي قسم مالي؟
- **تنبيه:** جدول `payments` الموجود هو لمدفوعات الاشتراك فقط وليس للعملاء.

---

### [14] القوائم المرجعية / Checklists (Sub-tasks)
**ما تبحث عنه:**
- في جدول `tasks`: هل يوجد عمود `checklist JSONB` أو `subtasks`؟
- في `TaskDialog`: هل يوجد واجهة لإضافة خطوات فرعية؟
- في `TaskCard`: هل يُعرض progress bar أو عداد للخطوات المنجزة؟

---

### [15] رفع شعار المكتب (Office Branding)
**ما تبحث عنه:**
- في جدول `offices`: هل يوجد عمود `logo_url` أو `branding JSONB`؟
- هل يوجد Supabase Storage bucket مخصص للشعارات؟
- في صفحة الإعدادات: هل يوجد زر رفع صورة؟
- في الـ Sidebar: هل يُعرض شعار المكتب بدلاً من النص؟

---

### [16] إرفاق الملفات والمستندات
**ما تبحث عنه:**
- هل يوجد جدول `attachments` أو `documents` في DB migrations؟
- هل يوجد Supabase Storage bucket للمستندات؟
- في صفحة القضية: هل يوجد قسم لرفع/تحميل الملفات؟
- هل يوجد أي استخدام لـ `supabase.storage` في Server Actions؟

---

### [17] إعادة تسمية خطط الاشتراك
**ما تبحث عنه:**
- ما هي قيم `name` الحالية في جدول `subscriptionplans` (من migrations أو seed data)؟
- ما هي قيم `slug` الحالية؟ (`individual`, `office`, `institution`, `legal_center` ؟)
- في UI صفحة الاشتراكات: هل يُعرض الاسم التجاري للخطة أم الـ slug؟
- هل يوجد أي hardcoded plan names في الكود غير في DB؟

---

### [18] تصميم صفحة الاشتراكات (Pricing Page)
**ما تبحث عنه:**
- صفحة `/dashboard/subscription`: ما هو تصميمها الحالي؟ كروت عادية أم مميزة؟
- هل يوجد Toggle بين الدفع الشهري والسنوي؟
- هل يوجد تمييز بصري (highlighted / recommended) لخطة معينة؟
- هل تُعرض المميزات لكل خطة بشكل مقارن؟

---

## صيغة التقرير المطلوبة

أنشئ ملف باسم `FEATURE_AUDIT_REPORT.md` في جذر المشروع بهذا الهيكل لكل مقترح:

```markdown
## [رقم] اسم المقترح
**الحالة:** ✅ مكتمل / ⚠️ جزئي / ❌ غير موجود

**ما تم فحصه:**
- DB: [نتيجة الفحص مع اسم الجدول/العمود/Migration إذا وُجد]
- Backend: [نتيجة الفحص مع اسم الـ Action/Function إذا وُجد]
- Frontend: [نتيجة الفحص مع اسم المكوّن/الصفحة إذا وُجد]

**الموجود بالفعل:** [وصف دقيق لما هو مطبق]
**الناقص:** [وصف دقيق لما ينقص لإكمال الميزة — أو "لا شيء" إن كانت مكتملة]

**ملاحظات تقنية:** [أي ملاحظات مهمة للتنفيذ، تحذيرات، أو تبعيات]
```

---

## ملاحظات مهمة للوكيل

1. **لا تُعدّل أي كود** — هذه مهمة قراءة وتحليل فقط
2. **كن دقيقاً في الحالة** — لا تقل ✅ إلا إذا كانت الميزة تعمل من DB إلى UI بالكامل
3. **اذكر المسارات الكاملة** — مثل `src/lib/actions/tasks.ts` لا مجرد "tasks"
4. **إذا وجدت شيئاً غير متوقع** — سواء جيد أو إشكالية — اذكره في "ملاحظات تقنية"
5. **لا تنسَ فحص** `supabase/migrations/` بالكامل وليس فقط `DB_SCHEMA.md`

