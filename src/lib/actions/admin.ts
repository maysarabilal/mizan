'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { uuidSchema, updateSubscriptionAdminSchema } from '@/lib/validations/admin'
import { sendEmailSafe } from '@/lib/resend'
import { OverageWarningEmail } from '@/emails/OverageWarningEmail'
import { SubscriptionStatusEmail } from '@/emails/SubscriptionStatusEmail'
import { SubscriptionActivatedEmail } from '@/emails/SubscriptionActivatedEmail'
import { render } from '@react-email/components'
import { CONFIG } from '@/lib/constants/config'

/**
 * Verify the current user is a platform admin.
 * Uses the regular auth client to read the session,
 * then checks profiles.is_admin.
 * Throws if not admin — every action must call this first.
 */
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Forbidden: Admins only')
  return user
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function detectAndHandleOverage(db: any, officeId: string, newPlanId: string) {
  // Get new plan's limit
  const { data: newPlan } = await db.from('subscription_plans').select('max_users').eq('id', newPlanId).single()
  const newMaxUsers = newPlan?.max_users || 1

  // Get current active member count
  const { count: currentMemberCount } = await db
    .from('office_members')
    .select('*', { count: 'exact', head: true })
    .eq('office_id', officeId)
    .eq('is_active', true)

  const activeCount = currentMemberCount || 0

  if (activeCount > newMaxUsers) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Insert overage constraint limit violation record
    // Insert overage constraint limit violation record
    await db.from('office_member_overage').insert({
      office_id: officeId,
      current_count: activeCount,
      max_users: newMaxUsers,
      grace_deadline: expiresAt.toISOString(),
      resolved: false
    })

    const { data: officeData } = await db.from('offices').select('name').eq('id', officeId).single()
    const officeName = officeData?.name || 'مجهول'

    // Notify office owner
    const { data: owner } = await db
      .from('office_members')
      .select('user_id')
      .eq('office_id', officeId)
      .eq('role', 'owner')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (owner) {
      await db.from('notifications').insert({
        office_id: officeId,
        user_id: owner.user_id,
        type: 'system',
        title: 'تجاوز حدود خطة الاشتراك',
        body: `تم تغيير خطتك إلى خطة تسمح بـ ${newMaxUsers} أعضاء فقط. لديك 7 أيام لتقليل عدد الأعضاء إلى ${newMaxUsers}. في حال عدم الحل سيتم إيقاف المكتب تلقائياً.`
      })

      // NEW: Send Email Notification to Owner
      try {
        const { data: { user: ownerUser } } = await db.auth.admin.getUserById(owner.user_id)
        
        if (ownerUser?.email) {
          const { data: profileData } = await db.from('profiles').select('full_name').eq('id', owner.user_id).single()
          
          const htmlBody = await render(OverageWarningEmail({
            officeName,
            ownerName: profileData?.full_name || 'المدير',
            maxUsers: newMaxUsers,
            currentUsers: activeCount,
            deadlineText: 'خلال 7 أيام'
          }))

          sendEmailSafe({
            from: 'ميزان لدعم المحامين <onboarding@resend.dev>',
            to: [ownerUser.email],
            subject: 'عاجل: تنبيه تجاوز الحد الأقصى لأعضاء مكتبك - ميزان',
            html: htmlBody,
          })
        }
      } catch (err) {
        console.error('Failed to send overage email:', err)
      }
    }

    // Notify system admins
    const { data: admins } = await db.from('profiles').select('id').eq('is_admin', true)
    if (admins && admins.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminNotifs = admins.map((a: any) => ({
        office_id: officeId,
        user_id: a.id,
        type: 'system',
        title: 'مكتب يتجاوز حدود خطته الجديدة',
        body: `مكتب ${officeName} يتجاوز حد خطته الجديدة (${activeCount}/${newMaxUsers}) — مهلة 7 أيام للاستجابة. [عرض المكتب](/admin/offices)`
      }))
      await db.from('notifications').insert(adminNotifs)
    }
  } else {
    // If the active count is within the new limits (e.g. an upgrade happened), 
    // we MUST automatically resolve any existing overage violations!
    const { data: existingOverage } = await db
      .from('office_member_overage')
      .select('id')
      .eq('office_id', officeId)
      .eq('resolved', false)
      .maybeSingle()
      
    if (existingOverage) {
      await db
        .from('office_member_overage')
        .update({ resolved: true, updated_at: new Date().toISOString() })
        .eq('id', existingOverage.id)
        
      // Optionally notify owner that the overage is resolved due to upgrade
      const { data: owner } = await db
        .from('office_members')
        .select('user_id')
        .eq('office_id', officeId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .limit(1)
        .single()
        
      if (owner) {
        await db.from('notifications').insert({
          office_id: officeId,
          user_id: owner.user_id,
          type: 'system',
          title: 'تم تمديد سعة الأعضاء وتنظيم الحساب',
          body: `بناءً على تحديث اشتراكك إلى باقة تستوعب ${newMaxUsers} أعضاء، تم رفع تقييد الأعضاء عن مكتبك بنجاح.`
        })
      }
    }
  }
}

