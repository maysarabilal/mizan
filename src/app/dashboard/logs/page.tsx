import { getAuditLogs } from '@/lib/actions/team'
import { LogsTable } from './LogsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollText } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LogsPage() {
  const supabase = await createClient()
  
  // Route Guard: Atomic Permission Check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hasLogPerm, error: permError } = await (supabase.rpc as any)('has_permission', { p_perm: 'view_audit_logs' })
  if (permError || !hasLogPerm) {
    redirect('/dashboard')
  }

  const { data: logs, error } = await getAuditLogs()

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        <h2 className="text-xl font-bold mb-2">خطأ في الوصول</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">سجلات الرقابة</h1>
        <p className="text-muted-foreground">مراقبة كافة تحركات الفريق وتغييرات البيانات في المكتب (الصندوق الأسود).</p>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-zinc-950 overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/50 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">سجل النشاط الأخير</CardTitle>
              <CardDescription>عرض آخر 100 حركة تمت في النظام مع تفاصيل التغيير.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LogsTable logs={(logs || []) as any} />
        </CardContent>
      </Card>
    </div>
  )
}
