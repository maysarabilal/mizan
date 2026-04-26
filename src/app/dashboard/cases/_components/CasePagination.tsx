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

interface CasePaginationProps {
  total: number
}

export function CasePagination({ total }: CasePaginationProps) {
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
      router.push(`${pathname}?${createQueryString('page', newPage.toString())}`)
    }
  }

  const handlePerPageChange = (newPerPage: string | null) => {
    if (!newPerPage) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('per_page', newPerPage)
    params.set('page', '1') // Reset to page 1 when changing page size
    router.push(`${pathname}?${params.toString()}`)
  }

  // Calculate the range being shown
  const start = Math.min((currentPage - 1) * perPage + 1, total)
  const end = Math.min(currentPage * perPage, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#eef0f4] dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-b-xl gap-4">
      {/* Right side in RTL (يمين) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">الصفوف:</span>
          <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[80px] h-9">
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
            className="h-9 w-9"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronRight className="h-4 w-4" /> {/* Right points to Previous in RTL */}
            <span className="sr-only">السابق</span>
          </Button>
          <div className="text-sm font-medium px-4">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronLeft className="h-4 w-4" /> {/* Left points to Next in RTL */}
            <span className="sr-only">التالي</span>
          </Button>
        </div>
      </div>

      {/* Left side in RTL (يسار) */}
      <div className="text-sm text-muted-foreground text-left">
        عرض {total === 0 ? 0 : start} إلى {end} من {total} قضية
      </div>
    </div>
  )
}
