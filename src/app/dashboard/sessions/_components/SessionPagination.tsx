'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SessionPaginationProps {
  total: number
}

export function SessionPagination({ total }: SessionPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page')) || 1
  const perPage = Number(searchParams.get('per_page')) || 10

  const totalPages = Math.ceil(total / perPage) || 1

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.replace(`${pathname}?${createQueryString('page', newPage.toString())}`, { scroll: false })
    }
  }

  const handlePerPageChange = (newPerPage: string | null) => {
    if (!newPerPage) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('per_page', newPerPage)
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const start = Math.min((currentPage - 1) * perPage + 1, total)
  const end = Math.min(currentPage * perPage, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-black/8 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-b-lg gap-4">
      {/* Right side in RTL */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#8B939A]">الصفوف:</span>
          <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[80px] h-8 text-[13px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-black/8"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">السابق</span>
          </Button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i + 1
            const isActive = page === currentPage
            return (
              <Button
                key={page}
                variant="outline"
                size="icon"
                className={`h-8 w-8 text-[13px] font-semibold ${isActive
                  ? 'bg-[#F4EFD9] border-[#F4EFD9] text-[#0F1724]'
                  : 'border-black/8 text-[#0F1724]'
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            )
          })}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-black/8"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">التالي</span>
          </Button>
        </div>
      </div>

      {/* Left side in RTL */}
      <div className="text-[13px] text-[#8B939A] text-left">
        عرض {total === 0 ? 0 : start} إلى {end} من {total} جلسة
      </div>
    </div>
  )
}
