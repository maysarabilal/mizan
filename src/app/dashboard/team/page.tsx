import { getTeamMembers } from '@/lib/actions/team'
import { createClient } from '@/lib/supabase/server'
import { TeamMemberList } from './_components/TeamMemberList'
import { InviteDialog } from './InviteDialog'
import { redirect } from 'next/navigation'
import { Users, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const resolvedParams = await searchParams
  const isInviteOpen = resolvedParams?.invite === 'true'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hasViewPerm, error: permError } = await supabase.rpc('has_permission', { p_perm: 'view_team' }).single()
  if (permError || !hasViewPerm) redirect('/dashboard')

  const currentUserId = user?.id

  const { data: members } = await getTeamMembers()

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
      maxUsers = (sub.subscription_plans as unknown as { max_users: number }).max_users || 5
    }
  }

  const { checkSubscriptionStatus } = await import('@/lib/actions/subscription')
  const subStatus = await checkSubscriptionStatus()
  const isRemediationMode = (!subStatus.isValid && subStatus.lockReason === 'MEMBER_OVERAGE_EXPIRED') || !!subStatus.overageInfo

  const activeMembers = (members || []).filter(m => m.is_active).length
  const totalMembers = (members || []).length

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-[#0F1724]">فريق العمل</h1>
            <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold px-2.5 py-1 rounded-full border border-[#C9A84C]/20">
              {totalMembers}
            </span>
          </div>
          <p className="text-[14px] text-[#8B939A]">
            إدارة المحامين والإداريين وصلاحيات الوصول للمكتب.
          </p>
        </div>

        {!isRemediationMode && (
          <Link href="/dashboard/team?invite=true" replace>
            <button
              disabled={maxUsers <= 1}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] hover:bg-[#b8973e] text-white text-[14px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-4 w-4" />
              توجيه دعوة انضمام
            </button>
          </Link>
        )}
      </div>

      {/* Overage Warning Banner */}
      {isRemediationMode && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in fade-in-50">
          <div className="flex gap-3 items-start">
            <div className="bg-red-100 p-2 rounded-full shrink-0">
              <Users className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-red-700">وضع التقييد: تجاوز الحد المسموح للأعضاء</h3>
              <p className="text-[13px] mt-1 text-red-600/80 leading-relaxed">
                تم إيقاف معظم خصائص المكتب بسبب تجاوز عدد الأعضاء المسموح ({maxUsers} أعضاء).
                لعودة المكتب للعمل، يمكنك تعطيل حسابات الأعضاء الإضافيين أو الترقية لخطة أعلى.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {!isRemediationMode && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-black/[0.08] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[12px] text-[#9AA3B2] font-medium">إجمالي الأعضاء</span>
            <span className="text-[24px] font-bold text-[#0F1724]">{totalMembers}</span>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[12px] text-[#9AA3B2] font-medium">الأعضاء النشطين</span>
            <span className="text-[24px] font-bold text-emerald-600">{activeMembers}</span>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[12px] text-[#9AA3B2] font-medium">الدعوات المعلقة</span>
            <span className="text-[24px] font-bold text-[#C9A84C]">{(pendingData || []).length}</span>
          </div>
        </div>
      )}

      {maxUsers <= 1 && !isRemediationMode ? (
        <div className="bg-white border border-black/[0.08] rounded-xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-[#F8F9FB] rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-[#9AA3B2]" />
          </div>
          <div className="text-center">
            <h3 className="text-[16px] font-semibold text-[#0F1724]">إدارة الفريق</h3>
            <p className="text-[14px] text-[#8B939A] mt-1">
              إدارة الفريق متاحة في خطة المكتب والمؤسسي فقط.
            </p>
          </div>
          <Link href="/dashboard/subscription">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] hover:bg-[#b8973e] text-white text-[14px] font-semibold rounded-lg transition-colors">
              ترقية الخطة الآن
            </button>
          </Link>
        </div>
      ) : (
        <TeamMemberList
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members={(members as any) || []}
          invitations={pendingData || []}
          currentUserId={currentUserId!}
          isRemediationMode={isRemediationMode}
        />
      )}

      <InviteDialog open={isInviteOpen} />
    </div>
  )
}
