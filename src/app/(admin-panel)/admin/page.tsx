import Link from 'next/link'
import { getAdminOverview } from '@/lib/actions/admin'
import { AdminGlobalStats } from './_components/AdminGlobalStats'
import { Building2, Users, FileCheck, CreditCard, AlertTriangle } from 'lucide-react'

export default async function AdminDashboardPage() {
  const { data: stats, error } = await getAdminOverview()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-red-400 gap-4 border border-red-900/40 rounded-xl bg-red-950/20">
        <h2 className="text-xl font-bold">حدث خطأ أثناء تحميل البيانات</h2>
        <p className="text-sm text-red-300/70">{error}</p>
      </div>
    )
  }

  const quickLinks = [
    {
      label: 'المكاتب',
      href: '/admin/offices',
      icon: Building2,
      value: stats?.totalOffices || 0,
      desc: 'مكتب مسجل',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-zinc-800',
    },
    {
      label: 'طلبات معلقة',
      href: '/admin/subscriptions',
      icon: FileCheck,
      value: stats?.pendingRequests || 0,
      desc: 'طلب ترقية معلق',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: stats?.pendingRequests ? 'border-amber-600/50' : 'border-zinc-800',
    },
    {
      label: 'بانتظار الدفع',
      href: '/admin/subscriptions',
      icon: CreditCard,
      value: stats?.awaitingPayment || 0,
      desc: 'طلب بانتظار تأكيد الدفع',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: stats?.awaitingPayment ? 'border-emerald-600/50' : 'border-zinc-800',
    },
    {
      label: 'المستخدمين',
      href: '/admin/users',
      icon: Users,
      value: stats?.platformStats?.members || 0,
      desc: 'مستخدم مسجل',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-zinc-800',
    },
    {
      label: 'تجاوز الحد',
      href: '/admin/offices',
      icon: AlertTriangle,
      value: stats?.overagedOffices || 0,
      desc: 'مكتب يتجاوز حد أعضاء خطته',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: stats?.overagedOffices ? 'border-red-600/50' : 'border-zinc-800',
    },
  ]

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">لوحة القيادة المركزية</h1>
        <p className="text-zinc-400 text-sm mt-1">مراقبة شاملة لكافة المكاتب والمستخدمين والعمليات المالية.</p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex flex-col gap-3 p-5 rounded-xl bg-zinc-900 border ${item.border} hover:border-amber-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-amber-600/5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Platform-wide analytics */}
      {stats?.platformStats && <AdminGlobalStats stats={stats.platformStats} />}
    </div>
  )
}
