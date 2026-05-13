import { z } from 'zod'

export const TASK_STATUS_VALUES = ['todo', 'in_progress', 'done'] as const
export const TASK_PRIORITY_VALUES = ['low', 'medium', 'high'] as const

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'العنوان يجب أن يكون حرفين على الأقل').min(1, 'هذا الحقل مطلوب'),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUS_VALUES),
  priority: z.enum(TASK_PRIORITY_VALUES),
  due_date: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  case_id: z.string().uuid().optional().nullable(),
  session_id: z.string().uuid().optional().nullable(),
})
