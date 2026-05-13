'use server'

import { createClient } from '@/lib/supabase/server'
import { sessionSchema } from '@/lib/validations/sessions'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import { sendPushToUser } from '@/lib/utils/sendPushToUser'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getSessions() {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      cases (
        title,
        clients(name)
      )
    `)
    .order('session_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching sessions:', error)
    return { data: null, error: 'فشل في جلب الجلسات' }
  }

  return { data, error: null }
}

export async function createSessionAction(values: z.infer<typeof sessionSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = sessionSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data: member, error: memberError } = await supabase
    .from('office_members')
    .select('office_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  
  if (memberError || !member) return { data: null, error: 'لا توجد عضوية نشطة' }

  // Verify case belongs to same office
  const { data: caseRecord } = await supabase
    .from('cases')
    .select('id')
    .eq('id', result.data.case_id)
    .eq('office_id', member.office_id)
    .single()
  
  if (!caseRecord) return { data: null, error: 'القضية المحددة غير موجودة' }

    const { data: newSession, error } = await supabase.from('sessions').insert({
      office_id: member.office_id,
      case_id: result.data.case_id,
      session_date: result.data.session_date,
      session_time: result.data.session_time || undefined,
      court: result.data.court || undefined,
      hall: result.data.hall || undefined,
      session_type: result.data.session_type || undefined,
      outcome: result.data.outcome || undefined,
      notes: result.data.notes || undefined,
    }).select('id').single()

  if (error) {
    console.error('Error creating session:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء إضافة الجلسة' }
  }

  // Notify the assigned lawyer about the new session
  try {
    const { shouldSendNotification } = await import('@/lib/utils/notifications')
    const shouldNotify = await shouldSendNotification(member.office_id, 'session_reminders')

    if (shouldNotify) {
      // Get the case's assigned lawyer
      const { data: caseData } = await supabase
        .from('cases')
        .select('assigned_to, title')
        .eq('id', result.data.case_id)
        .single()

      if (caseData?.assigned_to && caseData.assigned_to !== user.id) {
        // Use admin client — inserting notification for another user (RLS blocks regular INSERT)
        const adminDb = createAdminClient()
        await adminDb.from('notifications').insert({
          office_id: member.office_id,
          user_id: caseData.assigned_to,
          type: 'session',
          title: 'جلسة جديدة',
          body: `تمت إضافة جلسة جديدة بتاريخ ${result.data.session_date} للقضية "${caseData.title}".`,
          related_entity_id: newSession?.id || undefined,
        })

        // Fire-and-forget push notification
        sendPushToUser(caseData.assigned_to, {
          title: 'جلسة جديدة',
          body: `تمت إضافة جلسة جديدة بتاريخ ${result.data.session_date} للقضية "${caseData.title}".`,
          url: `/dashboard/sessions/${newSession?.id || ''}`,
        })
      }
    }
  } catch (notifErr) {
    console.error('Error sending session notification:', notifErr)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/sessions')
  revalidatePath(`/dashboard/cases/${result.data.case_id}`)
  return { data: null, error: null }
}

export async function updateSessionAction(id: string, values: z.infer<typeof sessionSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = sessionSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      case_id: result.data.case_id,
      session_date: result.data.session_date,
      session_time: result.data.session_time || undefined,
      court: result.data.court || undefined,
      hall: result.data.hall || undefined,
      session_type: result.data.session_type || undefined,
      outcome: result.data.outcome || undefined,
      notes: result.data.notes || undefined,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating session:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء تحديث الجلسة' }
  }

  revalidatePath('/dashboard/sessions')
  revalidatePath('/dashboard/sessions/[sessionId]', 'page')
  revalidatePath(`/dashboard/cases/${result.data.case_id}`)
  return { data: null, error: null }
}

export async function deleteSessionAction(id: string, caseId?: string): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting session:', error)
    if (error.code === '42501') {
      return { data: null, error: 'ليس لديك صلاحية لحذف الجلسة' }
    }
    return { data: null, error: 'حدث خطأ أثناء حذف الجلسة' }
  }

  revalidatePath('/dashboard/sessions')
  revalidatePath('/dashboard/sessions/[sessionId]', 'page')
  if (caseId) revalidatePath(`/dashboard/cases/${caseId}`)
  
  return { data: null, error: null }
}
