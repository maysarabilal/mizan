import { z } from 'zod'

export const officeSettingsSchema = z.object({
  name: z.string().min(2, 'اسم المكتب مطلوب'),
  specialization: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  working_days: z.array(z.string()).optional(),
  working_hours_start: z.string().optional().nullable(),
  working_hours_end: z.string().optional().nullable(),
  session_reminders: z.boolean(),
  task_completed: z.boolean(),
  subscription_updates: z.boolean(),
})
