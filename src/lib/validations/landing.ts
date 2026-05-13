import { z } from 'zod'

export const betaFeedbackSchema = z.object({
  // Step 1: User persona + ratings
  office_size: z.enum(['solo', 'small', 'enterprise']).optional(),
  current_tool: z.enum(['paper', 'excel', 'other_software']).optional(),
  ui_rating: z.number().min(1).max(5).optional(),
  features_rating: z.number().min(1).max(5).optional(),
  pricing_rating: z.number().min(1).max(5).optional(),
  // Step 2: Value + dealbreakers
  most_needed_feature: z.enum(['sessions', 'fees', 'tasks', 'clients']).optional(),
  missing_feature: z.string().max(500).optional(),
  general_notes: z.string().max(1000).optional(),
  contact_info: z.string().max(255).optional(),
})

export type BetaFeedbackValues = z.infer<typeof betaFeedbackSchema>
