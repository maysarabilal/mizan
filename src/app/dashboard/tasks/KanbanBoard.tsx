'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { updateTaskAction, deleteTaskAction } from '@/lib/actions/tasks'
import { TaskCard } from './TaskCard'
import { TaskDialog } from './TaskDialog'
import { Database } from '@/types/database'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS, type AppStatus } from '@/lib/constants/enums'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & {
  cases?: { title: string } | null
  assigned_user?: { full_name: string } | null
}

type CaseRow = Database['public']['Tables']['cases']['Row']

type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

const COLUMN_COLORS: Record<string, string> = {
  todo: 'bg-zinc-100 dark:bg-zinc-900',
  in_progress: 'bg-blue-50 dark:bg-blue-950/30',
  done: 'bg-green-50 dark:bg-green-950/30',
}

const COLUMNS = (Object.keys(STATUS_LABELS) as AppStatus[]).map((id) => ({
  id,
  title: STATUS_LABELS[id],
  color: COLUMN_COLORS[id],
}))

interface KanbanBoardProps {
  initialTasks: TaskRowExt[]
  cases: CaseRow[]
  teamMembers: TeamMember[]
}

export function KanbanBoard({ initialTasks, cases, teamMembers }: KanbanBoardProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [tasks, setTasks] = useState<TaskRowExt[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<TaskRowExt | null>(null)
  const [editingTask, setEditingTask] = useState<TaskRowExt | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<string>('todo')

  // Wait for client-side hydration to avoid dnd-kit ID mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync tasks when props change
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )



  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const activeData = active.data.current?.task as TaskRowExt
    setActiveTask(activeData)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeTask = tasks.find(t => t.id === activeId)
    const overTask = tasks.find(t => t.id === overId)

    const isOverAColumn = COLUMNS.some(c => c.id === overId)

    if (!activeTask) return

    if (isOverAColumn) {
      if (activeTask.status !== overId) {
        setTasks(prev => prev.map(t =>
          t.id === activeId ? { ...t, status: overId } : t
        ))
      }
    } else if (overTask) {
      if (activeTask.status !== overTask.status) {
        setTasks(prev => prev.map(t =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        ))
      } else {
        setTasks(prev => {
          const activeIndex = prev.findIndex(t => t.id === activeId)
          const overIndex = prev.findIndex(t => t.id === overId)
          return arrayMove(prev, activeIndex, overIndex)
        })
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const currentTaskInState = tasks.find(t => t.id === activeId)

    if (!currentTaskInState) return

    // Check if status actually changed
    const droppedOnColumnId = COLUMNS.find(c => c.id === over.id)?.id
    const newStatus = droppedOnColumnId || (tasks.find(t => t.id === over.id)?.status as string)

    if (currentTaskInState.status !== newStatus) {
      // Update the task status in the database
      const { error } = await updateTaskAction(activeId, {
        title: currentTaskInState.title,
        description: currentTaskInState.description ?? null,
        priority: currentTaskInState.priority as 'low' | 'medium' | 'high',
        status: newStatus as AppStatus,
        due_date: currentTaskInState.due_date ?? null,
        assigned_to: currentTaskInState.assigned_to ?? null,
        case_id: currentTaskInState.case_id ?? null,
      })

      if (error) {
        toast.error(error)
        // Revert UI on failure
        setTasks(prev => prev.map(t =>
          t.id === activeId ? { ...t, status: currentTaskInState.status } : t
        ))
      } else {
        toast.success('تم تحديث حالة المهمة')
        router.refresh()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('تأكيد حذف المهمة؟')) return

    const { error } = await deleteTaskAction(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف المهمة')
      router.refresh()
    }
  }

  const handleAddClick = (colId: string) => {
    setDefaultStatus(colId)
    setIsAddOpen(true)
  }

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex h-[calc(100vh-14rem)] w-full overflow-x-auto gap-4 pb-4 px-1">
        <div className="flex items-center justify-center w-full text-muted-foreground">
          جاري تحميل لوحة المهام...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] w-full overflow-x-auto gap-4 pb-4 px-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.id)
          return (
            <div
              key={column.id}
              className={`flex flex-col gap-3 min-w-[280px] max-w-[320px] shrink-0 rounded-xl p-3 ${column.color}`}
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  {column.title}
                  <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full border">
                    {columnTasks.length}
                  </span>
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleAddClick(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto min-h-[150px]">
                <SortableContext
                  id={column.id}
                  items={columnTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={(t) => setEditingTask(t)}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </div>
            </div>
          )
        })}

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}
        >
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={isAddOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingTask(null)
          }
        }}
        taskItem={editingTask}
        cases={cases}
        teamMembers={teamMembers}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
