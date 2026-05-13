'use server'

import { createClient } from '@/lib/supabase/server'
import { betaFeedbackSchema } from '@/lib/validations/landing'
import { z } from 'zod'
import type { ActionResult } from '@/types/actions'

export async function submitBetaFeedback(values: z.infer<typeof betaFeedbackSchema>): Promise<ActionResult<null>> {
  const result = betaFeedbackSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'البيانات المدخلة غير صحيحة' }

  const supabase = await createClient()

  // Try to get current user (may be anonymous visitor)
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('beta_feedback')
    .insert([{
      ui_rating: result.data.ui_rating,
      features_rating: result.data.features_rating,
      pricing_rating: result.data.pricing_rating,
      office_size: result.data.office_size,
      current_tool: result.data.current_tool,
      most_needed_feature: result.data.most_needed_feature,
      missing_feature: result.data.missing_feature,
      general_notes: result.data.general_notes,
      contact_info: result.data.contact_info,
      user_id: user?.id || null,
    }])

  if (error) {
    console.error('Error submitting feedback:', error)
    return { data: null, error: 'حدث خطأ أثناء إرسال الملاحظات. يرجى المحاولة لاحقاً.' }
  }

  return { data: null, error: null }
}
