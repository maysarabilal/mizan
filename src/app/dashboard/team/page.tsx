import { getTeamMembers } from '@/lib/actions/team'
import { createClient } from '@/lib/supabase/server'
import { TeamTable } from './TeamTable'
import { InviteDialog } from './InviteDialog'
import { Button } from '@/components/ui/button'
import { UserPlus, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  // Next.js 15+: searchParams is a Promise — must await it
  const resolvedParams = await searchParams
  const isInviteOpen = resolvedParams?.invite === 'true'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Route Guard: Atomic Permission Check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hasViewPerm, error: permError } = await (supabase.rpc as any)('has_permission', { p_perm: 'view_team' }).single()

  if (permError || !hasViewPerm) {
    redirect('/dashboard')
  }

  const currentUserId = user?.id

  // Fetch Team
  const { data: members } = await getTeamMembers()

  // Fetch pending invitations
  const { data: pendingData } = await supabase
    .from('invitations')
    .select('*')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const { data: memberObj } = await supabase.from('office_members').select('office_id').eq('user_id', user!.id).single()
  let maxUsers = 5
  if (memberObj?.office_id) {
    const { data: sub } = await supabase
      .from('office_subscriptions')
      .select('subscription_plans(max_users)')
      .eq('office_id', memberObj.office_id)
      .single()
    if (sub?.subscription_plans && typeof sub.subscription_plans === 'object' && !Array.isArray(sub.subscription_plans)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maxUsers = (sub.subscription_plans as any).max_users || 5
    }
  }

  const { checkSubscriptionStatus } = await import('@/lib/actions/subscription')
  const subStatus = await checkSubscriptionStatus()
  const isRemediationMode = !subStatus.isValid && subStatus.lockReason === 'MEMBER_OVERAGE_EXPIRED'

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">إدارة فريق العمل</h1>
          <p className="text-muted-foreground text-sm">إدارة المحامين، الإداريين وصلاحيات الوصول للنظام</p>
        </div>
        
        {!isRemediationMode && (
          <Link href="/dashboard/team?invite=true" replace>
            <Button className="shrink-0 shadow-sm" disabled={maxUsers <= 1}>
              <UserPlus className="me-2 h-4 w-4" /> توجيه دعوة انضمام
            </Button>
          </Link>
        )}
      </div>

      {isRemediationMode && (
        <div className="bg-red-950/20 border border-red-800/50 p-4 rounded-xl text-red-500 shadow-sm animate-in fade-in-50">
          <div className="flex gap-3">
            <span className="bg-red-900/30 p-2 rounded-full h-fit">
              <UsersIcon className="w-5 h-5 text-red-400" />
            </span>
            <div>
              <h3 className="font-semibold text-lg text-red-400">وضع التقييد: تجاوز الحد المسموح للأعضاء</h3>
              <p className="text-sm mt-1 text-red-300/80 leading-relaxed">
                تم إيقاف معظم خصائص المكتب بسبب تجاوز عدد الأعضاء المسموح ({maxUsers} أعضاء).
                لعودة المكتب للعمل، يمكنك تعطيل حسابات الأعضاء الإضافيين من هذه الصفحة أو التوجه للاشتراكات للترقية.
              </p>
            </div>
          </div>
        </div>
      )}

      {maxUsers <= 1 ? (
        <div className="text-center py-16">
          <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">إدارة الفريق</h3>
          <p className="mt-2 text-muted-foreground">
            إدارة الفريق متاحة في خطة المكتب والمؤسسي فقط.
          </p>
          <Link href="/dashboard/subscription">
            <Button className="mt-6">ترقية الخطة الآن</Button>
          </Link>
        </div>
      ) : (
        <TeamTable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members={members as any || []} 
          invitations={pendingData || []} 
          currentUserId={currentUserId!} 
          isRemediationMode={isRemediationMode} 
        />
      )}

      <InviteDialog open={isInviteOpen} />
    </div>
  )
}
