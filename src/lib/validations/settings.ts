import { z } from 'zod'

export const officeSettingsSchema = z.object({
  name: z.string().min(2, 'اسم المكتب مطلوب'),
  session_reminders: z.boolean(),
  task_completed: z.boolean(),
  subscription_updates: z.boolean(),
})
