'use server'

import { createClient } from '@/lib/supabase/server'
import { taskSchema } from '@/lib/validations/tasks'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import {
  PRIORITY_TO_DB,
  DB_TO_PRIORITY,
  STATUS_TO_DB,
  DB_TO_STATUS,
} from '@/lib/constants/enums'

export async function getTasks(searchQuery?: string) {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()
  
  // RLS filters automatically 
  // We join cases(title) and profiles(full_name) using the assigned_to foreign key
  let query = supabase
    .from('tasks')
    .select(`
      *,
      cases (title),
      assigned_user:profiles!tasks_assigned_to_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
  
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return { data: null, error: 'فشل في جلب المهام' }
  }

  const normalized = data?.map((task) => ({
    ...task,
    status: DB_TO_STATUS[task.status as keyof typeof DB_TO_STATUS] ?? task.status,
    priority: DB_TO_PRIORITY[task.priority as keyof typeof DB_TO_PRIORITY] ?? task.priority,
  }))

  return { data: normalized ?? null, error: null }
}

export async function createTaskAction(values: z.infer<typeof taskSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = taskSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const assignedTo = result.data.assigned_to || null
  const caseId = result.data.case_id || null
  const dbPriority = PRIORITY_TO_DB[result.data.priority] ?? result.data.priority
  const dbStatus = STATUS_TO_DB[result.data.status] ?? result.data.status

  const { data: member, error: memberError } = await supabase
    .from('office_members')
    .select('office_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError || !member) {
    return { data: null, error: 'تعذر التحقق من الهوية والمكتب النشط' }
  }

  // If a case is provided, verify it belongs to the same office
  if (caseId) {
    const { data: caseRecord } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('office_id', member.office_id)
      .single()
    if (!caseRecord) return { data: null, error: 'القضية المحددة غير موجودة' }
  }

  // If assigned_to is provided, verify they are in the same office
  if (assignedTo) {
    const { data: assignedMember } = await supabase
      .from('office_members')
      .select('id')
      .eq('user_id', assignedTo)
      .eq('office_id', member.office_id)
      .eq('is_active', true)
      .single()
    if (!assignedMember) return { data: null, error: 'المستخدم المعين غير نشط في مكتبك' }
  }

  const { error } = await supabase.from('tasks').insert({
    office_id: member.office_id,
    created_by: user.id, // Mandatory by DB
    title: result.data.title,
    description: result.data.description || null,
    status: dbStatus,
    priority: dbPriority,
    due_date: result.data.due_date || null,
    assigned_to: assignedTo,
    case_id: caseId,
  })

  if (error) {
    console.error('Error creating task:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء إضافة المهمة' }
  }

  revalidatePath('/dashboard/tasks')
  if (caseId) revalidatePath(`/dashboard/cases/${caseId}`)
  return { data: null, error: null }
}

export async function updateTaskAction(id: string, values: z.infer<typeof taskSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = taskSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const assignedTo = result.data.assigned_to || null
  const caseId = result.data.case_id || null
  // Convert English status/priority to Arabic for DB
  const dbPriority = PRIORITY_TO_DB[result.data.priority] ?? result.data.priority
  const dbStatus = STATUS_TO_DB[result.data.status] ?? result.data.status

  const { data: member, error: memberError } = await supabase
    .from('office_members')
    .select('office_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError || !member) {
    return { data: null, error: 'تعذر التحقق من الهوية والمكتب النشط' }
  }

  const { data: existingTask, error: taskError } = await supabase
    .from('tasks')
    .select('case_id')
    .eq('id', id)
    .eq('office_id', member.office_id)
    .single()

  if (taskError || !existingTask) {
    return { data: null, error: 'المهمة غير موجودة أو لا تملك صلاحية تعديلها' }
  }

  if (caseId) {
    const { data: caseRecord } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('office_id', member.office_id)
      .single()
    if (!caseRecord) return { data: null, error: 'القضية المحددة غير موجودة' }
  }

  if (assignedTo) {
    const { data: assignedMember } = await supabase
      .from('office_members')
      .select('id')
      .eq('user_id', assignedTo)
      .eq('office_id', member.office_id)
      .eq('is_active', true)
      .single()
    if (!assignedMember) return { data: null, error: 'المستخدم المعين غير نشط في مكتبك' }
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      title: result.data.title,
      description: result.data.description || null,
      status: dbStatus,  // Arabic value
      priority: dbPriority,  // Arabic value
      due_date: result.data.due_date ? result.data.due_date : null,
      assigned_to: assignedTo,
      case_id: caseId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('office_id', member.office_id)

  if (error) {
    console.error('Error updating task:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء تحديث المهمة' }
  }

  revalidatePath('/dashboard/tasks')
  if (existingTask.case_id) revalidatePath(`/dashboard/cases/${existingTask.case_id}`)
  if (caseId) revalidatePath(`/dashboard/cases/${caseId}`)
  return { data: null, error: null }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data: member, error: memberError } = await supabase
    .from('office_members')
    .select('office_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError || !member) {
    return { data: null, error: 'تعذر التحقق من الهوية والمكتب النشط' }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('office_id', member.office_id)


  if (error) {
    console.error('Error deleting task:', error)
    return { data: null, error: 'حدث خطأ أثناء حذف المهمة' }
  }

  revalidatePath('/dashboard/tasks')
  return { data: null, error: null }
}
