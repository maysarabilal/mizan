import { Skeleton } from '@/components/ui/skeleton'

export default function CaseDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-8 animate-pulse">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 border rounded-xl p-6 flex flex-col gap-6">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="border rounded-xl p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-18 w-18 rounded-full" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-col gap-3 w-full">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border rounded-xl overflow-hidden">
        <div className="flex border-b h-14 bg-white">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24 mx-6 my-auto" />
          ))}
        </div>
        <div className="p-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-5 border-b items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
