'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { AlertTriangle, Briefcase, Trash2, Edit2, Gavel } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Database } from '@/types/database'
import { TaskDialog } from './TaskDialog'
import { PRIORITY_LABELS, STATUS_LABELS, AppPriority, AppStatus } from '@/lib/constants/enums'
import { deleteTaskAction, updateTaskAction } from '@/lib/actions/tasks'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & {
  cases?: { title: string } | null
  sessions?: { session_date: string; court: string | null } | null
  assigned_user?: { full_name: string } | null
}
type CaseRow = Database['public']['Tables']['cases']['Row']
type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

interface TaskTableProps {
  tasks: TaskRowExt[]
  cases: CaseRow[]
  sessions: Database['public']['Tables']['sessions']['Row'][]
  teamMembers: TeamMember[]
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-amber-50 text-amber-700 border-amber-300',
  medium: 'bg-blue-50 text-blue-700 border-blue-300',
  low: 'bg-gray-100 text-gray-600 border-gray-300',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  todo: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  done: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
}

export function TaskTable({ tasks, cases, sessions, teamMembers }: TaskTableProps) {
  const router = useRouter()
  const [editTask, setEditTask] = useState<TaskRowExt | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const handleRowClick = (task: TaskRowExt) => {
    setEditTask(task)
    setDialogOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('تأكيد حذف المهمة نهائياً؟')) return

    setIsDeleting(id)
    const { error } = await deleteTaskAction(id)
    setIsDeleting(null)

    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف المهمة بنجاح')
      router.refresh()
    }
  }

  const handleStatusChange = (task: TaskRowExt, newStatus: string) => {
    // Optimistic update
    setOptimisticStatuses(prev => ({ ...prev, [task.id]: newStatus }))

    startTransition(async () => {
      const { error } = await updateTaskAction(task.id, {
        title: task.title,
        description: task.description ?? null,
        priority: task.priority as 'low' | 'medium' | 'high',
        status: newStatus as AppStatus,
        due_date: task.due_date ?? null,
        assigned_to: task.assigned_to ?? null,
        case_id: task.case_id ?? null,
        session_id: task.session_id ?? null,
      })

      if (error) {
        toast.error(error)
        // Revert optimistic
        setOptimisticStatuses(prev => {
          const next = { ...prev }
          delete next[task.id]
          return next
        })
      } else {
        toast.success('تم تحديث الحالة')
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block flex flex-col rounded-lg shadow-sm border border-black/8 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/8 dark:border-zinc-800 bg-[#F8F9FA] dark:bg-zinc-900">
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider">العنوان</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[140px]">الحالة</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[100px]">الأولوية</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[130px]">تاريخ الاستحقاق</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[130px]">المُسند إليه</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[140px]">القضية المرتبطة</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[140px]">الجلسة</th>
              <th className="text-right font-semibold text-[#8B939A] px-4 py-3 text-xs uppercase tracking-wider w-[90px]">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-[#8B939A] py-16 text-sm">
                  لا توجد مهام بعد
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const displayStatus = optimisticStatuses[task.id] ?? task.status
                const isOverdue =
                  task.due_date &&
                  new Date(task.due_date) < new Date() &&
                  displayStatus !== 'done'

                const priorityLabel = PRIORITY_LABELS[task.priority as AppPriority] ?? task.priority
                const priorityStyle = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.low
                const statusStyle = STATUS_STYLES[displayStatus] ?? STATUS_STYLES.todo

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    {/* Title */}
                    <td className="px-4 py-3" onClick={() => handleRowClick(task)}>
                      <span className="font-medium text-[#0F1724] dark:text-zinc-100 group-hover:text-[#1a2744] transition-colors line-clamp-1">
                        {task.title}
                      </span>
                    </td>

                    {/* Status - inline dropdown */}
                    <td className="px-4 py-3">
                      <Select
                        value={displayStatus}
                        onValueChange={(val) => { if (val) handleStatusChange(task, val) }}
                      >
                        <SelectTrigger
                          className={`h-8 w-[130px] text-xs font-medium border-0 rounded-md ${statusStyle.bg} ${statusStyle.text} focus:ring-0 focus:ring-offset-0`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            <SelectValue>
                              {STATUS_LABELS[displayStatus as AppStatus]}
                            </SelectValue>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as AppStatus[]).map(s => (
                            <SelectItem key={s} value={s} className="text-xs cursor-pointer">
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3" onClick={() => handleRowClick(task)}>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 font-medium ${priorityStyle}`}
                      >
                        {priorityLabel}
                      </Badge>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3" onClick={() => handleRowClick(task)}>
                      {task.due_date ? (
                        <span
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            isOverdue ? 'text-red-600' : 'text-[#8B939A]'
                          }`}
                        >
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                          {format(new Date(task.due_date), 'd MMM yyyy', { locale: ar })}
                        </span>
                      ) : (
                        <span className="text-xs text-[#8B939A]/50">—</span>
                      )}
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3" onClick={() => handleRowClick(task)}>
                      {task.assigned_user ? (
                        <span className="text-xs text-[#0F1724] dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                          {task.assigned_user.full_name}
                        </span>
                      ) : (
                        <span className="text-xs text-[#8B939A]/50">غير معين</span>
                      )}
                    </td>

                    {/* Related Case */}
                    <td className="px-4 py-3" onClick={() => handleRowClick(task)}>
                      {task.cases ? (
                        <span className="flex items-center gap-1.5 text-xs text-[#8B939A]">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{task.cases.title}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#8B939A]/50">—</span>
                      )}
                    </td>

                    {/* Related Session */}
                    <td className="px-4 py-3" onClick={() => handleRowClick(task)}>
                      {task.sessions ? (
                        <div className="flex items-center gap-1.5 text-[13px] text-amber-600 font-medium">
                          <Gavel className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">
                            جلسة: {format(new Date(task.sessions.session_date), 'd MMM', { locale: ar })}
                            {task.sessions.court && ` — ${task.sessions.court}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8B939A]/50">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(task)
                          }}
                          className="p-1.5 text-[#8B939A] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-md transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, task.id)}
                          disabled={isDeleting === task.id}
                          className="p-1.5 text-[#8B939A] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {tasks.length === 0 ? (
          <div className="text-center p-8 text-[#8B939A] bg-white rounded-xl border border-black/[0.08]">
            لا توجد مهام بعد
          </div>
        ) : (
          tasks.map((task) => {
            const displayStatus = optimisticStatuses[task.id] ?? task.status
            const isOverdue =
              task.due_date &&
              new Date(task.due_date) < new Date() &&
              displayStatus !== 'done'

            const priorityLabel = PRIORITY_LABELS[task.priority as AppPriority] ?? task.priority
            const priorityStyle = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.low
            const statusStyle = STATUS_STYLES[displayStatus] ?? STATUS_STYLES.todo

            return (
              <div 
                key={task.id} 
                className="bg-white border border-black/[0.08] rounded-xl p-4 flex flex-col gap-3 relative shadow-sm"
                onClick={() => handleRowClick(task)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[#0F1724] text-base">{task.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${priorityStyle}`}>
                        {priorityLabel}
                      </Badge>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-red-600' : 'text-[#8B939A]'}`}>
                          {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                          {format(new Date(task.due_date), 'd MMM yyyy', { locale: ar })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={displayStatus}
                      onValueChange={(val) => { if (val) handleStatusChange(task, val) }}
                    >
                      <SelectTrigger
                        className={`h-8 w-[110px] text-xs font-medium border-0 rounded-md ${statusStyle.bg} ${statusStyle.text} focus:ring-0 focus:ring-offset-0`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <SelectValue>
                            {STATUS_LABELS[displayStatus as AppStatus]}
                          </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as AppStatus[]).map(s => (
                          <SelectItem key={s} value={s} className="text-xs cursor-pointer">
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-1 py-3 border-y border-black/[0.04] text-[13px] text-[#5A6480]">
                  {task.assigned_user && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#0F1724]">المسند إليه:</span>
                      <span>{task.assigned_user.full_name}</span>
                    </div>
                  )}
                  {task.cases && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-[#9AA3B2]" />
                      <span className="truncate">{task.cases.title}</span>
                    </div>
                  )}
                  {task.sessions && (
                    <div className="flex items-center gap-2 text-amber-600 font-medium">
                      <Gavel className="h-3.5 w-3.5" />
                      <span className="truncate">
                        جلسة: {format(new Date(task.sessions.session_date), 'd MMM', { locale: ar })}
                        {task.sessions.court && ` — ${task.sessions.court}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRowClick(task)
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#8B939A] hover:text-[#C9A84C]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    تعديل
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, task.id)}
                    disabled={isDeleting === task.id}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        taskItem={editTask}
        cases={cases}
        sessions={sessions}
        teamMembers={teamMembers}
      />
    </>
  )
}
