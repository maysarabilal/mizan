import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' }).max(100, { message: 'الاسم طويل جداً' }),
  phone: z.string().optional().nullable(),
  job_title: z.string().max(100, { message: 'المسمى الوظيفي طويل جداً' }).optional().nullable(),
})
