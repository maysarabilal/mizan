# خطة التنفيذ الشاملة — نظام ميزان
## Comprehensive Implementation Roadmap
**بناءً على:** تقرير التدقيق الميداني — 2026-04-26

---

## ملخص نتائج التدقيق

من أصل 18 مقترحاً تم تدقيقها على الكود الفعلي:

| الحالة | العدد | المقترحات |
|--------|-------|-----------|
| ✅ مكتمل | 2 | Audit Log UI، Dashboard KPIs |
| ⚠️ جزئي | 7 | Cron Job، تفضيلات الإشعارات، Due Date Alerts، Global Search، تصميم الكروت، تسمية الخطط، تصميم صفحة الاشتراكات |
| ❌ غير موجود | 9 | كاشف تضارب المصالح، List View، أيام العمل، ربط المهام بجلسات، Push Notifications، الأتعاب، Checklists، شعار المكتب، إرفاق الملفات |

> **ملاحظة مهمة:** [06] Audit Log UI و [08] Dashboard KPIs مكتملان بالكامل — لا يحتاجان أي عمل. هذا يعني أن أولويتنا السابقة (#3 و #6) سقطت من قائمة العمل.

---

## الميزات المكتملة — لا تحتاج عملاً

### ✅ [06] Audit Log UI
- **الوضع:** `DB (جدول + triggers تلقائية) + getAuditLogs() action + صفحة /dashboard/logs` — سلسلة كاملة.
- **التوصية:** لا شيء. مراجعة بصرية اختيارية فقط.

### ✅ [08] Home Dashboard Analytics
- **الوضع:** 7 استعلامات متوازية + 4 KPI cards + جدول الجلسات القادمة + ويدجت الاشتراك.
- **التوصية:** إضافة بطاقة "المهام المتأخرة" كتحسين اختياري مستقبلاً (لا تحتاج migration).

---

## المرحلة الأولى — إصلاحات فورية (لا تحتاج migration)
**الجدول الزمني المقترح: 3-5 أيام**
**المبدأ:** كل ما في هذه المرحلة إما يُصلح ثغرة قائمة أو يربط كوداً موجوداً بمنطق مفقود.

---

### 🔴 [01] تفعيل Cron Job عبر GitHub Actions
**الأثر: بنيوي — ثغرة أمنية قائمة**
**الجهد: ساعة واحدة**

**المشكلة بالضبط:** دالة `nightly_maintenance()` مكتوبة ومنشورة في DB ومُعطاة صلاحية `service_role`، لكن `pg_cron` معلّق. لا يوجد `.github/workflows/` إطلاقاً.

**الخطر:** المستخدم الذي لا يدخل للنظام لن تنتهي صلاحية اشتراكه أبداً على مستوى DB. `SubscriptionGuard` لا يحمي API calls مباشرة.

**التعليمات للوكيل:**
1. أنشئ Supabase Edge Function باسم `nightly-cron` تستدعي الدالة داخلياً:
   ```typescript
   import { createClient } from 'jsr:@supabase/supabase-js@2'
   Deno.serve(async (req) => {
     // أمان: تحقق من CRON_SECRET قبل التنفيذ
     const cronSecret = req.headers.get('x-cron-secret')
     if (cronSecret !== Deno.env.get('CRON_SECRET')) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
     }

     const supabase = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
     )
     const { error } = await supabase.rpc('nightly_maintenance')
     return new Response(JSON.stringify({ success: !error, error }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```
2. أنشئ ملف `.github/workflows/nightly-maintenance.yml`
3. الجدول: `cron: '0 2 * * *'` (2 صباحاً يومياً)
4. الخطوة: استدعاء الـ Edge Function عبر `curl`:
   ```yaml
   - name: Run nightly maintenance
     run: |
       curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/nightly-cron" \
         -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
         -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
   ```
5. أضف `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` و `CRON_SECRET` كـ GitHub Secrets
6. أنشر الـ Edge Function بـ `verify_jwt: false` (لأن المصادقة تتم عبر `CRON_SECRET` وليس JWT)
7. **لا تعدّل أي كود في DB** — الدالة مكتوبة ولا تحتاج تعديلاً

> ⚠️ **تحذير:** لا تستدعِ `/rest/v1/rpc/nightly_maintenance` مباشرة عبر REST — الدالة تعتمد على `SECURITY DEFINER` وتحتاج `service_role` context كاملاً عبر Edge Function.
> 
> 🔒 **أمان إضافي:** الـ `CRON_SECRET` هو سر عشوائي تُنشئه أنت (مثلاً `openssl rand -hex 32`) وتحفظه في GitHub Secrets وفي Supabase Edge Function Secrets. هذا يمنع أي طرف خارجي يعرف الـ URL من استدعاء الـ Function.

---

### 🟠 [02] تطبيق تفضيلات الإشعارات فعلياً
**الأثر: عالي — التفضيلات تُحفظ لكن لا تُطبّق**
**الجهد: يوم واحد**

**المشكلة بالضبط:** `SettingsForm` يعرض 3 switches وتُحفظ في `offices.settings` — لكن لا يوجد أي كود يقرأها قبل `INSERT INTO notifications`.

**الملفات المعنية (الربط الصحيح):**
- `src/lib/actions/tasks.ts` — عند تغيير حالة المهمة لـ `مكتملة` → يجب فحص `task_completed`
- `src/lib/actions/sessions.ts` — عند إنشاء جلسة → يجب فحص `session_reminders`
- `src/lib/actions/subscriptions.ts` — عند تحديث الاشتراك → يجب فحص `subscription_updates`
- `src/lib/actions/cases.ts` — عند إسناد قضية لمحامٍ (`assigned_to` يتغير) → يحتاج نفس فحص التفضيلات قبل إنشاء إشعار `case_assigned`

**التعليمات للوكيل:**
1. أنشئ helper function في `src/lib/utils/notifications.ts`:
   ```typescript
   async function shouldSendNotification(
     officeId: string, 
     type: 'session_reminders' | 'task_completed' | 'subscription_updates'
   ): Promise<boolean>
   ```
2. هذه الدالة تقرأ `offices.settings` وتعيد `true/false`
3. في كل نقطة تُنشئ `INSERT INTO notifications`، اربطها بهذا الـ helper
4. **لا تعدّل DB Schema** — المفاتيح موجودة بالفعل

---

### 🟠 [03] إشعار تلقائي للمهام المتأخرة
**الأثر: عالي — التمييز البصري موجود لكن لا إشعار**
**الجهد: يوم واحد (يعتمد على [01])**

**المشكلة بالضبط:** `TaskCard.tsx` يحسب `isOverdue` ويلوّن الكارت — لكن المستخدم يجب أن يفتح صفحة المهام ليرى ذلك. لا يوجد إشعار استباقي.

**التعليمات للوكيل:**
1. في `nightly_maintenance()` أو في GitHub Action جديد منفصل، أضف استدعاء لـ Edge Function تفحص:
   ```sql
   SELECT t.*, t.assigned_to as user_id
   FROM tasks t 
   WHERE t.due_date < CURRENT_DATE 
   AND t.status != 'مكتملة'
   AND t.assigned_to IS NOT NULL
   ```
   > ⚠️ **تنبيه:** حالات المهام مخزّنة **بالعربية** في DB (`معلقة`, `قيد التنفيذ`, `مكتملة`). لا تستخدم القيم الإنجليزية.
   >
   > 📌 **ملاحظة نطاق الاستعلام:** هذا الاستعلام **لا يُفلتر بـ `office_id`** وهذا مقصود — الـ Cron Job يعمل بصلاحية `service_role` على مستوى كل المكاتب. لا تُضف `WHERE office_id = current_office_id()` هنا لأن `current_office_id()` تعتمد على `auth.uid()` وهو غير متاح في سياق الـ Cron.
2. لكل مهمة متأخرة، أنشئ صف في `notifications` بـ `type = 'task'`
3. اربطه بـ helper الـ `shouldSendNotification` من [02]
4. **لا تعدّل جدول `tasks`** — كل البيانات المطلوبة موجودة

---

### 🟡 [05] ربط Global Search بمنطق فعلي
**الأثر: UX عالي جداً — الحقل موجود لكن ميت**
**الجهد: يومان**

**المشكلة بالضبط:** `Topbar.tsx` سطر 110-117 يحتوي `<Input type="search">` لكنه غير متصل بأي منطق. لا يوجد `cmdk` في `package.json`.

**التعليمات للوكيل:**

*الخيار الأسرع (موصى به):*
1. أنشئ Supabase RPC جديد `global_search(query text)` يبحث في:
   - `cases(title, case_number)` — يعيد `{type: 'case', id, title, subtitle: case_type}`
   - `clients(name, phone)` — يعيد `{type: 'client', id, title, subtitle: phone}`
   - `sessions(court, outcome)` — يعيد `{type: 'session', id, title, subtitle: session_date}`
   - `tasks(title)` — يعيد `{type: 'task', id, title, subtitle: status}`
   - بحد أقصى 5 نتائج من كل جدول
   > ⚠️ **أمان:** الـ RPC يجب أن يُفلتر كل جدول بـ `WHERE office_id = current_office_id()` لضمان عزل البيانات بين المكاتب (Multi-tenancy).
2. في `Topbar.tsx`، ربط الـ input بـ debounced call للـ RPC (300ms)
3. عرض النتائج في dropdown بسيط تحت حقل البحث
4. النقر على نتيجة يُنقل للصفحة المناسبة

*ملاحظة:* لا تُضف `cmdk` الآن — الـ dropdown البسيط يكفي للمرحلة الأولى.

---

## المرحلة الثانية — تحسينات UI بدون migration
**الجدول الزمني المقترح: أسبوع**
**المبدأ:** كل ما هنا تحسينات بصرية أو وظيفية لا تحتاج تغيير DB Schema.

---

### 🟡 [07] List View Toggle للمهام
**الأثر: UX متوسط**
**الجهد: يوم ونصف**

**المشكلة بالضبط:** `src/app/dashboard/tasks/` يحتوي `KanbanBoard.tsx` فقط. لا يوجد مكوّن جدول ولا زر تبديل.

**التعليمات للوكيل:**
1. أنشئ `src/app/dashboard/tasks/TaskTable.tsx` — جدول بالأعمدة: العنوان، الحالة، الأولوية، تاريخ الاستحقاق، المُسند إليه، القضية المرتبطة
2. في `src/app/dashboard/tasks/page.tsx`، أضف state: `viewMode: 'kanban' | 'list'`
3. أضف زر Toggle (أيقونتا LayoutGrid / List من Lucide) في أعلى الصفحة
4. احفظ الاختيار في `localStorage` بمفتاح `mizan_tasks_view`
5. `isOverdue` styling يجب أن يعمل في كلا العرضين

---

### 🟡 [11] تحديث تصميم كروت المهام لهوية Digital Atelier
**الأثر: بصري متوسط**
**الجهد: نصف يوم**

**المشكلة بالضبط:** `TaskCard.tsx` يستخدم ألوان Tailwind عامة (`bg-red-100`, `bg-yellow-100`) بدلاً من هوية المشروع.

**التعليمات للوكيل:**
1. في `TaskCard.tsx`، استبدل ألوان الأولوية:
   - **عالية:** استخدم `border-amber-400/60 bg-amber-50` مع badge ذهبي `#C9A84C`
   - **متوسطة:** استخدم `border-blue-300/60 bg-blue-50`
   - **منخفضة:** استخدم `border-gray-200 bg-gray-50`
   - **متأخرة:** `border-red-400 bg-red-50` مع أيقونة ⚠️
2. أضف `shadow-sm hover:shadow-md transition-shadow` للـ card
3. حافظ على `rounded-lg` الموجود

---

### 🟢 [17] + [18] تحسين صفحة الاشتراكات — Toggle شهري/سنوي
**الأثر: تسويقي + UX**
**الجهد: يومان**

**المشكلة بالضبط:** الخطط الـ 7 كلها تُعرض معاً بدون تنظيم. لا يوجد Toggle شهري/سنوي. لا يوجد تمييز "الخطة الموصى بها".

**التعليمات للوكيل:**
1. في `PlansGrid.tsx`، أضف state: `billingCycle: 'monthly' | 'yearly'`
2. اعرض Toggle button بين الاختيارين مع نص "وفّر 20% سنوياً" باللون الأخضر
3. فلتر الخطط بناءً على `plan.billing_cycle` المُختار + استبعاد `enterprise` من الفلتر (تظهر دائماً)
4. الخطة `office` / `office_yearly` تحصل على `ring-2 ring-amber-400` + badge "الأكثر شعبية"
5. أوصاف الخطط: عدّلها **في `PlansGrid.tsx` مباشرة** باستخدام mapping ثابت حسب الـ `slug` (لا تحتاج migration):
   - `individual` → "للمحامي المستقل"
   - `office` → "للمكاتب الصغيرة والمتوسطة"
   - `institution` → "للمؤسسات القانونية الكبرى"
   - `enterprise` → "حلول مخصصة بالكامل"
6. **لا تغيّر الـ slugs ولا الـ names في DB** — التغيير بصري فقط في الواجهة

---

## المرحلة الثالثة — ميزات تحتاج migration خفيف
**الجدول الزمني المقترح: أسبوعان**
**المبدأ:** كل migration هنا إما إضافة عمود أو إضافة مفتاح JSONB — لا إعادة هيكلة.

---

### 🟠 [04] كاشف تضارب المصالح
**الأثر: قيمة قانونية فريدة**
**الجهد: يوم واحد**

**التعليمات للوكيل:**

*Migration:*
```sql
ALTER TABLE cases ADD COLUMN opposing_party text;
```

*Backend — `src/lib/actions/cases.ts`:*
- أضف `opposing_party?: string` لـ `caseSchema`
- قبل الـ INSERT/UPDATE، إذا تم تمرير `opposing_party`:
  ```typescript
  const conflict = await supabase
    .from('clients')
    .select('id, name')
    .eq('office_id', officeId)
    .ilike('name', `%${opposing_party}%`)
    .single()
  
  if (conflict.data) {
    return { data: null, error: `تحذير: "${conflict.data.name}" مسجل كعميل في المكتب — تضارب مصالح محتمل` }
  }
  ```

*Frontend — `CaseDialog.tsx`:*
- أضف حقل نصي "الطرف المقابل" في النموذج
- إذا عاد الـ action بتحذير تضارب، اعرضه كـ toast أصفر (warning) مع زر "تجاوز والمتابعة"

---

### 🟡 [09] أيام وساعات العمل + تحذير العطل
**الأثر: متوسط**
**الجهد: يومان**

**التعليمات للوكيل:**

*لا يحتاج migration — `offices.settings` JSONB يقبل مفاتيح جديدة تلقائياً*

*Backend — `src/lib/validations/settings.ts`:*
```typescript
// أضف للـ officeSettingsSchema:
working_days: z.array(z.number().min(0).max(6)).optional(), // [0=أحد, 6=سبت]
holidays: z.array(z.string()).optional(), // ['2026-01-01', ...]
```

*Backend — `src/lib/actions/settings.ts`:*
> ⚠️ **لا تنسَ** تحديث `settingsPayload` في `updateOfficeSettingsAction()` لتشمل الحقول الجديدة `working_days` و `holidays`، وإلا ستُحفظ في الـ schema لكن لن تُرسل لقاعدة البيانات.

*Frontend — `SettingsForm.tsx`:*
- أضف قسم "أيام العمل" بـ 7 checkboxes (الأحد→السبت)
- أضف قسم "العطل الرسمية" بـ date picker يُضيف تواريخ للقائمة

*Frontend — `SessionDialog.tsx`:*
- بعد اختيار التاريخ، تحقق من `offices.settings.working_days` و`holidays`
- إذا كان التاريخ عطلة: `toast.warning('تحذير: هذا اليوم عطلة رسمية حسب إعدادات المكتب')`

---

### 🟡 [10] ربط المهام بجلسات
**الأثر: متوسط**
**الجهد: يومان**

**التعليمات للوكيل:**

*Migration:*
```sql
ALTER TABLE tasks 
ADD COLUMN session_id uuid REFERENCES sessions(id) ON DELETE SET NULL;
```

*Backend — `src/lib/validations/tasks.ts`:*
```typescript
session_id: z.string().uuid().optional()
```

*في `tasks.ts` action:* تحقق أن `session_id` ينتمي لنفس الـ `office_id` قبل الحفظ (نفس نمط `case_id` الموجود).

*Frontend — `TaskDialog.tsx`:*
- أضف dropdown "جلسة مرتبطة" (اختياري) يُحمّل الجلسات عبر `getSessions()`
- إذا تم اختيار جلسة وقضية معاً، تأكد أن الجلسة تنتمي للقضية المختارة

---

### 🟡 [14] Checklists / Sub-tasks
**الأثر: قيمة وظيفية عالية**
**الجهد: يومان**

**التعليمات للوكيل:**

*Migration:*
```sql
ALTER TABLE tasks 
ADD COLUMN checklist jsonb DEFAULT '[]'::jsonb;
-- هيكل كل عنصر: {"id": "uuid", "text": "نص الخطوة", "done": false}
```

*Backend — `src/lib/validations/tasks.ts`:*
```typescript
checklist: z.array(z.object({
  id: z.string(),
  text: z.string().min(1),
  done: z.boolean()
})).optional().default([])
```

*Frontend — `TaskDialog.tsx`:*
- قسم "خطوات المهمة" مع زر "إضافة خطوة" + حقل نصي + زر حذف لكل خطوة

*Frontend — `TaskCard.tsx`:*
- إذا `checklist.length > 0`، اعرض `progress bar` أسفل الكارت: `3/5 خطوات مكتملة`

---

## المرحلة الرابعة — ميزات تحتاج بنية تحتية جديدة
**الجدول الزمني المقترح: شهر+**
**المبدأ:** كل ميزة هنا تحتاج Supabase Storage أو Service Worker أو جدول جديد كامل.

---

### 🟠 [15] رفع شعار المكتب
**الأثر: متوسط — Branding احترافي**
**الجهد: يوم ونصف**

**التعليمات للوكيل:**
1. أنشئ Supabase Storage Bucket: `office-logos` (public read, authenticated write)
2. Migration: `ALTER TABLE offices ADD COLUMN logo_url text;`
3. Server Action جديد `uploadOfficeLogoAction(file: File)`:
   - ارفع لـ `office-logos/{officeId}/logo.{ext}`
   - حدّث `offices.logo_url`
4. في `SettingsForm.tsx`: أضف `<input type="file" accept="image/*">` مع preview
5. في `Sidebar.tsx`: إذا `logo_url` موجود، اعرض `<Image>` بدلاً من اسم المكتب النصي

---

### 🟠 [16] إرفاق الملفات والمستندات
**الأثر: عالي — ضروري مستقبلاً**
**الجهد: أسبوع**

**ملاحظة مكتشفة من التدقيق:** يوجد placeholder labels في `SessionDetailClient.tsx` و `CaseDialog.tsx` تشير لمرفقات — هذا يعني أن الـ UI جاهز جزئياً بصرياً.

**التعليمات للوكيل:**
1. أنشئ Supabase Storage Bucket: `case-documents` (authenticated only)
2. Migration:
   ```sql
   CREATE TABLE attachments (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     office_id uuid NOT NULL REFERENCES offices(id),
     entity_type text NOT NULL CHECK (entity_type IN ('case', 'session', 'client')),
     entity_id uuid NOT NULL,
     file_name text NOT NULL,
     storage_path text NOT NULL,
     file_size integer,
     uploaded_by uuid REFERENCES profiles(id),
     created_at timestamptz DEFAULT now()
   );
   -- RLS: SELECT/INSERT/DELETE WHERE office_id = current_office_id()
   ```
3. Server Action: `uploadAttachmentAction(entityType, entityId, file)`
4. Server Action: `getAttachmentsAction(entityType, entityId)`
5. Server Action: `deleteAttachmentAction(attachmentId)`
6. مكوّن `AttachmentsList` يعرض الملفات مع أيقونة نوع الملف + حجمه + زر تحميل

---

### 🔴 [12] Web Push Notifications
**الأثر: عالي — ميزة SaaS حقيقية**
**الجهد: أسبوع**

**التعليمات للوكيل:**
1. `npm install web-push`
2. أنشئ VAPID keys: `npx web-push generate-vapid-keys` → احفظ في `.env.local`
3. Migration:
   ```sql
   CREATE TABLE push_subscriptions (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
     subscription jsonb NOT NULL, -- كامل PushSubscription object
     created_at timestamptz DEFAULT now(),
     UNIQUE (user_id, (subscription->>'endpoint'))
   );
   ```
4. ملف `public/sw.js` — Service Worker يستقبل `push` events ويعرض `showNotification()`
5. **تسجيل الـ Service Worker:** أنشئ مكوّن `PushNotificationProvider` في `src/components/providers/` يُسجّل الـ SW عبر `navigator.serviceWorker.register('/sw.js')` — وأضفه في `src/app/layout.tsx` ضمن الـ providers. لا تُسجّل الـ SW مباشرة في `layout.tsx` لأنه Server Component.
6. Server Action `savePushSubscriptionAction(subscription: PushSubscription)`
7. في `NotificationsList` أو `Topbar`: زر "تفعيل الإشعارات" يطلب `Notification.requestPermission()` ثم يحفظ الـ subscription
8. في كل نقطة تُنشئ إشعاراً، أضف استدعاء `webpush.sendNotification()` بجانب `INSERT INTO notifications`
9. **تنبيه iOS:** أضف في docs أن مستخدمي iPhone يحتاجون "إضافة للشاشة الرئيسية" أولاً

---

### 🔴 [13] إدارة الأتعاب القانونية
**الأثر: جوهري — نقطة تمييز تنافسية**
**الجهد: أسبوع**

**التعليمات للوكيل:**
1. Migration:
   ```sql
   CREATE TABLE case_fees (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     office_id uuid NOT NULL REFERENCES offices(id),
     case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
     client_id uuid NOT NULL REFERENCES clients(id),
     description text NOT NULL,
     total_amount numeric(10,2) NOT NULL,
     paid_amount numeric(10,2) DEFAULT 0,
     due_date date,
     status text DEFAULT 'معلق' CHECK (status IN ('معلق', 'جزئي', 'مدفوع')),
     created_by uuid REFERENCES profiles(id),
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );

   -- RLS
   ALTER TABLE case_fees ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Members can view own fees" ON case_fees FOR SELECT USING (office_id = current_office_id());
   CREATE POLICY "Members can insert fees" ON case_fees FOR INSERT WITH CHECK (office_id = current_office_id());
   CREATE POLICY "Members can update fees" ON case_fees FOR UPDATE USING (office_id = current_office_id());
   CREATE POLICY "Owners can delete fees" ON case_fees FOR DELETE USING (office_id = current_office_id() AND has_role(ARRAY['owner']));

   -- Triggers (للتوافق مع نمط بقية الجداول)
   CREATE TRIGGER set_updated_at_case_fees BEFORE UPDATE ON case_fees FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
   CREATE TRIGGER audit_case_fees AFTER INSERT OR UPDATE OR DELETE ON case_fees FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
   ```
2. Server Actions في `src/lib/actions/fees.ts`:
   - `getCaseFees(caseId)`
   - `createFeeAction(values: feeSchema)`
   - `updatePaidAmountAction(feeId, amount)`
   - `deleteFeeAction(feeId)`
3. مكوّن `CaseFeesSection` يُضاف في صفحة تفاصيل القضية
4. في Dashboard KPIs: أضف بطاقة "إجمالي الأتعاب المعلقة" للمالك فقط

---

## ملاحظات تقنية عامة للوكيل

### قبل تنفيذ أي مهمة:
1. **اقرأ `DEVELOPMENT_LOG.md`** لتجنب تكرار أخطاء سابقة
2. **فعّل `npx supabase gen types`** بعد كل migration جديد
3. **حدّث `src/types/database.ts`** يدوياً بعد كل migration — هذا الملف مصدر أخطاء TypeScript المتكررة في المشروع
4. **لا تستخدم `db as any`** — الـ TypeScript strict mode فعّال
5. **كل Server Action جديد** يجب أن يتبع نمط `ActionResult<T>` الموجود
6. **اختبر RLS** لكل جدول جديد — تأكد من إضافة `WHERE office_id = current_office_id()`
7. **حالات المهام بالعربية في DB** — استخدم `enums.ts` mapping دائماً (`معلقة`, `قيد التنفيذ`, `مكتملة`)

### أولويات المراجعة بعد كل مرحلة:
- [ ] `npm run build` يمر بدون أخطاء TypeScript
- [ ] `src/types/database.ts` محدّث ليشمل الجداول/الأعمدة الجديدة
- [ ] RLS policies مضافة لكل جدول جديد
- [ ] Arabic error messages في كل Server Action
- [ ] `revalidatePath` صحيحة بعد كل mutation
- [ ] فحص يدوي: فتح الصفحة المعنية في المتصفح والتأكد من عرض البيانات بشكل صحيح

---

## الجدول الزمني الموصى به

| المرحلة | المدة | ما ينجز |
|---------|-------|---------|
| **المرحلة 1** — إصلاحات فورية | 3-5 أيام | [01] Cron، [02] تطبيق تفضيلات الإشعارات، [03] Due Date Alerts، [05] Global Search |
| **المرحلة 2** — تحسينات UI | أسبوع | [07] List Toggle، [11] تصميم الكروت، [17+18] صفحة الاشتراكات |
| **المرحلة 3** — ميزات خفيفة | أسبوعان | [04] Conflict، [09] أيام العمل، [10] Session Link، [14] Checklists |
| **المرحلة 4** — ميزات كبيرة | شهر+ | [15] Logo، [16] Attachments، [12] Push، [13] Fees |

