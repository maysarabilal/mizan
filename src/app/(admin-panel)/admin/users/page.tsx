import { getGlobalUsers } from '@/lib/actions/admin'
import { GlobalUsersList } from '../_components/GlobalUsersList'

export default async function AdminUsersPage() {
  const { data: users, error } = await getGlobalUsers()

  if (error) {
    return (
      <div className="p-12 text-center text-red-400 border border-red-900/40 rounded-xl bg-red-950/20">
        <h2 className="text-xl font-bold">خطأ في تحميل المستخدمين</h2>
        <p className="text-sm text-red-300/70 mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">دليل المستخدمين</h1>
        <p className="text-zinc-400 text-sm mt-1">جميع الأعضاء المسجلين عبر كافة المكاتب.</p>
      </div>
      <GlobalUsersList users={users || []} />
    </div>
  )
}
