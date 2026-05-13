'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Search, X, CalendarRange, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'

const SESSION_STATUSES = ['scheduled', 'completed', 'postponed', 'cancelled']
const statusMap: Record<string, string> = {
  'scheduled': 'مجدولة',
  'completed': 'مكتملة',
  'postponed': 'مؤجلة',
  'cancelled': 'ملغاة',
}

interface SessionFiltersProps {
  sessionTypes: string[]
  courts: string[]
}

export function SessionFilters({ sessionTypes, courts }: SessionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') || ''
  const currentStatus = searchParams.get('status') || ''
  const currentType = searchParams.get('type') || ''
  const currentCourt = searchParams.get('court') || ''
  const currentDateFrom = searchParams.get('date_from') || ''
  const currentDateTo = searchParams.get('date_to') || ''

  const [dateFrom, setDateFrom] = useState(currentDateFrom)
  const [dateTo, setDateTo] = useState(currentDateTo)
  const [dateOpen, setDateOpen] = useState(false)

  const hasActiveFilters = !!(currentSearch || currentStatus || currentType || currentCourt || currentDateFrom || currentDateTo)
  const hasDateRange = !!(currentDateFrom || currentDateTo)

  const updateParam = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSearch = useDebouncedCallback((term: string) => {
    updateParam('q', term || null)
  }, 300)

  const handleClear = () => {
    setDateFrom('')
    setDateTo('')
    router.replace(`${pathname}?page=1`, { scroll: false })
  }

  const applyDateRange = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (dateFrom) params.set('date_from', dateFrom)
    else params.delete('date_from')
    if (dateTo) params.set('date_to', dateTo)
    else params.delete('date_to')
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    setDateOpen(false)
  }

  const clearDateRange = () => {
    setDateFrom('')
    setDateTo('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('date_from')
    params.delete('date_to')
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    setDateOpen(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
      {/* Search */}
      <div className="relative w-full lg:w-[300px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B939A] pointer-events-none" />
        <Input
          type="search"
          placeholder="بحث بالقضية، الموكل، المحامي، المحكمة..."
          className="pr-9 h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm"
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap lg:flex-nowrap gap-3 flex-1">
        {/* Status filter */}
        <div className="w-full sm:w-[160px]">
          <Select
            value={currentStatus || undefined}
            onValueChange={(val) => updateParam('status', (!val || val === '__clear__') ? null : val)}
          >
            <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm">
              <SelectValue>
                {currentStatus ? statusMap[currentStatus] : "الحالة"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currentStatus && <SelectItem value="__clear__">← الكل</SelectItem>}
              {SESSION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{statusMap[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type filter */}
        <div className="w-full sm:w-[160px]">
          <Select
            value={currentType || undefined}
            onValueChange={(val) => updateParam('type', (!val || val === '__clear__') ? null : val)}
          >
            <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm">
              <SelectValue placeholder="نوع الجلسة" />
            </SelectTrigger>
            <SelectContent>
              {currentType && <SelectItem value="__clear__">← الكل</SelectItem>}
              {sessionTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Court filter */}
        <div className="w-full sm:w-[160px]">
          <Select
            value={currentCourt || undefined}
            onValueChange={(val) => updateParam('court', (!val || val === '__clear__') ? null : val)}
          >
            <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm">
              <SelectValue placeholder="المحكمة" />
            </SelectTrigger>
            <SelectContent>
              {currentCourt && <SelectItem value="__clear__">← الكل</SelectItem>}
              {courts.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range — NOW FUNCTIONAL */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              className={`
                w-full sm:w-[220px] flex items-center justify-between h-10 px-3
                bg-white dark:bg-zinc-950 border rounded-md text-sm transition-colors
                ${hasDateRange
                  ? 'border-[#C9A84C] text-[#0F1724] dark:text-zinc-100'
                  : 'border-black/8 dark:border-zinc-700 text-[#8B939A]'
                }
                hover:border-[#C9A84C]/50
              `}
            >
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                <span>{hasDateRange ? 'تاريخ محدد' : 'نطاق التاريخ'}</span>
              </div>
              {hasDateRange && (
                <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">تحديد نطاق التاريخ</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8B939A]">من تاريخ</label>
                  <Input
                    type="date"
                    dir="ltr"
                    className="text-sm h-9"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8B939A]">إلى تاريخ</label>
                  <Input
                    type="date"
                    dir="ltr"
                    className="text-sm h-9"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={applyDateRange}
                  className="flex-1 bg-[#C9A84C] hover:bg-[#b89a42] text-[#1A2744] font-semibold gap-1"
                >
                  <Check className="h-3.5 w-3.5" /> تطبيق
                </Button>
                {hasDateRange && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearDateRange}
                    className="text-muted-foreground"
                  >
                    مسح
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="w-full lg:w-auto shrink-0 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors h-10"
          >
            <X className="h-4 w-4" /> مسح الفلاتر
          </Button>
        )}
      </div>
    </div>
  )
}
