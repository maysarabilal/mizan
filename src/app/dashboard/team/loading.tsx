export default function TeamLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-40 bg-[#F0F1F3] rounded-lg" />
          <div className="h-4 w-64 bg-[#F0F1F3] rounded" />
        </div>
        <div className="h-10 w-44 bg-[#F0F1F3] rounded-lg" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-black/[0.06] rounded-xl p-4 flex flex-col gap-2">
            <div className="h-3 w-24 bg-[#F0F1F3] rounded" />
            <div className="h-7 w-12 bg-[#F0F1F3] rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="bg-[#F8F9FB] px-5 py-3.5 grid grid-cols-5 gap-4 border-b border-black/[0.08]">
          {['العضو', 'الدور', 'الحالة', 'تاريخ الانضمام', ''].map((_, i) => (
            <div key={i} className="h-4 bg-[#EAECEF] rounded" />
          ))}
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-5 py-4 grid grid-cols-5 gap-4 border-b border-black/[0.06] items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F0EAD6]" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-28 bg-[#EAECEF] rounded" />
                <div className="h-3 w-20 bg-[#F0F1F3] rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-[#F0F1F3] rounded-full" />
            <div className="h-6 w-14 bg-[#F0F1F3] rounded-full" />
            <div className="h-4 w-24 bg-[#F0F1F3] rounded" />
            <div className="h-8 w-8 bg-[#F0F1F3] rounded-md ms-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
