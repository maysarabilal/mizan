'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { List, Calendar as CalendarIcon } from 'lucide-react'

const legendItems = [
  { color: '#3B82F6', label: 'مجدولة' },
  { color: '#22C55E', label: 'مكتملة' },
  { color: '#F97316', label: 'مؤجلة' },
  { color: '#EF4444', label: 'ملغاة' },
]

interface SessionViewToggleProps {
  currentView: string
}

export function SessionViewToggle({ currentView }: SessionViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    // Reset page when switching views
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* View Toggle Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('list')}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
            ${currentView === 'list'
              ? 'bg-[#1A2744] text-white border border-[#1A2744]'
              : 'bg-white dark:bg-zinc-950 text-[#8B939A] border border-black/8 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900'
            }
          `}
        >
          <List className="h-4 w-4" />
          العرض كقائمة
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
            ${currentView === 'calendar'
              ? 'bg-[#1A2744] text-white border border-[#1A2744]'
              : 'bg-white dark:bg-zinc-950 text-[#8B939A] border border-black/8 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900'
            }
          `}
        >
          <CalendarIcon className="h-4 w-4" />
          التقويم
        </button>
      </div>

      {/* Legend (shown for both views) */}
      <div className="flex items-center gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-[#8B939A]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
