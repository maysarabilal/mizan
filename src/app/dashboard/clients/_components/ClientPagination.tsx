'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export function ClientPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.replace(`/dashboard/clients?${params.toString()}`)
  }

  const from = (currentPage - 1) * itemsPerPage + 1
  const to = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between bg-white border border-black/[0.08] rounded-xl px-5 py-3 shadow-sm">
      <span className="text-[13px] text-[#9AA3B2]">
        عرض {from} إلى {to} من {totalItems} عميل
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 flex items-center justify-center rounded-md text-[#9AA3B2] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`h-8 w-8 flex items-center justify-center rounded-md text-[13px] font-medium transition-colors ${
              page === currentPage
                ? 'bg-[#C9A84C] text-white shadow-sm'
                : 'text-[#6B7280] hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-md text-[#9AA3B2] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
