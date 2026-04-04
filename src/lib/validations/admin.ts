import { z } from 'zod'

export const uuidSchema = z.string().uuid('المعرف غير صالح')

export const updateSubscriptionAdminSchema = z.object({
  status: z.enum(['trialing', 'active', 'past_due', 'expired', 'cancelled', 'pending', 'awaiting_payment']).optional(),
  current_period_end: z.string().datetime().optional(),
  plan_id: z.string().uuid().optional()
})
