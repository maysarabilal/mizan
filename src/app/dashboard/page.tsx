import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

export default async function DashboardHomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('office_members')
    .select('office_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) redirect('/onboarding')
  const officeId = member.office_id

  const today = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line react-hooks/purity
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const [
    { count: totalCases },
    { count: totalClients },
    { count: pendingTasks },
    { count: upcomingSessionsCount },
  ] = await Promise.all([
    supabase.from('cases').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId),
    supabase.from('clients').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId).eq('status', 'معلقة'),
    supabase.from('sessions').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId)
      .gte('session_date', today)
      .lte('session_date', nextWeek)
  ])

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm">مرحباً بك في نظام ميزان لإدارة مكتب المحاماة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي القضايا', value: totalCases?.toString() || '0' },
          { label: 'العملاء', value: totalClients?.toString() || '0' },
          { label: 'جلسات الأسبوع', value: upcomingSessionsCount?.toString() || '0' },
          { label: 'المهام المعلقة', value: pendingTasks?.toString() || '0' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
