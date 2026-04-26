export default function ClientsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <div className="h-8 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="h-10 bg-slate-200 rounded w-36" />
      </div>
      <div className="bg-white border border-black/[0.08] rounded-xl p-4">
        <div className="h-10 bg-slate-100 rounded w-80" />
      </div>
      <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
        <div className="h-12 bg-slate-50 border-b" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-black/[0.06] flex items-center px-5 gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 rounded w-40" />
            <div className="h-4 bg-slate-100 rounded w-24 ms-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