// ────────────────────────────────────────────
//   READ OPERATIONS (all use adminSupabase)
// ────────────────────────────────────────────

export async function getAdminOverview() {
  try {
    await requireAdmin()
    const db = createAdminClient()

    const [
      { count: officesCount },
      { count: pendingReqs },
      { count: awaitingPaymentCount },
      { count: totalCases },
      { count: totalClients },
      { count: totalSessions },
      { count: totalMembers },
      { data: confirmedPayments }
    ] = await Promise.all([
      db.from('offices').select('*', { count: 'exact', head: true }),
      db.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_payment'),
      db.from('cases').select('*', { count: 'exact', head: true }),
      db.from('clients').select('*', { count: 'exact', head: true }),
      db.from('sessions').select('*', { count: 'exact', head: true }),
      db.from('office_members').select('*', { count: 'exact', head: true }),
      db.from('payments').select('amount').eq('status', 'confirmed')
    ])

    const totalRevenue = confirmedPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

    // Fetch overaged offices count
    const { data: overageList } = await db
      .from('office_member_overage')
      .select('id')
      .eq('resolved', false)

    const overagedOffices = overageList?.length || 0

    return {
      data: {
        totalOffices: officesCount || 0,
        pendingRequests: pendingReqs || 0,
        awaitingPayment: awaitingPaymentCount || 0,
        overagedOffices,
        platformStats: {
          cases: totalCases || 0,
          clients: totalClients || 0,
          sessions: totalSessions || 0,
          members: totalMembers || 0,
          revenue: totalRevenue
        }
      },
      error: null
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getGlobalUsers() {
  try {
    await requireAdmin()
    const db = createAdminClient()

    const { data: members, error: membersError } = await db
      .from('office_members')
      .select(`
        id,
        user_id,
        office_id,
        role,
        is_active,
        created_at,
        profiles (id, full_name, phone),
        offices (name)
      `)
      .order('created_at', { ascending: false })

    if (membersError || !members) {
      return { data: [], error: null }
    }

    // Fetch all users from Auth to map emails
    const { data: authData, error: authError } = await db.auth.admin.listUsers()
    if (authError) console.error('Error fetching auth users:', authError)

    const emailMap = new Map<string, string>()
    if (authData?.users) {
      for (const u of authData.users) {
        if (u.email) emailMap.set(u.id, u.email)
      }
    }

    const augmentedData = members.map((member) => {
      const email = emailMap.get(member.user_id) || 'غير محدد'
      return {
        ...member,
        email
      }
    })

    return { data: augmentedData, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getOfficesList() {
  try {
    await requireAdmin()
    const db = createAdminClient()

    // 1. Fetch offices with subscriptions and members
    const { data: offices } = await db
      .from('offices')
      .select(`
        *,
        office_subscriptions (
          *,
          subscription_plans (*)
        ),
        office_members (
          id,
          role,
          is_active,
          user_id,
          profiles (full_name, phone)
        )
      `)
      .order('created_at', { ascending: false })

    if (!offices) {
      return { data: [], error: null }
    }

    // 2. Fetch all users from Auth to map emails (single round-trip)
    const { data: authData, error: authError } = await db.auth.admin.listUsers()
    if (authError) console.error('Error fetching auth users:', authError)

    const emailMap = new Map<string, string>()
    if (authData?.users) {
      for (const u of authData.users) {
        if (u.email) emailMap.set(u.id, u.email)
      }
    }

    // 3. Fetch all overage records (unresolved)
    const { data: overageRecords } = await db
      .from('office_member_overage')
      .select('office_id, current_count, max_users, grace_deadline')
      .eq('resolved', false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overageMap = new Map<string, any>()
    if (overageRecords) {
      for (const rec of overageRecords) {
        overageMap.set(rec.office_id, rec)
      }
    }

    // 4. Augment data with memberCount, owner, members list, and overage
    const augmentedData = offices.map((office) => {
      const members = Array.isArray(office.office_members) ? office.office_members : []
      const memberCount = members.filter((m: { is_active: boolean }) => m.is_active === true).length
      const ownerRecord = members.find((m: { role: string, user_id: string, profiles: unknown }) => m.role === 'owner')

      let owner = null
      if (ownerRecord) {
        const ownerEmail = emailMap.get(ownerRecord.user_id) || 'غير محدد'
        const ownerProfile = ownerRecord.profiles || {}
        owner = {
          full_name: (ownerProfile as { full_name?: string }).full_name || 'غير محدد',
          phone: (ownerProfile as { phone?: string }).phone || 'غير محدد',
          email: ownerEmail
        }
      }

      // Augment member list with emails
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membersList = members.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        is_active: m.is_active,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        full_name: (m.profiles as any)?.full_name || 'غير محدد',
        email: emailMap.get(m.user_id) || 'غير محدد'
      }))

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { office_members, ...rest } = office
      const overage = overageMap.get(office.id) || null

      // Dynamically calculate status matching the client-facing Engine
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = rest.office_subscriptions as any
      if (sub && sub.status !== 'suspended' && sub.status !== 'cancelled') {
        const now = new Date()
        const end = new Date(sub.current_period_end)
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        let dynamicStatus = sub.status
        if (sub.status === 'past_due' && diffDays <= -3) dynamicStatus = 'expired'
        if ((sub.status === 'active' || sub.status === 'trialing') && diffDays < 0) {
          dynamicStatus = diffDays <= -3 ? 'expired' : 'past_due'
        }
        sub.status = dynamicStatus
      }

      return {
        ...rest,
        memberCount,
        owner,
        members: membersList,
        overage
      }
    })

    return { data: augmentedData, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getAllSubscriptionRequests() {
  try {
    await requireAdmin()
    const db = createAdminClient()

    const { data } = await db
      .from('subscription_requests')
      .select(`
        *,
        offices(name),
        subscription_plans(name, price_ils, billing_cycle),
        profiles(full_name)
      `)
      .order('created_at', { ascending: false })

    return { data, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getConfirmedRevenueTotal() {
  try {
    await requireAdmin()
    const db = createAdminClient()

    const { data } = await db
      .from('payments')
      .select('amount')
      .eq('status', 'confirmed')

    const total = data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
    return { data: total, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: 0, error: error.message }
  }
}

// ────────────────────────────────────────────
//   WRITE OPERATIONS (mutations)
// ────────────────────────────────────────────

/**
 * Approve upgrade request → transition to 'awaiting_payment'.
 * Does NOT activate subscription — that happens only when payment is confirmed.
 */
export async function approveUpgradeRequestAction(requestId: string): Promise<ActionResult> {
  const reqCheck = uuidSchema.safeParse(requestId)
  if (!reqCheck.success) return { data: null, error: 'المعرف غير صالح' }

  try {
    await requireAdmin()
    const db = createAdminClient()

    const { data: request, error: reqErr } = await db
      .from('subscription_requests')
      .select('id, status')
      .eq('id', requestId)
      .single()

    if (reqErr || !request) throw new Error('لم يتم العثور على الطلب')
    if (request.status !== 'pending') return { data: null, error: 'هذا الطلب ليس في حالة معلقة' }

    await db
      .from('subscription_requests')
      .update({ status: 'awaiting_payment', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    // Notify Owner
    try {
      const { data: requestWithPlan } = await db
        .from('subscription_requests')
        .select('office_id, requested_plan_id, subscription_plans(name)')
        .eq('id', requestId)
        .single()

      if (requestWithPlan) {
        const { data: officeData } = await db.from('offices').select('name').eq('id', requestWithPlan.office_id).single()
        const { data: owner } = await db
          .from('office_members')
          .select('user_id')
          .eq('office_id', requestWithPlan.office_id)
          .eq('role', 'owner')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (owner) {
          const { data: { user: ownerUser } } = await db.auth.admin.getUserById(owner.user_id)
          if (ownerUser?.email) {
            const htmlBody = await render(SubscriptionStatusEmail({
              officeName: officeData?.name || 'مكتبك',
              planName: (requestWithPlan.subscription_plans as any)?.name || 'الباقة المطلوبة',
              status: 'approved'
            }))

            sendEmailSafe({
              from: CONFIG.RESEND_FROM,
              to: [ownerUser.email],
              subject: `تمت الموافقة على طلب ترقية مكتب ${officeData?.name || ''}`,
              html: htmlBody,
            })
          }
        }
      }
    } catch (err) {
      console.error('Failed to send approval email:', err)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/subscription')
    return { data: null, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error approving request:', error)
    return { data: null, error: error.message }
  }
}

/**
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 * Reject upgrade request at any stage (pending or awaiting_payment).
 * Record stays in history with status 'rejected'.
 */
export async function rejectUpgradeRequestAction(requestId: string): Promise<ActionResult> {
  const reqCheck = uuidSchema.safeParse(requestId)
  if (!reqCheck.success) return { data: null, error: 'المعرف غير صالح' }

  try {
    await requireAdmin()
    const db = createAdminClient()

    const { data: requestBeforeReject } = await db
      .from('subscription_requests')
      .select('office_id, requested_plan_id, subscription_plans(name), admin_note')
      .eq('id', requestId)
      .single()

    await db
      .from('subscription_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    // Notify Owner
    try {
      if (requestBeforeReject) {
        const { data: officeData } = await db.from('offices').select('name').eq('id', requestBeforeReject.office_id).single()
        const { data: owner } = await db
          .from('office_members')
          .select('user_id')
          .eq('office_id', requestBeforeReject.office_id)
          .eq('role', 'owner')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (owner) {
          const { data: { user: ownerUser } } = await db.auth.admin.getUserById(owner.user_id)
          if (ownerUser?.email) {
            const htmlBody = await render(SubscriptionStatusEmail({
              officeName: officeData?.name || 'مكتبك',
              planName: (requestBeforeReject.subscription_plans as any)?.name || 'الباقة المطلوبة',
              status: 'rejected',
              adminNote: requestBeforeReject.admin_note || undefined
            }))

            sendEmailSafe({
              from: CONFIG.RESEND_FROM,
              to: [ownerUser.email],
              subject: `تحديث بخصوص طلب ترقية مكتب ${officeData?.name || ''}`,
              html: htmlBody,
            })
          }
        }
      }
    } catch (err) {
      console.error('Failed to send rejection email:', err)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/subscription')
    return { data: null, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error rejecting request:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Confirm payment for an awaiting_payment request.
 * This is the final step: creates a confirmed payment record, activates subscription.
 * Amount is derived from subscription_plans.price_ils — not manually entered.
 */
export async function confirmRequestPaymentAction(requestId: string): Promise<ActionResult> {
  const reqCheck = uuidSchema.safeParse(requestId)
  if (!reqCheck.success) return { data: null, error: 'المعرف غير صالح' }

  try {
    await requireAdmin()
    const db = createAdminClient()

    // 1. Get request + plan details (price, billing cycle, max_users)
    const { data: request, error: reqErr } = await db
      .from('subscription_requests')
      .select('*, subscription_plans(price_ils, billing_cycle, max_users)')
      .eq('id', requestId)
      .single()

    if (reqErr || !request) throw new Error('لم يتم العثور على الطلب')
    if (request.status !== 'awaiting_payment') return { data: null, error: 'هذا الطلب ليس في حالة بانتظار الدفع' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = request.subscription_plans as any
    const amount = plan?.price_ils || 0
    const billingCycle = plan?.billing_cycle || 'monthly'

    // 2. Calculate subscription expiry
    const { addYears, addMonths } = await import('date-fns')
    const expiresAt = billingCycle === 'yearly'
      ? addYears(new Date(), 1)
      : addMonths(new Date(), 1)

    // 3. Create confirmed payment record (amount from plan, not manual)
    const { error: payErr } = await db.from('payments').insert({
      office_id: request.office_id,
      amount,
      status: 'confirmed',
      payment_method: 'bank_transfer',
      confirmed_at: new Date().toISOString(),
    })

    if (payErr) {
      console.error('Error creating payment:', payErr)
      throw new Error('فشل في إنشاء سجل الدفع')
    }

    // 4. Activate office subscription
    await db
      .from('office_subscriptions')
      .update({
        plan_id: request.requested_plan_id,
        status: 'active',
        current_period_end: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('office_id', request.office_id)

    // 5. Check and handle potential overage
    await detectAndHandleOverage(db, request.office_id, request.requested_plan_id)

    // 6. Mark request as completed
    await db
      .from('subscription_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    // 7. Auto-reject other pending/awaiting_payment requests for same office
    await db
      .from('subscription_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('office_id', request.office_id)
      .in('status', ['pending', 'awaiting_payment'])
      .neq('id', requestId)

    // 8. Notify Owner of Activation
    try {
      const { data: officeData } = await db.from('offices').select('name').eq('id', request.office_id).single()
      const { data: owner } = await db
        .from('office_members')
        .select('user_id')
        .eq('office_id', request.office_id)
        .eq('role', 'owner')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (owner) {
        const { data: { user: ownerUser } } = await db.auth.admin.getUserById(owner.user_id)
        if (ownerUser?.email) {
          const { format } = await import('date-fns')
          const htmlBody = await render(SubscriptionActivatedEmail({
            officeName: officeData?.name || 'مكتبك',
            planName: (plan as any)?.name || 'الباقة الجديدة',
            expiryDate: format(expiresAt, 'yyyy-MM-dd')
          }))

          sendEmailSafe({
            from: CONFIG.RESEND_FROM,
            to: [ownerUser.email],
            subject: `تم تفعيل اشتراك مكتب ${officeData?.name || ''} بنجاح`,
            html: htmlBody,
          })
        }
      }
    } catch (err) {
      console.error('Failed to send activation email:', err)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/admin/offices')
    revalidatePath('/dashboard/subscription')
    return { data: null, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return { data: null, error: error.message }
  }
}

export async function toggleOfficeActiveAction(officeId: string, isActive: boolean): Promise<ActionResult> {
  const officeCheck = uuidSchema.safeParse(officeId)
  if (!officeCheck.success) return { data: null, error: 'المعرف غير صالح' }

  try {
    await requireAdmin()
    const db = createAdminClient()

    const { error } = await db
      .from('offices')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', officeId)

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/admin/offices')
    return { data: null, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateSubscriptionDirectlyAction(
  officeId: string,
  payload: { status?: string; current_period_end?: string; plan_id?: string }
): Promise<ActionResult> {
  const officeCheck = uuidSchema.safeParse(officeId)
  if (!officeCheck.success) return { data: null, error: 'المعرف غير صالح' }

  const payloadCheck = updateSubscriptionAdminSchema.safeParse(payload)
  if (!payloadCheck.success) return { data: null, error: 'بيانات التحديث غير صالحة' }

  try {
    await requireAdmin()
    const db = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { updated_at: new Date().toISOString() }
    if (payload.status) updateData.status = payload.status
    if (payload.current_period_end) updateData.current_period_end = payload.current_period_end
    
    if (payload.plan_id) {
      const { data: requestedPlan } = await db.from('subscription_plans').select('slug').eq('id', payload.plan_id).single()
      if (requestedPlan?.slug === 'enterprise') {
        return { data: null, error: 'ENTERPRISE_NOT_ASSIGNABLE' }
      }
      updateData.plan_id = payload.plan_id
    }

    const { error } = await db
      .from('office_subscriptions')
      .update(updateData)
      .eq('office_id', officeId)

    if (error) throw error

    // Execute capability validations securely
    if (payload.plan_id) {
      await detectAndHandleOverage(db, officeId, payload.plan_id)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/offices')
    revalidatePath('/dashboard', 'layout')
    return { data: null, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}


export async function adminToggleMemberStatusAction(
  memberId: string,
  isActive: boolean
): Promise<ActionResult> {
  const check = uuidSchema.safeParse(memberId)
  if (!check.success) return { data: null, error: 'المعرف غير صالح' }

  try {
    const adminUser = await requireAdmin()
    const db = createAdminClient()

    const { data: member } = await db
      .from('office_members')
      .select('id, user_id, role, office_id')
      .eq('id', memberId)
      .single()

    if (!member) return { data: null, error: 'العضو غير موجود' }

    // Protect last owner from deactivation
    if (!isActive && member.role === 'owner') {
      const { count } = await db
        .from('office_members')
        .select('*', { count: 'exact', head: true })
        .eq('office_id', member.office_id)
        .eq('role', 'owner')
        .eq('is_active', true)

      if ((count ?? 0) <= 1) {
        return { data: null, error: 'يجب أن يبقى مالك واحد على الأقل في المكتب.' }
      }
    }

    // On reactivation, check member limit strictly (no bypass)
    if (isActive) {
      const { data: subData } = await db
        .from('office_subscriptions')
        .select('subscription_plans (max_users)')
        .eq('office_id', member.office_id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maxUsers = (subData?.subscription_plans as any)?.max_users || 1

      const { count: currentCount } = await db
        .from('office_members')
        .select('*', { count: 'exact', head: true })
        .eq('office_id', member.office_id)
        .eq('is_active', true)

      if ((currentCount ?? 0) >= maxUsers) {
        return { data: null, error: 'MEMBER_LIMIT_REACHED' }
      }
    }

    const { error } = await db
      .from('office_members')
      .update({ 
        is_active: isActive, 
        disabled_by_admin: !isActive,
        updated_at: new Date().toISOString() 
      })
      .eq('id', memberId)

    if (error) throw error

    // Audit log
    await db.from('audit_logs').insert({
      office_id: member.office_id,
      user_id: adminUser.id,
      action: isActive ? 'admin_member_reactivated' : 'admin_member_deactivated',
      entity_type: 'office_members',
      entity_id: member.user_id,
      details: {
        member_id: member.user_id,
        admin_id: adminUser.id,
        office_id: member.office_id
      }
    })


    // If deactivation, auto-resolve overage
    if (!isActive) {
      const overageDb = db
      const { data: overageData } = await overageDb
        .from('office_member_overage')
        .select('id, max_users')
        .eq('office_id', member.office_id)
        .eq('resolved', false)
        .maybeSingle()

      if (overageData) {
        const { count: cCount } = await overageDb
          .from('office_members')
          .select('*', { count: 'exact', head: true })
          .eq('office_id', member.office_id)
          .eq('is_active', true)

        if (cCount !== null && cCount <= overageData.max_users) {
          await overageDb
            .from('office_member_overage')
            .update({ resolved: true, updated_at: new Date().toISOString() })
            .eq('id', overageData.id)
        }
      }
    }

    revalidatePath('/admin/offices')
    revalidatePath('/admin/users')
    return { data: null, error: null }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return { data: null, error: msg }
  }
}

export async function adminResolveOverageAction(officeId: string): Promise<ActionResult> {
  const check = uuidSchema.safeParse(officeId)
  if (!check.success) return { data: null, error: 'المعرف غير صالح' }

  try {
    const adminUser = await requireAdmin()
    const db = createAdminClient()

    const { error } = await db
      .from('office_member_overage')
      .update({ resolved: true, updated_at: new Date().toISOString() })
      .eq('office_id', officeId)
      .eq('resolved', false)

    if (error) throw error

    await db.from('audit_logs').insert({
      office_id: officeId,
      user_id: adminUser.id,
      action: 'admin_manual_overage_resolve',
      entity_type: 'office_member_overage',
      entity_id: officeId,
      details: { resolved_by: adminUser.id }
    })

    revalidatePath('/admin/offices')
    return { data: null, error: null }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return { data: null, error: msg }
  }
}

export async function forceBackfillOverageAction(): Promise<ActionResult<number>> {
  try {
    await requireAdmin()
    const db = createAdminClient()

    // Get offices that already have an unresolved overage record
    const { data: unresolved } = await db.from('office_member_overage').select('office_id').eq('resolved', false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingIds = new Set((unresolved || []).map((r: any) => r.office_id))

    // 2. Get active members
    const { data: members } = await db.from('office_members').select('office_id').eq('is_active', true)
    const memberCounts = new Map<string, number>()
    if (members) {
      for (const m of members) {
        memberCounts.set(m.office_id, (memberCounts.get(m.office_id) || 0) + 1)
      }
    }

    // 3. Get office subscriptions and max_users
    const { data: subscriptions } = await db
      .from('office_subscriptions')
      .select('office_id, status, subscription_plans(max_users)')
      
    let backfillCount = 0

    if (subscriptions) {
      for (const sub of subscriptions) {
        if (existingIds.has(sub.office_id)) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maxUsers = (sub.subscription_plans as any)?.max_users || 1
        const activeCount = memberCounts.get(sub.office_id) || 0

        if (activeCount > maxUsers) {
          const expiresAt = new Date()
          // Insert overage constraint limit violation record
          await db.from('office_member_overage').insert({
            office_id: sub.office_id,
            current_count: activeCount,
            max_users: maxUsers,
            grace_deadline: expiresAt.toISOString(),
            resolved: false
          })
          backfillCount++
        }
      }
    }

    revalidatePath('/admin/offices')
    return { data: backfillCount, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Failed to backfill overages:', error)
    return { data: null, error: error.message }
  }
}
