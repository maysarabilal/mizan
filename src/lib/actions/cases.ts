'use server'

import { createClient } from '@/lib/supabase/server'
import { caseSchema } from '@/lib/validations/cases'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { requireActiveSubscription } from '@/lib/actions/subscription'

export async function getCases(searchQuery?: string) {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()
  
  // RLS automatically filters by current_office_id()
  // We join with clients to get the client name
  let query = supabase
    .from('cases')
    .select(`
      *,
      clients:client_id (name)
    `)
    .order('created_at', { ascending: false })
  
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching cases:', error)
    return { data: null, error: 'فشل في جلب بيانات القضايا' }
  }

  return { data, error: null }
}

export async function createCaseAction(values: z.infer<typeof caseSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = caseSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { data: memberData, error: memberError } = await supabase
    .rpc('current_office_id')
    .single()

  if (memberError || !memberData) {
    return { data: null, error: 'لم يتم العثور على مكتب نشط' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data: newCase, error } = await supabase.from('cases').insert({
    office_id: memberData,
    client_id: result.data.client_id,
    title: result.data.title,
    case_number: result.data.case_number || null,
    case_type: result.data.case_type,
    status: result.data.status,
    priority: result.data.priority,
    litigation_degree: result.data.litigation_degree || null,
    assigned_to: result.data.assigned_to || null,
    notes: result.data.notes || null,
  }).select('id').single()

  if (error) {
    console.error('Error creating case:', error)
    return { data: null, error: 'حدث خطأ أثناء إضافة القضية' }
  }

  // Notify assigned lawyer about the new case
  if (result.data.assigned_to && result.data.assigned_to !== user.id) {
    try {
      const { shouldSendNotification } = await import('@/lib/utils/notifications')
      const shouldNotify = await shouldSendNotification(memberData, 'session_reminders')

      if (shouldNotify) {
        await supabase.from('notifications').insert({
          office_id: memberData,
          user_id: result.data.assigned_to,
          type: 'system',
          title: 'قضية جديدة مُسندة إليك',
          body: `تم إسناد القضية "${result.data.title}" إليك.`,
          related_entity_id: newCase?.id || undefined,
        })
      }
    } catch (notifErr) {
      console.error('Error sending case assignment notification:', notifErr)
    }
  }

  revalidatePath('/dashboard/cases')
  return { data: null, error: null }
}

export async function updateCaseAction(id: string, values: z.infer<typeof caseSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = caseSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  // Fetch existing case to detect assignment changes
  const { data: existingCase } = await supabase
    .from('cases')
    .select('assigned_to, office_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('cases')
    .update({
      client_id: result.data.client_id,
      title: result.data.title,
      case_number: result.data.case_number || null,
      case_type: result.data.case_type,
      status: result.data.status,
      priority: result.data.priority,
      litigation_degree: result.data.litigation_degree || null,
      assigned_to: result.data.assigned_to || null,
      notes: result.data.notes || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating case:', error)
    return { data: null, error: 'حدث خطأ أثناء تحديث القضية' }
  }

  // Notify new assigned lawyer if assignment changed
  const newAssignee = result.data.assigned_to || null
  const oldAssignee = existingCase?.assigned_to || null

  if (newAssignee && newAssignee !== oldAssignee && newAssignee !== user.id && existingCase?.office_id) {
    try {
      const { shouldSendNotification } = await import('@/lib/utils/notifications')
      const shouldNotify = await shouldSendNotification(existingCase.office_id, 'session_reminders')

      if (shouldNotify) {
        await supabase.from('notifications').insert({
          office_id: existingCase.office_id,
          user_id: newAssignee,
          type: 'system',
          title: 'قضية مُسندة إليك',
          body: `تم إسناد القضية "${result.data.title}" إليك.`,
          related_entity_id: id,
        })
      }
    } catch (notifErr) {
      console.error('Error sending case reassignment notification:', notifErr)
    }
  }

  revalidatePath('/dashboard/cases')
  return { data: null, error: null }
}

export async function deleteCaseAction(id: string): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()

  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting case:', error)
    if (error.code === '42501') {
      return { data: null, error: 'ليس لديك صلاحية لحذف القضية' }
    }
    return { data: null, error: 'حدث خطأ أثناء حذف القضية' }
  }

  revalidatePath('/dashboard/cases')
  return { data: null, error: null }
}
