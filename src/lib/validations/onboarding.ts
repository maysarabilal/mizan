import { z } from 'zod'

export const createOfficeSchema = z.object({
  office_name: z.string().min(2, 'اسم المكتب يجب أن يكون حرفين على الأقل').min(1, 'هذا الحقل مطلوب'),
  plan_slug: z.string().min(1, 'هذا الحقل مطلوب'),
})

export const joinOfficeSchema = z.object({
  invite_code: z.string().min(6, 'رمز الدعوة قصير جداً').min(1, 'هذا الحقل مطلوب'),
})
