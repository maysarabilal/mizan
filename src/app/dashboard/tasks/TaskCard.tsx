'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { GripVertical, Clock, Briefcase, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PRIORITY_LABELS, AppPriority } from '@/lib/constants/enums'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & { 
  cases?: { title: string } | null,
  assigned_user?: { full_name: string } | null
}

interface TaskCardProps {
  task: TaskRowExt
  onEdit: (task: TaskRowExt) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  // Defensive: handle both English (normalized) and Arabic (DB) priority values
  const priorityLabel = PRIORITY_LABELS[task.priority as AppPriority] ?? task.priority

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-50 border-2 border-primary/50 bg-background rounded-lg p-4 h-32 w-full"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-2 p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all cursor-default ${isOverdue ? 'border-red-200 dark:border-red-900' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab hover:bg-muted p-1 rounded -mr-1 text-muted-foreground self-start mt-0.5"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1 flex flex-col gap-1 cursor-pointer" onClick={() => onEdit(task)}>
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm line-clamp-2">{task.title}</h4>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-transparent ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
              {priorityLabel}
            </Badge>
            {task.assigned_user && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground font-normal">
                {task.assigned_user.full_name.split(' ')[0]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {(task.due_date || task.cases) && (
        <div className="flex flex-col gap-1 mt-2 pt-2 border-t text-[11px] text-muted-foreground cursor-pointer" onClick={() => onEdit(task)}>
          {task.cases && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1 truncate">{task.cases.title}</span>
            </div>
          )}
          {task.due_date && (
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              <Clock className="h-3 w-3 shrink-0" />
              <span>{format(new Date(task.due_date), "d MMM", { locale: ar })}</span>
            </div>
          )}
        </div>
      )}

      {/* Hover Actions */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-red-500" 
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id)
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
