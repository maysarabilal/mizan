import { getAllSubscriptionRequests, getConfirmedRevenueTotal } from '@/lib/actions/admin'
import { SubscriptionManagement } from '../_components/SubscriptionManagement'

export default async function AdminSubscriptionsPage() {
  const [requestsRes, revenueRes] = await Promise.all([
    getAllSubscriptionRequests(),
    getConfirmedRevenueTotal()
  ])

  if (requestsRes.error) {
    return (
      <div className="p-12 text-center text-red-400 border border-red-900/40 rounded-xl bg-red-950/20">
        <h2 className="text-xl font-bold">خطأ في تحميل بيانات الاشتراكات</h2>
        <p className="text-sm text-red-300/70 mt-2">{requestsRes.error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">إدارة الاشتراكات</h1>
        <p className="text-zinc-400 text-sm mt-1">مراجعة طلبات الترقية، تأكيد المدفوعات، وتتبع سجل الاشتراكات.</p>
      </div>
      <SubscriptionManagement
        requests={requestsRes.data || []}
        totalRevenue={revenueRes.data || 0}
      />
    </div>
  )
}
