import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').min(1, 'هذا الحقل مطلوب'),
  phone: z.string().optional().nullable(),
  email: z.union([z.string().email('البريد الإلكتروني غير صحيح'), z.literal('')]).optional().nullable(),
  notes: z.string().optional().nullable(),
})
