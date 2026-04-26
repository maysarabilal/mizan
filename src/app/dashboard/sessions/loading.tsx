export default function SessionsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-6 w-8 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-[34px] w-[153px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-[34px] w-[118px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-[300px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-10 w-[180px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-10 w-[180px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-10 w-[180px] bg-slate-200 dark:bg-zinc-800 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="border border-black/8 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
        {/* Table header */}
        <div className="h-12 bg-slate-50 dark:bg-zinc-900/50 border-b border-black/8" />
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-[70px] border-b border-black/8 flex items-center gap-4 px-6 ${i % 2 === 1 ? 'bg-[#F9FAFB] dark:bg-zinc-900/30' : ''}`}>
            <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-28 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
        {/* Pagination skeleton */}
        <div className="h-16 border-t border-black/8 px-6 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  )
}
