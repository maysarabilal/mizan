import { getOfficesList } from '@/lib/actions/admin'
import { OfficesDirectory } from '../_components/OfficesDirectory'

export default async function AdminOfficesPage() {
  const { data: offices, error } = await getOfficesList()

  if (error) {
    return (
      <div className="p-12 text-center text-red-400 border border-red-900/40 rounded-xl bg-red-950/20">
        <h2 className="text-xl font-bold">خطأ في تحميل المكاتب</h2>
        <p className="text-sm text-red-300/70 mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">إدارة المكاتب</h1>
        <p className="text-zinc-400 text-sm mt-1">جميع المكاتب المسجلة في المنصة مع أدوات التحكم.</p>
      </div>
      <OfficesDirectory offices={offices || []} />
    </div>
  )
}
