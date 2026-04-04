'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOfficeSchema, joinOfficeSchema } from '@/lib/validations/onboarding'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { ONBOARDING_ERRORS } from '@/lib/constants/messages'

export async function createOfficeWithTrial(values: z.infer<typeof createOfficeSchema>): Promise<ActionResult<{ office_id: string }>> {
  const result = createOfficeSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) return { data: null, error: 'غير مصرح لك بالقيام بهذا الإجراء' }

  // CRITICAL: Check ALL historical records (bypass RLS with adminClient)
  // This prevents deactivated users from creating new offices
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

  // adminSupabase already created above for the history check
  // Using admin client because ordinary users cannot insert into offices directly without RLS issues

  // 1. Create office
  const { data: newOffice, error: officeError } = await adminSupabase
    .from('offices')
    .insert({
      name: result.data.office_name,
      is_active: true,
    })
    .select()
    .single()

  if (officeError || !newOffice) return { data: null, error: 'حدث خطأ أثناء إنشاء المكتب' }

  // 2. Add as owner
  const { error: memberError } = await adminSupabase
    .from('office_members')
    .insert({
      office_id: newOffice.id,
      user_id: user.id,
      role: 'owner',
      is_active: true,
    })

  if (memberError) return { data: null, error: 'تم إنشاء المكتب لكن فشل إضافة المستخدم إليه' }

  // 3. Create Trial Subscription (7 days from now)
  const { data: trialPlan } = await adminSupabase
    .from('subscription_plans')
    .select('id')
    .eq('slug', result.data.plan_slug)
    .limit(1)
    .single()

  if (trialPlan) {
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    await adminSupabase.from('office_subscriptions').insert({
      office_id: newOffice.id,
      plan_id: trialPlan.id,
      status: 'trialing',
      current_period_end: trialEndDate.toISOString()
    })
  }

  // 4. Log Audit
  await adminSupabase.from('audit_logs').insert({
    office_id: newOffice.id,
    user_id: user.id,
    action: 'office_created',
    entity_type: 'office',
    entity_id: newOffice.id
  })

  revalidatePath('/dashboard', 'layout')
  return { data: { office_id: newOffice.id }, error: null }
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
