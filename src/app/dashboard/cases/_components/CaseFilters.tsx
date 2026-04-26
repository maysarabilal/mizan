'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ✅ Real values from the DB — no mapping
const CASE_TYPES = ['أسري', 'إداري', 'تجاري', 'جنائي', 'عقاري', 'عمالي', 'مدني']
const CASE_STATUSES = ['جارية', 'في الاستئناف', 'معلقة', 'مكتملة', 'مغلقة']
const CASE_PRIORITIES = ['عالية', 'متوسطة', 'منخفضة']

export function CaseFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') || ''
  const currentType = searchParams.get('type') || ''
  const currentStatus = searchParams.get('status') || ''
  const currentPriority = searchParams.get('priority') || ''

  const hasActiveFilters = !!(currentSearch || currentType || currentStatus || currentPriority)

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
    router.replace(`${pathname}?page=1`, { scroll: false })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border border-[#eef0f4] dark:border-zinc-800 shadow-sm">
      {/* Search */}
      <div className="relative w-full lg:flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="بحث بالعنوان أو رقم القضية..."
          className="pr-9 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Type filter */}
      <div className="w-full lg:w-44">
        <Select
          value={currentType || undefined}
          onValueChange={(val) => updateParam('type', (!val || val === '__clear__') ? null : val)}
        >
          <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700">
            <SelectValue placeholder="نوع القضية" />
          </SelectTrigger>
          <SelectContent>
            {currentType && <SelectItem value="__clear__">← الكل</SelectItem>}
            {CASE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status filter */}
      <div className="w-full lg:w-44">
        <Select
          value={currentStatus || undefined}
          onValueChange={(val) => updateParam('status', (!val || val === '__clear__') ? null : val)}
        >
          <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            {currentStatus && <SelectItem value="__clear__">← الكل</SelectItem>}
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority filter */}
      <div className="w-full lg:w-44">
        <Select
          value={currentPriority || undefined}
          onValueChange={(val) => updateParam('priority', (!val || val === '__clear__') ? null : val)}
        >
          <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700">
            <SelectValue placeholder="الأهمية" />
          </SelectTrigger>
          <SelectContent>
            {currentPriority && <SelectItem value="__clear__">← الكل</SelectItem>}
            {CASE_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={handleClear}
          className="w-full lg:w-auto shrink-0 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
        >
          <X className="h-4 w-4" /> مسح الفلاتر
        </Button>
      )}
    </div>
  )
}
