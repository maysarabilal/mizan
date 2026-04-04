import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'هذا الحقل مطلوب'),
})

export const registerSchema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  full_name: z.string().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
})

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('البريد الإلكتروني غير صحيح'),
})
