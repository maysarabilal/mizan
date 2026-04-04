import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { SubscriptionGuard } from '@/components/layout/SubscriptionGuard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkSubscriptionStatus } from '@/lib/actions/subscription'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has ANY office membership (active or inactive)
  const { data: member } = await supabase
    .from('office_members')
    .select('id, role, is_active, disabled_by_admin')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false }) // active first
    .limit(1)
    .maybeSingle()

  // User classification:
  // A) NEW — no record at all → allow onboarding
  // B) EXISTING_INACTIVE — record exists but inactive → block, show suspended
  // C) EXISTING_ACTIVE — active record → allow dashboard
  if (!member) {
    // Category A: truly new user — check admin status first
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      redirect('/admin')
    }

    redirect('/setup')
  }

  // Enforce office activation and subscription rules
  const subStatus = await checkSubscriptionStatus()

  if (!member.is_active) {
    // Category B: existing user with inactive membership
    // Treat as locked in-place rather than redirecting to a standalone suspended page
    subStatus.isValid = false
    subStatus.lockReason = member.disabled_by_admin ? 'MEMBER_DISABLED' : 'MEMBER_DISABLED'
  }

  // Category C: active membership (or we're deliberately showing the locked screen)

  // If the office itself is suspended by admin, override lockReason
  if (member.is_active && !subStatus.isOfficeActive) {
    subStatus.isValid = false
    subStatus.lockReason = 'OFFICE_SUSPENDED'
  }

  return (
    <div className="flex min-h-[100dvh] w-full bg-gray-50 dark:bg-zinc-950 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 w-full min-w-0">
        {subStatus.overageInfo && (
          <div className="bg-red-500 text-white px-4 py-3 text-center text-sm font-medium z-[100] shadow-sm animate-in slide-in-from-top duration-300">
            <strong>تحذير هام:</strong> مسموح في خطتك الجديدة بـ {subStatus.overageInfo.maxUsers} أعضاء فقط ولديك {subStatus.overageInfo.currentCount} نشط. 
            أمامك حتى الموعد {new Date(subStatus.overageInfo.graceDeadline).toLocaleDateString('ar')} لحذف الزيادة لتجنب التجميد التلقائي للمكتب.
          </div>
        )}
        <Topbar />
        
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <SubscriptionGuard data={subStatus}>
            {children}
          </SubscriptionGuard>
        </main>
      </div>
    </div>
  )
}
