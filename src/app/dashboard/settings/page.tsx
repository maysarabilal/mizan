import { getOfficeConfig, getActivityLog } from '@/lib/actions/settings'
import { SettingsClient } from './SettingsClient'
import { AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Route Guard: Atomic Permission Check
  const { data: hasManagePerm, error: permError } = await supabase.rpc('has_permission', { p_perm: 'manage_team' }).single()

  if (permError || !hasManagePerm) {
    redirect('/dashboard')
  }

  const [officeRes, activityRes] = await Promise.all([
    getOfficeConfig(),
    getActivityLog()
  ])

  if (officeRes.error || !officeRes.data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-red-500 gap-4 border rounded-xl bg-red-50 dark:bg-red-950/20">
        <AlertCircle className="h-10 w-10" />
        <h2 className="text-xl font-bold">عذراً، لم نتمكن من جلب إعدادات المكتب</h2>
        <p className="text-red-400">تأكد من صلاحيات حسابك وعدم إيقافه في النظام.</p>
      </div>
    )
  }

  return (
    <SettingsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      office={officeRes.data as any}
      activityLogs={activityRes.data || []}
    />
  )
}
