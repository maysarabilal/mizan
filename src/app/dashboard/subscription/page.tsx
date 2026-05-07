import { getCurrentSubscription, getAvailablePlans, getPaymentHistory, getPendingUpgradeRequest } from '@/lib/actions/subscriptions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlansGrid } from './PlansGrid'
import { format } from 'date-fns'

export default async function SubscriptionPage() {
  // Route Guard: only owners can manage subscriptions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('office_members')
    .select('role, office_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member || member.role !== 'owner') {
    redirect('/dashboard')
  }

  const memberCountPromise = supabase
    .from('office_members')
    .select('*', { count: 'exact', head: true })
    .eq('office_id', member.office_id)
    .eq('is_active', true)

  const [subscriptionRes, plansRes, paymentsRes, pendingRes, memberCountRes] = await Promise.all([
    getCurrentSubscription(),
    getAvailablePlans(),
    getPaymentHistory(),
    getPendingUpgradeRequest(),
    memberCountPromise
  ])

  // In a real app, you might want to handle errors better or show an error state
  const subscription = subscriptionRes.data || null
  const plans = plansRes.data || []
  const payments = paymentsRes.data || []
  const pendingRequest = pendingRes.data || null
  const memberCount = memberCountRes.count || 0

  let currentPlanCard = null
  if (subscription) {
    const status = subscription.status
    const current_period_end = subscription.current_period_end
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = subscription.subscription_plans as any
    const usersLimit = plan?.max_users || 1

    const isInfinite = usersLimit > 1000
    const progressValue = Math.min(100, (memberCount / usersLimit) * 100)

    const statusMap: Record<string, string> = {
      'active': 'فعال',
      'trialing': 'تجريبي',
      'past_due': 'متأخر الدفع',
      'expired': 'منتهي',
      'cancelled': 'ملغى',
      'pending': 'معلق',
      'awaiting_payment': 'بانتظار الدفع',
    }
    const displayStatus = statusMap[status] || status

    const PLAN_DISPLAY_NAMES: Record<string, string> = {
      'individual': 'الأساس',
      'office': 'الاحتراف',
      'institution': 'الريادة',
      'individual_yearly': 'الأساس — سنوي',
      'office_yearly': 'الاحتراف — سنوي',
      'institution_yearly': 'الريادة — سنوي',
      'enterprise': 'المؤسسات',
    }

    currentPlanCard = (
      <div className="w-full bg-white border border-black/8 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[8px] p-[24px]">
        <div className="flex justify-between items-start mb-[24px]">
          <div className="flex flex-col gap-[6px]">
            <div className="uppercase tracking-[0.5px] text-[12px] font-semibold text-[#9AA3B2]">CURRENT PLAN</div>
            <div className="text-[15px] font-semibold text-[#0F1724]">{PLAN_DISPLAY_NAMES[plan.slug] ?? plan.name}</div>
          </div>
          
          <div className="flex flex-col gap-[6px]">
            <div className="uppercase tracking-[0.5px] text-[12px] font-semibold text-[#9AA3B2]">STATUS</div>
            <div className="flex items-center gap-[8px]">
              <div className={`w-[14px] h-[14px] rounded-full border-[1.16px] flex items-center justify-center ${status === 'active' || status === 'trialing' ? 'border-[#EAB308]' : 'border-gray-400'}`}>
                {/* Inner dot */}
              </div>
              <div className="text-[15px] font-semibold text-[#0F1724]">{displayStatus}</div>
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <div className="uppercase tracking-[0.5px] text-[12px] font-semibold text-[#9AA3B2]">EXPIRY DATE</div>
            <div className="text-[15px] font-semibold text-[#0F1724]" dir="ltr">{format(new Date(current_period_end), 'MMM d, yyyy')}</div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <div className="uppercase tracking-[0.5px] text-[12px] font-semibold text-[#9AA3B2]">TEAM MEMBERS</div>
            <div className="text-[15px] font-semibold text-[#0F1724]">{memberCount} {isInfinite ? '' : `/ ${usersLimit}`}</div>
          </div>
        </div>

        {!isInfinite && (
          <div className="w-full h-[6px] bg-[#F0EAD6] rounded-full overflow-hidden">
            <div className="h-full bg-[#1A2744] rounded-full" style={{ width: `${progressValue}%` }}></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[32px] w-full animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col gap-[6px]">
        <h1 className="text-[28px] font-bold text-[#0F1724]">خطط الاشتراك</h1>
        <p className="text-[14px] text-[#9AA3B2]">اختر الخطة المناسبة لمكتبك — يمكنك الترقية أو التغيير في أي وقت</p>
      </div>

      {currentPlanCard}
      
      {/* Pending Request Banner */}
      {pendingRequest && (
        <div className="bg-[#FFFBEB] border border-[#FEF08A] rounded-[6px] p-[16px_20px] flex justify-between items-center">
          <div className="flex items-center gap-[12px]">
            <div className="w-[20px] h-[20px] rounded-full border-[1.67px] border-[#92400E] flex items-center justify-center text-[#92400E] font-bold text-[10px]">!</div>
            <div className="text-[14px] text-[#92400E]">
              {pendingRequest.status === 'awaiting_payment' 
                ? 'لديك طلب ترقية بانتظار تأكيد الدفع من الإدارة.' 
                : 'يوجد طلب ترقية قيد المراجعة من قبل الإدارة.'}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="flex flex-col gap-[16px]">
        <h2 className="text-[16px] font-semibold text-[#1A2744]">الباقات المتوفرة</h2>
        <PlansGrid
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plans={plans} 
          currentPlanId={subscription?.plan_id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pendingRequest={pendingRequest as any} 
        />
      </div>

      {/* Payment History */}
      <div className="flex flex-col gap-[16px]">
        <h2 className="text-[16px] font-semibold text-[#1A2744]">سجل المدفوعات</h2>
        <div className="bg-white border border-black/8 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[8px] overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-black/8">
                <th className="uppercase text-[12px] font-semibold tracking-[0.5px] text-[#9AA3B2] p-[16px_24px]">المعرف (الفاتورة)</th>
                <th className="uppercase text-[12px] font-semibold tracking-[0.5px] text-[#9AA3B2] p-[16px_24px]">التاريخ</th>
                <th className="uppercase text-[12px] font-semibold tracking-[0.5px] text-[#9AA3B2] p-[16px_24px]">طريقة الدفع</th>
                <th className="uppercase text-[12px] font-semibold tracking-[0.5px] text-[#9AA3B2] p-[16px_24px]">الحالة</th>
                <th className="uppercase text-[12px] font-semibold tracking-[0.5px] text-[#9AA3B2] p-[16px_24px] text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-[32px] text-center text-[#9AA3B2] text-[14px]">لا يوجد سجل فواتير مسجل لهذا المكتب حتى الآن.</td>
                </tr>
              ) : (
                payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b border-black/8">
                    <td className="p-[19.5px_24px] text-[14px] text-[#0F1724] uppercase">{payment.id.split('-')[0]}</td>
                    <td className="p-[19.5px_24px] text-[14px] font-medium text-[#0F1724]" dir="ltr">{format(new Date(payment.created_at), 'yyyy/MM/dd HH:mm')}</td>
                    <td className="p-[19.5px_24px] text-[14px] text-[#0F1724]">{payment.payment_method === 'bank_transfer' ? 'حوالة بنكية' : 'بطاقة ائتمانية'}</td>
                    <td className="p-[19.5px_24px]">
                      {payment.status === 'confirmed' ? (
                        <span className="bg-[#16A34A] text-white rounded-full px-[12px] py-[4px] text-[12px] font-semibold">مؤكد</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 rounded-full px-[12px] py-[4px] text-[12px] font-semibold">{payment.status}</span>
                      )}
                    </td>
                    <td className="p-[19.5px_24px] text-[14px] text-[#0F1724] text-left font-bold">₪ {payment.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {payments.length > 0 && (
            <div className="p-[16px_24px] text-[13px] text-[#9AA3B2]">
              Showing {payments.length} of {payments.length} payments
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
