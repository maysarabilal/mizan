import { Skeleton } from '@/components/ui/skeleton'

export default function CasesLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm items-center">
        <Skeleton className="h-10 w-full lg:w-1/3" />
        <Skeleton className="h-10 w-full lg:w-1/6" />
        <Skeleton className="h-10 w-full lg:w-1/6" />
        <Skeleton className="h-10 w-full lg:w-1/6" />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="bg-muted/50 h-12 flex items-center px-6 gap-4 border-b">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Table Rows (10 rows) */}
        <div className="flex flex-col">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 flex items-center px-6 gap-4 border-b last:border-b-0">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-between items-center p-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}
