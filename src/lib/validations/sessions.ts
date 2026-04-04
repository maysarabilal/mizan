import { z } from 'zod'

export const sessionSchema = z.object({
  case_id: z.string().min(1, 'اختيار القضية مطلوب'),
  session_date: z.string().min(10, 'تاريخ الجلسة مطلوب'),
  session_time: z.string().optional().nullable(),
  court: z.string().optional().nullable(),
  hall: z.string().optional().nullable(),
  session_type: z.string().min(1, 'نوع الجلسة مطلوب'),
  outcome: z.string().min(1, 'حالة الجلسة مطلوبة'),
  notes: z.string().optional().nullable(),
})
