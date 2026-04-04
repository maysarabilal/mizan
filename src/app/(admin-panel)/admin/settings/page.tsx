export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">إعدادات النظام</h1>
        <p className="text-zinc-400 text-sm mt-1">إعدادات المنصة العامة وأدوات الصيانة.</p>
      </div>
      <div className="border border-zinc-800 rounded-xl bg-zinc-900 p-8 text-center text-zinc-500">
        سيتم إضافة الإعدادات المتقدمة في التحديثات القادمة.
      </div>
    </div>
  )
}
