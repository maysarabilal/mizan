import { getCurrentSubscription, getAvailablePlans, getPaymentHistory, getPendingUpgradeRequest } from '@/lib/actions/subscriptions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionOverview } from './SubscriptionOverview'
import { PlansGrid } from './PlansGrid'
import { BillingHistoryTable } from './BillingHistoryTable'

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

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">الاشتراك والباقات</h1>
        <p className="text-muted-foreground text-sm">إدارة اشتراك المكتب، ترقية الباقة الحالية ومتابعة سجل المدفوعات.</p>
      </div>

      <SubscriptionOverview subscription={subscription} memberCount={memberCount} />
      
      <div className="pt-4 border-t">
        <h2 className="text-2xl font-bold tracking-tight mb-6">الباقات المتوفرة</h2>
        <PlansGrid
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plans={plans as any} 
          currentPlanId={subscription?.plan_id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pendingRequest={pendingRequest as any} 
        />
      </div>

      <div className="pt-4 border-t">
        <h2 className="text-2xl font-bold tracking-tight mb-6">سجل الدفعات والفواتير</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <BillingHistoryTable payments={payments as any} />
      </div>
    </div>
  )
}
