'use client'

import { useState, useEffect, useMemo } from 'react'
import { List, Calendar as CalendarIcon, Plus, Search, X } from 'lucide-react'
import { Database } from '@/types/database'
import { TaskTable } from './TaskTable'
import { TaskCalendarView } from './TaskCalendarView'
import { TaskDialog } from './TaskDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, PRIORITY_LABELS, AppStatus, AppPriority } from '@/lib/constants/enums'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & {
  cases?: { title: string } | null
  assigned_user?: { full_name: string } | null
}
type CaseRow = Database['public']['Tables']['cases']['Row']
type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

const STORAGE_KEY = 'mizan_tasks_view'

interface TasksClientProps {
  tasks: TaskRowExt[]
  cases: CaseRow[]
  teamMembers: TeamMember[]
}

export function TasksClient({ tasks, cases, teamMembers }: TasksClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [caseFilter, setCaseFilter] = useState<string>('')

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'list' || stored === 'calendar') {
      setViewMode(stored)
    }
  }, [])

  const handleViewChange = (mode: 'list' | 'calendar') => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  const hasActiveFilters = !!(searchQuery || statusFilter || priorityFilter || caseFilter)

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setPriorityFilter('')
    setCaseFilter('')
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.cases?.title?.toLowerCase().includes(q) ||
        t.assigned_user?.full_name?.toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      result = result.filter(t => t.status === statusFilter)
    }

    if (priorityFilter) {
      result = result.filter(t => t.priority === priorityFilter)
    }

    if (caseFilter) {
      result = result.filter(t => t.case_id === caseFilter)
    }

    return result
  }, [tasks, searchQuery, statusFilter, priorityFilter, caseFilter])

  // Unique cases that have tasks
  const taskCases = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tasks) {
      if (t.case_id && t.cases?.title) {
        map.set(t.case_id, t.cases.title)
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [tasks])

  // Legend items for task calendar
  const legendItems = [
    { color: '#C9A84C', label: 'عالية' },
    { color: '#3B82F6', label: 'متوسطة' },
    { color: '#8B939A', label: 'منخفضة' },
    { color: '#EF4444', label: 'متأخرة' },
  ]

  return (
    <>
      {/* Header — same pattern as sessions page */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-primary">المهام</h1>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
              {filteredTasks.length}
            </Badge>
          </div>

          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>مهمة جديدة</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          تتبع مهام الفريق، تحديد الأولويات، ومتابعة المواعيد النهائية من مكان واحد
        </p>
      </div>

      {/* View Toggle + Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange('list')}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
              ${viewMode === 'list'
                ? 'bg-[#1A2744] text-white border border-[#1A2744]'
                : 'bg-white dark:bg-zinc-950 text-[#8B939A] border border-black/8 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900'
              }
            `}
          >
            <List className="h-4 w-4" />
            العرض كقائمة
          </button>
          <button
            onClick={() => handleViewChange('calendar')}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
              ${viewMode === 'calendar'
                ? 'bg-[#1A2744] text-white border border-[#1A2744]'
                : 'bg-white dark:bg-zinc-950 text-[#8B939A] border border-black/8 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900'
              }
            `}
          >
            <CalendarIcon className="h-4 w-4" />
            التقويم
          </button>
        </div>

        {/* Legend */}
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

      {/* Filters — shown for list view */}
      {viewMode === 'list' && (
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search */}
          <div className="relative w-full lg:w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B939A] pointer-events-none" />
            <Input
              type="search"
              placeholder="بحث بالعنوان، القضية، المكلف..."
              className="pr-9 h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-3 flex-1">
            {/* Status filter */}
            <div className="w-full sm:w-[160px]">
              <Select
                value={statusFilter || undefined}
                onValueChange={(val) => setStatusFilter((!val || val === '__clear__') ? '' : val)}
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilter && <SelectItem value="__clear__">← الكل</SelectItem>}
                  {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority filter */}
            <div className="w-full sm:w-[160px]">
              <Select
                value={priorityFilter || undefined}
                onValueChange={(val) => setPriorityFilter((!val || val === '__clear__') ? '' : val)}
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  {priorityFilter && <SelectItem value="__clear__">← الكل</SelectItem>}
                  {(Object.keys(PRIORITY_LABELS) as AppPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Case filter */}
            <div className="w-full sm:w-[200px]">
              <Select
                value={caseFilter || undefined}
                onValueChange={(val) => setCaseFilter((!val || val === '__clear__') ? '' : val)}
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-950 border-black/8 dark:border-zinc-700 rounded-md text-sm">
                  <SelectValue placeholder="القضية المرتبطة" />
                </SelectTrigger>
                <SelectContent>
                  {caseFilter && <SelectItem value="__clear__">← الكل</SelectItem>}
                  {taskCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full lg:w-auto shrink-0 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors h-10"
              >
                <X className="h-4 w-4" /> مسح الفلاتر
              </Button>
            )}
          </div>
        </div>
      )}

      {/* View Content */}
      {viewMode === 'list' ? (
        <TaskTable tasks={filteredTasks} cases={cases} teamMembers={teamMembers} />
      ) : (
        <TaskCalendarView tasks={filteredTasks} cases={cases} teamMembers={teamMembers} />
      )}

      {/* Add Task Dialog */}
      <TaskDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        cases={cases}
        teamMembers={teamMembers}
      />
    </>
  )
}
