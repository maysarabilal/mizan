'use server'

import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/clients'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { requireActiveSubscription } from '@/lib/actions/subscription'

export async function getClients(searchQuery?: string) {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()
  
  // Note: RLS automatically filters by current_office_id()
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
  
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,id_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching clients:', error)
    return { data: null, error: 'فشل في جلب بيانات العملاء' }
  }

  return { data, error: null }
}

export async function getClientById(clientId: string) {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return { data: null, error: 'فشل في جلب بيانات العميل' }
  }

  return { data, error: null }
}

export async function getClientCases(clientId: string) {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cases')
    .select('*, profiles:assigned_to(full_name), sessions(id, session_date, outcome)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client cases:', error)
    return { data: null, error: 'فشل في جلب قضايا العميل' }
  }

  return { data, error: null }
}

export async function createClientAction(values: z.infer<typeof clientSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = clientSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { data: memberData, error: memberError } = await supabase
    .rpc('current_office_id')
    .single()

  if (memberError || !memberData) {
    return { data: null, error: 'لم يتم العثور على مكتب نشط' }
  }

  const { error } = await supabase.from('clients').insert({
    office_id: memberData,
    name: result.data.name,
    phone: result.data.phone || null,
    email: result.data.email || null,
    id_number: result.data.id_number || null,
    address: result.data.address || null,
    notes: result.data.notes || null,
  })

  if (error) {
    console.error('Error creating client:', error)
    return { data: null, error: 'حدث خطأ أثناء إضافة العميل' }
  }

  revalidatePath('/dashboard/clients')
  return { data: null, error: null }
}

export async function updateClientAction(id: string, values: z.infer<typeof clientSchema>): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const result = clientSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({
      name: result.data.name,
      phone: result.data.phone || null,
      email: result.data.email || null,
      id_number: result.data.id_number || null,
      address: result.data.address || null,
      notes: result.data.notes || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating client:', error)
    return { data: null, error: 'حدث خطأ أثناء تحديث العميل' }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
  return { data: null, error: null }
}

export async function deleteClientAction(id: string): Promise<ActionResult> {
  const subError = await requireActiveSubscription()
  if (subError) return { data: null, error: subError }

  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    // RLS policy prevents non-owners from deleting
    if (error.code === '42501') {
      return { data: null, error: 'ليس لديك صلاحية لحذف العميل' }
    }
    return { data: null, error: 'حدث خطأ أثناء حذف العميل' }
  }

  revalidatePath('/dashboard/clients')
  return { data: null, error: null }
}
