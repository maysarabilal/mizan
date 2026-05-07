'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, User, Briefcase, AlertTriangle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskDialog } from './TaskDialog'
import { Database } from '@/types/database'
import { PRIORITY_LABELS, STATUS_LABELS, AppPriority, AppStatus } from '@/lib/constants/enums'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & {
  cases?: { title: string } | null
  assigned_user?: { full_name: string } | null
}
type CaseRow = Database['public']['Tables']['cases']['Row']
type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function getTaskColor(task: TaskRowExt): string {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  if (isOverdue) return '#EF4444'
  const colors: Record<string, string> = {
    high: '#C9A84C',
    medium: '#3B82F6',
    low: '#8B939A',
  }
  return colors[task.priority] ?? '#8B939A'
}

function getTaskBg(task: TaskRowExt): { bg: string; text: string } {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  if (isOverdue) return { bg: '#FEF2F2', text: '#EF4444' }
  const styles: Record<string, { bg: string; text: string }> = {
    high: { bg: '#FBF6E8', text: '#92741F' },
    medium: { bg: '#EFF6FF', text: '#3B82F6' },
    low: { bg: '#F8F9FA', text: '#6B7280' },
  }
  return styles[task.priority] ?? styles.low
}

interface TaskCalendarViewProps {
  tasks: TaskRowExt[]
  cases: CaseRow[]
  teamMembers: TeamMember[]
}

export function TaskCalendarView({ tasks, cases, teamMembers }: TaskCalendarViewProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<TaskRowExt | null>(null)

  // Only tasks with due_date
  const tasksWithDates = useMemo(() => tasks.filter(t => t.due_date), [tasks])
  const tasksWithoutDates = useMemo(() => tasks.filter(t => !t.due_date), [tasks])

  // Build task map by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskRowExt[]> = {}
    for (const t of tasksWithDates) {
      const key = t.due_date!
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return map
  }, [tasksWithDates])

  // Get tasks for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedTasks = tasksByDate[selectedDateStr] || []

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
      {/* Warning for tasks without due dates */}
      {tasksWithoutDates.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {tasksWithoutDates.length} مهمة بدون تاريخ استحقاق — لن تظهر في التقويم
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 w-full min-h-[630px]">
        {/* Calendar Panel */}
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
                  const dayTasks = tasksByDate[dateStr] || []
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

                      {dayTasks.length > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-auto">
                          {dayTasks.slice(0, 4).map((task, ti) => (
                            <div
                              key={ti}
                              className={`w-2 h-2 rounded-full ${isSelected ? 'border border-[#1A2744]' : ''}`}
                              style={{ backgroundColor: getTaskColor(task) }}
                            />
                          ))}
                          {dayTasks.length > 4 && (
                            <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#8B939A]'}`}>
                              +{dayTasks.length - 4}
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

        {/* Day Details Panel */}
        <div className="flex flex-col border border-black/8 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex-1 min-w-[380px]">
          <div className="flex items-center justify-between p-6 border-b border-black/8 dark:border-zinc-800">
            <h3 className="text-base font-bold text-[#0F1724] dark:text-zinc-100">
              {format(selectedDate, 'd MMMM yyyy', { locale: ar })}
            </h3>
            <span className="text-[13px] text-[#8B939A]">
              {selectedTasks.length} مهام
            </span>
          </div>

          <div className="flex flex-col gap-4 p-6 overflow-y-auto flex-1">
            {selectedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-[#8B939A]" />
                </div>
                <p className="text-sm text-[#8B939A]">لا توجد مهام مستحقة في هذا اليوم</p>
              </div>
            ) : (
              selectedTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                const borderColor = getTaskColor(task)
                const { bg, text } = getTaskBg(task)
                const priorityLabel = PRIORITY_LABELS[task.priority as AppPriority] ?? task.priority
                const statusLabel = STATUS_LABELS[task.status as AppStatus] ?? task.status

                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 p-4 border border-black/8 dark:border-zinc-800 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                    style={{ borderInlineStartWidth: '4px', borderInlineStartColor: borderColor }}
                    onClick={() => setEditingTask(task)}
                  >
                    {/* Title + overdue warning */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[15px] font-semibold text-[#0F1724] dark:text-zinc-100 line-clamp-2">
                        {task.title}
                      </div>
                      {isOverdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col gap-1">
                      {task.cases && (
                        <div className="flex items-center gap-1.5 text-[13px] text-[#8B939A]">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">{task.cases.title}</span>
                        </div>
                      )}
                      {task.assigned_user && (
                        <div className="flex items-center gap-1.5 text-[13px] text-[#8B939A]">
                          <User className="h-3.5 w-3.5" />
                          <span>{task.assigned_user.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Priority badge + status pill */}
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: bg, color: text }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: borderColor }}
                        />
                        {priorityLabel}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5 font-medium border-slate-200 text-slate-500"
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit dialog from calendar */}
      <TaskDialog
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null) }}
        taskItem={editingTask}
        cases={cases}
        teamMembers={teamMembers}
      />
    </>
  )
}
