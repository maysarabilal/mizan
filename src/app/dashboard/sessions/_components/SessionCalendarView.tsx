'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, Building2, MoreVertical, Eye, Pencil, User } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SessionDialog } from '../SessionDialog'
import { Database } from '@/types/database'

type SessionRowExt = Database['public']['Tables']['sessions']['Row'] & {
  cases: { title: string, clients: { name: string } | null, profiles?: { full_name: string } | null } | null
}
type CaseRow = Database['public']['Tables']['cases']['Row']

const statusColors: Record<string, string> = {
  scheduled: '#3B82F6',
  completed: '#22C55E',
  postponed: '#F97316',
  cancelled: '#EF4444',
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: 'مجدولة', bg: '#EFF6FF', text: '#3B82F6' },
  completed: { label: 'مكتملة', bg: '#F0FDF4', text: '#22C55E' },
  postponed: { label: 'مؤجلة', bg: '#FFF7ED', text: '#F97316' },
  cancelled: { label: 'ملغاة', bg: '#FEF2F2', text: '#EF4444' },
}

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

interface SessionCalendarViewProps {
  sessions: SessionRowExt[]
  cases: CaseRow[]
  workingDays: string[]
}

export function SessionCalendarView({ sessions, cases, workingDays }: SessionCalendarViewProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSession, setEditingSession] = useState<any | null>(null)

  // Build session map by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionRowExt[]> = {}
    for (const s of sessions) {
      if (s.session_date) {
        const key = s.session_date
        if (!map[key]) map[key] = []
        map[key].push(s)
      }
    }
    return map
  }, [sessions])

  // Get sessions for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedSessions = sessionsByDate[selectedDateStr] || []

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const rows: Date[][] = []
  let days: Date[] = []
  let day = calStart

  while (day <= calEnd) {
    for (let i = 0; i < 7; i++) {
      days.push(day)
      day = addDays(day, 1)
    }
    rows.push(days)
    days = []
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[630px]">
        {/* Calendar Panel (65%) */}
        <div className="flex flex-col border border-black/8 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex-[2]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-black/8 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-[#0F1724] dark:text-zinc-100">
              {format(currentMonth, 'MMMM yyyy', { locale: ar })}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-black/8"
                onClick={() => {
                  setCurrentMonth(new Date())
                  setSelectedDate(new Date())
                }}
              >
                اليوم
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-black/8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-[18px] w-[18px]" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-black/8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-black/8 dark:border-zinc-800">
            {WEEKDAYS_AR.map((d) => (
              <div key={d} className="text-center py-3 text-[13px] font-semibold text-[#8B939A]">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1">
            {rows.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-black/8 dark:border-zinc-800 last:border-b-0">
                {week.map((d, di) => {
                  const dateStr = format(d, 'yyyy-MM-dd')
                  const daySessions = sessionsByDate[dateStr] || []
                  const isCurrentMonth = isSameMonth(d, monthStart)
                  const isSelected = isSameDay(d, selectedDate)
                  const isToday = isSameDay(d, new Date())

                  return (
                    <div
                      key={di}
                      onClick={() => setSelectedDate(d)}
                      className={`
                        min-h-[100px] p-3 cursor-pointer transition-colors relative flex flex-col justify-between
                        ${!isCurrentMonth ? 'bg-[#F1F3F5] dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950'}
                        ${isSelected ? '!bg-[#1A2744]' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'}
                        ${di < 6 ? 'border-e border-black/8 dark:border-zinc-800' : ''}
                      `}
                    >
                      <span className={`
                        text-sm font-medium text-end
                        ${!isCurrentMonth ? 'text-[#8B939A]' : isSelected ? 'text-white' : 'text-[#0F1724] dark:text-zinc-100'}
                        ${isToday && !isSelected ? 'text-[#3B82F6] font-bold' : ''}
                      `}>
                        {format(d, 'd')}
                      </span>

                      {daySessions.length > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-auto">
                          {daySessions.slice(0, 4).map((session, si) => (
                            <div
                              key={si}
                              className={`w-2 h-2 rounded-full ${isSelected ? 'border border-[#1A2744]' : ''}`}
                              style={{ backgroundColor: statusColors[session.outcome] || statusColors.scheduled }}
                            />
                          ))}
                          {daySessions.length > 4 && (
                            <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#8B939A]'}`}>
                              +{daySessions.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Day Details Panel (35%) */}
        <div className="flex flex-col border border-black/8 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex-1 min-w-[380px]">
          <div className="flex items-center justify-between p-6 border-b border-black/8 dark:border-zinc-800">
            <h3 className="text-base font-bold text-[#0F1724] dark:text-zinc-100">
              {format(selectedDate, 'd MMMM yyyy', { locale: ar })}
            </h3>
            <span className="text-[13px] text-[#8B939A]">
              {selectedSessions.length} جلسات
            </span>
          </div>

          <div className="flex flex-col gap-4 p-6 overflow-y-auto flex-1">
            {selectedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-[#8B939A]" />
                </div>
                <p className="text-sm text-[#8B939A]">لا توجد جلسات في هذا اليوم</p>
              </div>
            ) : (
              selectedSessions.map((session) => {
                const config = statusConfig[session.outcome] || statusConfig.scheduled
                const borderColor = statusColors[session.outcome] || statusColors.scheduled

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 p-4 border border-black/8 dark:border-zinc-800 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                    style={{ borderInlineStartWidth: '4px', borderInlineStartColor: borderColor }}
                    onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                  >
                    {/* Top row: time + actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">
                        {session.session_time ? session.session_time.substring(0, 5) : 'غير محدد'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4 text-[#8B939A]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/sessions/${session.id}`) }}>
                            <Eye className="me-2 h-4 w-4" /> عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingSession(session) }}>
                            <Pencil className="me-2 h-4 w-4" /> تعديل الجلسة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Case title */}
                    <div className="text-[15px] font-semibold text-[#0F1724] dark:text-zinc-100 line-clamp-1">
                      {session.cases?.title || '—'}
                    </div>

                    {/* Court + Lawyer info */}
                    <div className="flex flex-col gap-1">
                      {session.court && (
                        <div className="flex items-center gap-1.5 text-[13px] text-[#8B939A]">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{session.court}</span>
                        </div>
                      )}
                      {session.cases?.profiles?.full_name && (
                        <div className="flex items-center gap-1.5 text-[13px] text-[#8B939A]">
                          <User className="h-3.5 w-3.5" />
                          <span>{session.cases.profiles.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: type badge + status pill */}
                    <div className="flex items-center justify-between mt-1">
                      {session.session_type && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EFD9] rounded text-xs font-medium text-[#3B2F10]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B939A]" />
                          {session.session_type}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: config.bg, color: config.text }}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit dialog from calendar */}
      <SessionDialog
        open={!!editingSession}
        onOpenChange={(open) => { if (!open) setEditingSession(null) }}
        sessionItem={editingSession}
        cases={cases}
        workingDays={workingDays}
      />
    </>
  )
}
