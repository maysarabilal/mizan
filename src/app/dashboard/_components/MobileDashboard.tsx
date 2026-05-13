'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Scale, Bell, User, FolderPlus, UserPlus, CalendarPlus, 
  LayoutDashboard, Briefcase, Calendar, Users, Menu, MapPin 
} from 'lucide-react'
import { CaseDialog } from '@/app/dashboard/cases/CaseDialog'
import { ClientDialog } from '@/app/dashboard/clients/ClientDialog'
import { SessionDialog } from '@/app/dashboard/sessions/SessionDialog'
import { createClient } from '@/lib/supabase/browser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MobileDashboard({ officeName, planName, kpis, upcomingSessions, recentCases, subscription }: any) {
  const pathname = usePathname()
  
  // Quick Actions State
  const [caseOpen, setCaseOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clients, setClients] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cases, setCases] = useState<any[]>([])

  const handleOpenCase = async () => {
    setLoadingAction(true)
    const supabase = createClient()
    const [clientsRes, teamRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('office_members').select('*, profiles(full_name)').eq('is_active', true)
    ])
    if (clientsRes.data) setClients(clientsRes.data)
    if (teamRes.data) setTeamMembers(teamRes.data)
    setLoadingAction(false)
    setCaseOpen(true)
  }

  const handleOpenSession = async () => {
    setLoadingAction(true)
    const supabase = createClient()
    const { data } = await supabase.from('cases').select('id, title, office_id, clients(name)')
    if (data) setCases(data)
    setLoadingAction(false)
    setSessionOpen(true)
  }

  const quickActions = [
    { label: 'قضية جديدة', icon: FolderPlus, onClick: handleOpenCase },
    { label: 'إضافة عميل', icon: UserPlus, onClick: () => setClientOpen(true) },
    { label: 'جلسة جديدة', icon: CalendarPlus, onClick: handleOpenSession },
  ]

  const kpiCards = [
    { label: 'إجمالي القضايا', value: kpis.totalCases, icon: Briefcase },
    { label: 'القضايا النشطة', value: kpis.activeCases, icon: Scale },
    { label: 'جلسات الأسبوع', value: kpis.sessionsWeek, icon: Calendar },
    { label: 'إجمالي العملاء', value: kpis.totalClients, icon: Users },
  ]

  const bottomNavItems = [
    { label: 'نظرة عامة', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'القضايا', icon: Briefcase, href: '/dashboard/cases' },
    { label: 'الجلسات', icon: Calendar, href: '/dashboard/sessions' },
    { label: 'العملاء', icon: Users, href: '/dashboard/clients' },
    { label: 'القائمة', icon: Menu, href: '/dashboard/settings' }, // Redirect to settings for menu
  ]

  const statusMap: Record<string, { label: string, bg: string, text: string }> = {
    'scheduled': { label: 'مجدولة', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' },
    'مجدولة': { label: 'مجدولة', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' },
    'completed': { label: 'مكتملة', bg: 'bg-[#16A34A]', text: 'text-white' },
    'مكتملة': { label: 'مكتملة', bg: 'bg-[#16A34A]', text: 'text-white' },
    'postponed': { label: 'مؤجلة', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]' },
    'مؤجلة': { label: 'مؤجلة', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]' },
  }

  return (
    <div className="md:hidden bg-[#F7F9FC] min-h-screen">
      {/* Main Content Wrapper */}
      <main className="flex flex-col p-4 gap-6">
        
        {/* Office Info Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#0F1724]">{officeName}</h1>
          <span className="px-[10px] py-1 bg-[#C9A84C] rounded-full text-xs font-semibold text-[#17202B]">
            {planName}
          </span>
        </div>

        {/* Quick Actions — Horizontal Scroll */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3 pb-1" style={{ width: 'max-content' }}>
            {quickActions.map(action => (
              <button 
                key={action.label}
                onClick={action.onClick}
                disabled={loadingAction}
                className="flex flex-col items-center justify-center gap-2.5 w-[110px] min-w-[110px] h-[100px] bg-white border border-black/[0.08] rounded-md transition-colors active:bg-slate-50"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-[#F0E9D6] rounded-full">
                  <action.icon className="w-5 h-5 text-[#1A2744]" />
                </div>
                <span className="text-[13px] font-semibold text-[#0F1724] text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpiCards.map(kpi => (
            <div key={kpi.label} className="bg-white border border-black/[0.08] rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-[13px] font-medium text-[#9AA3B2]">{kpi.label}</span>
                <div className="w-8 h-8 flex items-center justify-center bg-[#F0E9D6] rounded shrink-0">
                  <kpi.icon className="w-4 h-4 text-[#1A2744]" />
                </div>
              </div>
              <span className="text-2xl font-bold text-[#0F1724]">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions Card */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F1724]">الجلسات القادمة</h2>
            <Link href="/dashboard/sessions" className="text-sm font-semibold text-[#1A2744]">عرض الكل</Link>
          </div>
          
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden flex flex-col">
            {upcomingSessions && upcomingSessions.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              upcomingSessions.map((session: any, i: number) => {
                const badge = statusMap[session.outcome] || { label: session.outcome || 'مجدولة', bg: 'bg-[#f4f5f7]', text: 'text-[#1a2744]' }
                return (
                  <Link 
                    href={`/dashboard/cases/${session.cases?.id || ''}`}
                    key={session.id} 
                    className={`flex items-start justify-between p-4 ${i !== upcomingSessions.length - 1 ? 'border-b border-black/[0.08]' : ''} active:bg-slate-50 transition-colors`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-semibold text-[#0F1724]">
                        {session.cases?.title || 'غير محدد'}
                      </span>
                      <div className="flex items-center gap-1.5 text-[13px] text-[#9AA3B2]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{session.court || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1724] mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(session.session_date).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} mt-1`}>
                      {badge.label}
                    </span>
                  </Link>
                )
              })
            ) : (
              <div className="p-6 text-center text-[13px] text-[#9AA3B2]">لا توجد جلسات قادمة</div>
            )}
          </div>
        </div>

        {/* Recent Cases Card */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F1724]">أحدث القضايا</h2>
            <Link href="/dashboard/cases" className="text-sm font-semibold text-[#1A2744]">عرض الكل</Link>
          </div>
          
          <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden flex flex-col">
            {recentCases && recentCases.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recentCases.map((c: any, i: number) => {
                return (
                  <Link 
                    href={`/dashboard/cases/${c.id}`}
                    key={c.id} 
                    className={`flex items-start justify-between p-4 ${i !== recentCases.length - 1 ? 'border-b border-black/[0.08]' : ''} active:bg-slate-50 transition-colors`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-semibold text-[#0F1724]">
                        {c.title}
                      </span>
                      <span className="text-[13px] text-[#9AA3B2]">
                        {c.clients?.name || 'بدون موكل'} • {c.case_number || 'بدون رقم'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#F0E9D6] border border-black/[0.08] rounded text-[12px] font-medium text-[#2B2B2B] w-max mt-1">
                        {c.case_type || 'غير محدد'}
                      </span>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="p-6 text-center text-[13px] text-[#9AA3B2]">لا توجد قضايا حديثة</div>
            )}
          </div>
        </div>

        {/* Subscription Widget */}
        <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/[0.08]">
            <h3 className="text-base font-bold text-[#0F1724]">حالة الاشتراك</h3>
          </div>
          <div className="p-4 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-[#FEF9C3] rounded-md border-2 border-[#12202B]">
                {/* SVG from Figma for plan icon placeholder */}
                <div className="w-6 h-6 border-2 border-[#12202B] rotate-45 transform" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[16px] font-semibold text-[#0F1724]">
                  {planName}
                </span>
                <span className="text-[13px] text-[#9AA3B2]">
                  {subscription.isIndividual ? 'الأيام المتبقية' : 'أعضاء الفريق'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px] font-semibold text-[#0F1724]">
                <span>{subscription.isIndividual ? 'الأيام' : 'الأعضاء'}</span>
                <span>{subscription.isIndividual ? subscription.daysRemaining : `${subscription.currentCount}/${subscription.maxUsers} نشط`}</span>
              </div>
              <div className="w-full bg-[#F0E9D6] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#1A2744] h-full rounded-full transition-all" 
                  style={{ width: `${subscription.progressPercent}%` }}
                />
              </div>
            </div>
            
            <Link 
              href="/dashboard/subscription" 
              className="flex items-center justify-center w-full bg-[#1A2744] text-white text-[14px] font-semibold py-2.5 rounded-md active:scale-[0.98] transition-transform"
            >
              إدارة الاشتراك
            </Link>
          </div>
        </div>

      </main>

      {/* Dialogs */}
      {caseOpen && (
        <CaseDialog
          open={caseOpen}
          onOpenChange={setCaseOpen}
          clients={clients}
          teamMembers={teamMembers}
        />
      )}

      {clientOpen && (
        <ClientDialog
          open={clientOpen}
          onOpenChange={setClientOpen}
        />
      )}

      {sessionOpen && (
        <SessionDialog
          open={sessionOpen}
          onOpenChange={setSessionOpen}
          cases={cases}
        />
      )}

    </div>
  )
}
