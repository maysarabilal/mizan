import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { FolderOpen, Scale, Calendar, Users, Award } from 'lucide-react'
import { checkSubscriptionStatus } from '@/lib/actions/subscription'
import { QuickActions } from './_components/QuickActions'
import { UpcomingSessions } from './_components/UpcomingSessions'

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
    { count: activeCases },
    { count: totalClients },
    { count: upcomingSessionsCount },
    { data: upcomingSessions },
    subStatus,
    { count: currentCount }
  ] = await Promise.all([
    supabase.from('cases').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId),
    supabase.from('cases').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId).eq('status', 'جارية'),
    supabase.from('clients').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId),
    supabase.from('sessions').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId).gte('session_date', today).lte('session_date', nextWeek),
    supabase.from('sessions').select('id, session_date, session_time, court, outcome, cases(id, title, clients(name))')
      .eq('office_id', officeId)
      .gte('session_date', today)
      .order('session_date', { ascending: true })
      .limit(5),
    checkSubscriptionStatus(),
    supabase.from('office_members').select('*', { count: 'exact', head: true })
      .eq('office_id', officeId).eq('is_active', true),
  ])

  // Calculate generic subscription data
  const isIndividual = subStatus.planName.includes('فردي')
  const progressPercent = isIndividual
    ? Math.min(100, Math.max(0, (subStatus.daysRemaining / (subStatus.planName.includes('سنوي') ? 365 : 30)) * 100))
    : Math.min(100, Math.max(0, ((currentCount || 0) / (subStatus.maxUsers || 1)) * 100))

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f4f5f7] p-8">
      {/* Header */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1a2744] mb-2">نظرة عامة</h1>
          <p className="text-[#5a6480]">إليك ما يحدث في ميزان اليوم.</p>
        </div>
        <div className="hidden md:flex gap-2 text-sm text-[#5a6480] bg-[#eef0f4] px-4 py-2 rounded-full">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4]">
          <div className="absolute -left-2 -bottom-2 opacity-[0.03]">
            <FolderOpen size={100} className="text-[#1a2744]" />
          </div>
          <h3 className="text-xs font-semibold text-[#5a6480] uppercase tracking-wider mb-2">إجمالي القضايا</h3>
          <div className="flex items-baseline gap-3 relative z-10">
            <span className="text-4xl font-bold text-[#1a2744] tracking-tighter">{totalCases?.toString() || '0'}</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4]">
          <div className="absolute -left-2 -bottom-2 opacity-[0.03]">
            <Scale size={100} className="text-[#1a2744]" />
          </div>
          <h3 className="text-xs font-semibold text-[#5a6480] uppercase tracking-wider mb-2">القضايا النشطة</h3>
          <div className="flex items-baseline gap-3 relative z-10">
            <span className="text-4xl font-bold text-[#1a2744] tracking-tighter">{activeCases?.toString() || '0'}</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4]">
          <div className="absolute -left-2 -bottom-2 opacity-[0.03]">
            <Calendar size={100} className="text-[#1a2744]" />
          </div>
          <h3 className="text-xs font-semibold text-[#5a6480] uppercase tracking-wider mb-2">جلسات الأسبوع</h3>
          <div className="flex items-baseline gap-3 relative z-10">
            <span className="text-4xl font-bold text-[#1a2744] tracking-tighter">{upcomingSessionsCount?.toString() || '0'}</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4]">
          <div className="absolute -left-2 -bottom-2 opacity-[0.03]">
            <Users size={100} className="text-[#1a2744]" />
          </div>
          <h3 className="text-xs font-semibold text-[#5a6480] uppercase tracking-wider mb-2">إجمالي العملاء</h3>
          <div className="flex items-baseline gap-3 relative z-10">
            <span className="text-4xl font-bold text-[#1a2744] tracking-tighter">{totalClients?.toString() || '0'}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table Section */}
        <div className="xl:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#1a2744] tracking-tight">الجلسات القادمة</h2>
            <Link href="/dashboard/sessions" className="text-sm font-medium text-[#c9a84c] hover:text-[#b08d3a] transition-colors">
              عرض الكل &larr;
            </Link>
          </div>
          <UpcomingSessions initialSessions={upcomingSessions || []} />
        </div>

        {/* Sidebar Section */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Subscription Status Card */}
          <div className="bg-[#1a2744] text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <span className="bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {subStatus.planName}
              </span>
              <div className="bg-white/10 p-2 rounded-xl">
                <Award size={20} className="text-[#c9a84c]" />
              </div>
            </div>
            
            <div className="mb-5 relative z-10">
              <p className="text-white/60 text-xs mb-1 font-medium">
                {isIndividual ? 'الأيام المتبقية في الاشتراك' : 'الاستهلاك من الأعضاء المسموحين'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-[Manrope]">
                  {isIndividual ? (subStatus.daysRemaining > 0 ? subStatus.daysRemaining : 0) : (currentCount || 0)}
                </span>
                <span className="text-white/50 text-sm font-medium">
                  {isIndividual ? 'يوم' : `من ${subStatus.maxUsers || 1}`}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2 mb-6 relative z-10 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#c9a84c] to-[#e6cf8e] h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <Link 
              href="/dashboard/subscription" 
              className="w-full bg-[#c9a84c] hover:bg-[#b89a45] transition-colors text-[#1a2744] text-sm font-bold py-2.5 rounded-lg flex items-center justify-center relative z-10"
            >
              إدارة الاشتراك والباقات
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

