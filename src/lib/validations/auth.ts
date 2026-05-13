import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'هذا الحقل مطلوب'),
})

export const registerSchema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور'),
  full_name: z.string().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('البريد الإلكتروني غير صحيح'),
})
