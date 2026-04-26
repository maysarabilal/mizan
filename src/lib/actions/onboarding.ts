'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOfficeSchema, joinOfficeSchema } from '@/lib/validations/onboarding'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { ONBOARDING_ERRORS } from '@/lib/constants/messages'
import { sendEmailSafe } from '@/lib/resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { render } from '@react-email/components'

export async function createOfficeWithTrial(values: z.infer<typeof createOfficeSchema>): Promise<ActionResult<{ office_id: string }>> {
  const result = createOfficeSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) return { data: null, error: 'غير مصرح لك بالقيام بهذا الإجراء' }

  // 1. Resolve Plan ID using adminClient
  const adminSupabase = createAdminClient()
  const { data: trialPlan } = await adminSupabase
    .from('subscription_plans')
    .select('id')
    .eq('slug', result.data.plan_slug)
    .limit(1)
    .single()

  if (!trialPlan) {
    return { data: null, error: 'باقة الاشتراك غير صالحة' }
  }

  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 7)

  // 2. Call the Atomic RPC (which handles the history check and sequential inserts safely)
  const { data: rpcData, error: rpcError } = await adminSupabase.rpc('create_office_transaction', {
    p_user_id: user.id,
    p_office_name: result.data.office_name,
    p_plan_id: trialPlan.id,
    p_trial_end: trialEndDate.toISOString()
  })

  if (rpcError) {
    if (rpcError.message.includes('ACCOUNT_EXISTS')) {
      return { data: null, error: ONBOARDING_ERRORS.ACCOUNT_EXISTS }
    }
    console.error('RPC Error creating office:', rpcError)
    return { data: null, error: 'حدث خطأ أثناء إنشاء المكتب في قاعدة البيانات' }
  }

  // RPC returns the office_id inside a json object
  const officeId = (rpcData as { office_id?: string })?.office_id
  if (!officeId) {
    return { data: null, error: 'تم إنشاء المكتب لكن لم يتم إرجاع المُعرف' }
  }

  // Fire-and-forget the Welcome Email
  try {
    const htmlBody = await render(WelcomeEmail({
      officeName: result.data.office_name,
      ownerName: user.email?.split('@')[0] || 'المدير', // Or fetch profile if desired
      trialDays: 7
    }))

    sendEmailSafe({
      from: 'ميزان لدعم المحامين <onboarding@resend.dev>', // Free tier sandbox requirement
      to: [user.email!], // Must be authenticated user email
      subject: 'مرحباً بك في منصة ميزان - تم تفعيل حسابك بنجاح',
      html: htmlBody,
    })
  } catch (err) {
    console.error('Failed to prepare welcome email:', err)
  }

  revalidatePath('/dashboard', 'layout')
  return { data: { office_id: officeId }, error: null }
}

export async function joinOfficeWithCode(values: z.infer<typeof joinOfficeSchema>): Promise<ActionResult<{ office_id: string }>> {
  const result = joinOfficeSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'رمز الدعوة غير صالح' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'غير مصرح لك' }

  // CRITICAL: Check ALL historical records before allowing join (bypass RLS)
  const adminSupabase = createAdminClient()
  const { data: existingMember } = await adminSupabase
    .from('office_members')
    .select('id, is_active')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existingMember) {
    return { data: null, error: ONBOARDING_ERRORS.ACCOUNT_EXISTS }
  }

  // Use admin client for the RPC to ensure it can successfully insert the member
  // and bypass any potential RLS issues during the initial joining phase.
  const { data, error } = await adminSupabase
    .rpc('redeem_invitation', {
      p_user_id: user.id,
      p_invite_code: result.data.invite_code.trim().toUpperCase()
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .single() as { data: any; error: any }

  if (error || !data) {
    console.error('RPC Error:', error)
    return { data: null, error: error?.message || 'فشل الاتصال بقاعدة البيانات' }
  }

  // Check if RPC returned a logic error message in the 'res_error' column
  if (data.res_error) {
    return { data: null, error: data.res_error }
  }

  if (!data.res_office_id) {
    return { data: null, error: 'لم يتم العثور على المكتب المطلوب' }
  }

  // Success: data.res_office_id and data.res_role are available
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/setup')
  return { data: { office_id: data.res_office_id }, error: null }
}
