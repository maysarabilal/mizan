import { getOfficeConfig } from '@/lib/actions/settings'
import { SettingsForm } from './SettingsForm'
import { AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Route Guard: Atomic Permission Check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hasManagePerm, error: permError } = await (supabase.rpc as any)('has_permission', { p_perm: 'manage_team' }).single()

  if (permError || !hasManagePerm) {
    redirect('/dashboard')
  }

  const { data: office, error } = await getOfficeConfig()

  if (error || !office) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-red-500 gap-4 border rounded-xl bg-red-50 dark:bg-red-950/20">
        <AlertCircle className="h-10 w-10" />
        <h2 className="text-xl font-bold">عذراً، لم نتمكن من جلب إعدادات المكتب</h2>
        <p className="text-red-400">تأكد من صلاحيات حسابك وعدم إيقافه في النظام.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">إعدادات النظام والمكتب</h1>
        <p className="text-muted-foreground text-sm">تخصيص البيانات العامة للمكتب، تنبيهات المهام والجلسات التلقائية.</p>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-xl border p-6">
        {/* We explicitly cast settings due to JSONB flexibility */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SettingsForm office={{ name: office.name, settings: office.settings as any }} />
      </div>
    </div>
  )
}
