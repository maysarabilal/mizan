import { z } from 'zod'

export const caseSchema = z.object({
  client_id: z.string().min(1, 'العميل مطلوب'),
  title: z.string().min(2, 'موضوع القضية يجب أن يكون حرفين على الأقل').min(1, 'هذا الحقل مطلوب'),
  case_number: z.string().optional().nullable(),
  case_type: z.string().min(1, 'نوع القضية مطلوب'),
  status: z.string().min(1, 'حالة القضية مطلوبة'),
  priority: z.string().min(1, 'الأهمية مطلوبة'),
  litigation_degree: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
