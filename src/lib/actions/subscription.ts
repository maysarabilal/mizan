'use server'

import { createClient } from '@/lib/supabase/server'

export type SubscriptionStatusData = {
  isValid: boolean
  isOfficeActive: boolean
  status: 'active' | 'past_due' | 'expired' | 'trialing' | 'none'
  daysRemaining: number
  planName: string
  maxUsers: number
  lockReason?: 'EXPIRED_PLAN' | 'MEMBER_OVERAGE_EXPIRED' | 'OFFICE_SUSPENDED' | 'MEMBER_DISABLED'
  overageInfo?: {
    graceDeadline: string
    maxUsers: number
    currentCount: number
  } | null
}

export async function checkSubscriptionStatus(): Promise<SubscriptionStatusData> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const officeIdReq = await supabase.rpc('current_office_id').single()
    const officeId = officeIdReq.data

    if (!officeId) {
      return { isValid: false, isOfficeActive: false, status: 'none', daysRemaining: 0, planName: 'بدون باقة', maxUsers: 0 }
    }

    const { data: office } = await supabase
      .from('offices')
      .select('is_active')
      .eq('id', officeId)
      .single()

    // Get current office sub data
    const { data: sub, error } = await supabase
      .from('office_subscriptions')
      .select(`
        status,
        current_period_end,
        subscription_plans (name, max_users)
      `)
      .eq('office_id', officeId)
      .single()

    const isOfficeActive = office?.is_active ?? false

    if (error || !sub) {
      return { isValid: false, isOfficeActive, status: 'none', daysRemaining: 0, planName: 'بدون باقة', maxUsers: 0 }
    }

    const periodEnd = new Date(sub.current_period_end)
    const now = new Date()
    const diffTime = periodEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const planName = (sub.subscription_plans as unknown as { name?: string })?.name || 'مجهول'
    const maxUsers = (sub.subscription_plans as unknown as { max_users?: number })?.max_users || 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: overageDataRaw } = await (supabase as any)
      .from('office_member_overage')
      .select('current_count, max_users, grace_deadline')
      .eq('office_id', officeId)
      .eq('resolved', false)
      .maybeSingle()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overageData = overageDataRaw as any

    let finalStatus: 'active' | 'past_due' | 'expired' | 'trialing' | 'none' = sub.status as 'active' | 'past_due' | 'expired' | 'trialing' | 'none'
    if (sub.status === 'past_due' && diffDays <= -3) finalStatus = 'expired'
    if ((sub.status === 'active' || sub.status === 'trialing') && diffDays < 0) {
      finalStatus = diffDays <= -3 ? 'expired' : 'past_due'
    }

    // Grace Logic (3 days) MUST use finalStatus, not DB status!
    let isValid = finalStatus === 'active' || finalStatus === 'trialing' || (finalStatus === 'past_due' && diffDays > -3)
    let lockReason: 'EXPIRED_PLAN' | 'MEMBER_OVERAGE_EXPIRED' | undefined = undefined
    let overageInfo = null

    if (!isValid) {
      lockReason = 'EXPIRED_PLAN'
    }

    // System Overriding: Member Overage Expiry
    if (isValid && overageData) {
      const graceDeadline = new Date(overageData.grace_deadline)
      if (graceDeadline.getTime() < now.getTime()) {
        isValid = false
        lockReason = 'MEMBER_OVERAGE_EXPIRED'
      }

      overageInfo = {
        graceDeadline: overageData.grace_deadline,
        maxUsers: overageData.max_users,
        currentCount: overageData.current_count
      }
    }

    return {
      isValid,
      isOfficeActive,
      status: finalStatus,
      daysRemaining: diffDays,
      planName,
      maxUsers,
      lockReason,
      overageInfo
    }
  } catch (error) {
    return { isValid: false, isOfficeActive: false, status: 'none', daysRemaining: 0, planName: 'خطأ', maxUsers: 0 }
  }
}

export async function requireActiveSubscription(options?: { allowOverageRemediation?: boolean }): Promise<string | null> {
  const status = await checkSubscriptionStatus()
  if (!status.isOfficeActive) return 'تم تعليق حساب المكتب بواسطة إدارة المنصة. تواصل مع الدعم الفني.'
  
  if (!status.isValid) {
    if (options?.allowOverageRemediation && status.lockReason === 'MEMBER_OVERAGE_EXPIRED') {
      return null
    }
    return 'صلاحية اشتراك الباقة لهذا المكتب منتهية. يرجى التجديد لتتمكن من استخدام هذه الميزة.'
  }
  
  return null
}
