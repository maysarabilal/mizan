'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { sendEmailSafe } from '@/lib/resend'
import { UpgradeRequestAdminEmail } from '@/emails/UpgradeRequestAdminEmail'
import { render } from '@react-email/components'
import { CONFIG } from '@/lib/constants/config'

export async function getCurrentSubscription() {
  const supabase = await createClient()

  const { data: memberData, error: memberError } = await supabase.rpc('current_office_id').single()
  if (memberError || !memberData) return { data: null, error: 'غير مصرح' }

  const { data, error } = await supabase
    .from('office_subscriptions')
    .select(`
      *,
      subscription_plans (*)
    `)
    .eq('office_id', memberData)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "Rows not found" filter, meaning no active sub record
    console.error('Error fetching subscription:', error)
    return { data: null, error: 'فشل جلب بيانات الاشتراك' }
  }

  return { data, error: null }
}

export async function getAvailablePlans() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    // @ts-expect-error - is_active is dynamically added to DB schema
    .eq('is_active', true)
    .order('price_ils', { ascending: true })

  if (error) {
    console.error('Error fetching plans:', error)
    return { data: null, error: 'فشل جلب باقات الاشتراك' }
  }

  return { data, error: null }
}

export async function getPaymentHistory() {
  const supabase = await createClient()

  const { data: memberData } = await supabase.rpc('current_office_id').single()
  if (!memberData) return { data: null, error: 'غير مصرح' }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('office_id', memberData)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return { data: null, error: 'فشل جلب تاريخ الدفعات' }
  }

  return { data, error: null }
}

export async function getPendingUpgradeRequest() {
  const supabase = await createClient()

  const { data: memberData } = await supabase.rpc('current_office_id').single()
  if (!memberData) return { data: null, error: null }

  const { data, error } = await supabase
    .from('subscription_requests')
    .select('*')
    .eq('office_id', memberData)
    .eq('status', 'pending')
    .single()

  if (error || !data) {
    return { data: null, error: null }
  }

  return { data, error: null }
}

export async function requestPlanUpgradeAction(planId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: memberData, error: memberError } = await supabase.rpc('current_office_id').single()
  const { data: { user } } = await supabase.auth.getUser()
  if (memberError || !memberData || !user) return { data: null, error: 'غير مصرح' }

  // Enterprise plan guard
  const supabaseAdmin = createAdminClient()
  const { data: planToRequest } = await supabaseAdmin
    .from('subscription_plans')
    .select('slug, name')
    .eq('id', planId)
    .single()

  if (planToRequest?.slug === 'enterprise') {
    return { data: null, error: 'ENTERPRISE_NOT_REQUESTABLE' }
  }

  // Check existing pending/awaiting_payment requests
  const { data: existingReq } = await supabaseAdmin
    .from('subscription_requests')
    .select('id, status')
    .eq('office_id', memberData)
    .in('status', ['pending', 'awaiting_payment'])
    .maybeSingle()
    
  if (existingReq) {
    const msg = existingReq.status === 'pending' 
      ? 'يوجد طلب ترقية قيد المراجعة بالفعل لعيادتك أو مكتبك.' 
      : 'يوجد طلب معتمد وبانتظار الدفع حالياً. يرجى إتمام الدفع أو التواصل مع الإدارة.'
    return { data: null, error: msg }
  }

  // Must be owner or admin realistically, handled via RLS policies
  const { error } = await supabaseAdmin
    .from('subscription_requests')
    .insert({
      office_id: memberData,
      requested_plan_id: planId,
      status: 'pending',
      requested_by: user.id
    })

  if (error) {
    console.error('Error requesting upgrade:', error)
    return { data: null, error: 'فشل تقديم طلب الترقية، تأكد من أنك تملك صلاحية مدير المكتب.' }
  }

  // Notify Admin via Email
  try {
    const { data: officeData } = await supabaseAdmin
      .from('offices')
      .select('name')
      .eq('id', memberData)
      .single()

    const htmlBody = await render(UpgradeRequestAdminEmail({
      officeName: officeData?.name || 'مكتب مجهول',
      planName: (planToRequest as any)?.name || 'باقة غير محددة',
      requesterName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم'
    }))

    sendEmailSafe({
      from: CONFIG.RESEND_FROM,
      to: [CONFIG.ADMIN_EMAIL],
      subject: `طلب ترقية جديد من مكتب ${officeData?.name || ''}`,
      html: htmlBody,
    })
  } catch (err) {
    console.error('Failed to notify admin of upgrade request:', err)
  }

  // In-app notification for subscription updates (respects office preferences)
  try {
    const { shouldSendNotification } = await import('@/lib/utils/notifications')
    const shouldNotify = await shouldSendNotification(memberData, 'subscription_updates')

    if (shouldNotify) {
      // Notify the owner of the office about the upgrade request
      const { data: owner } = await supabaseAdmin
        .from('office_members')
        .select('user_id')
        .eq('office_id', memberData)
        .eq('role', 'owner')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (owner && owner.user_id !== user.id) {
        await supabaseAdmin.from('notifications').insert({
          office_id: memberData,
          user_id: owner.user_id,
          type: 'payment',
          title: 'طلب ترقية اشتراك',
          body: `تم تقديم طلب ترقية إلى الباقة "${(planToRequest as any)?.name || 'غير محددة'}". بانتظار موافقة الإدارة.`,
        })
      }
    }
  } catch (notifErr) {
    console.error('Error sending subscription notification:', notifErr)
  }

  revalidatePath('/dashboard/subscription')
  return { data: null, error: null }
}
