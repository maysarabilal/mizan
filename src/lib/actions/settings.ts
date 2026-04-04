'use server'

import { createClient } from '@/lib/supabase/server'
import { officeSettingsSchema } from '@/lib/validations/settings'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { requireActiveSubscription } from '@/lib/actions/subscription'

export async function getOfficeConfig() {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()

  const { data: memberData, error: memberError } = await supabase.rpc('current_office_id').single()
  if (memberError || !memberData) return { data: null, error: 'غير مصرح' }

  const { data, error } = await supabase
    .from('offices')
    .select('*')
    .eq('id', memberData)
    .single()

  if (error) {
    console.error('Error fetching office settings:', error)
    return { data: null, error: 'فشل جلب إعدادات المكتب' }
  }

  return { data, error: null }
}

export async function updateOfficeSettingsAction(values: z.infer<typeof officeSettingsSchema>): Promise<ActionResult> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const result = officeSettingsSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()

  const { data: memberData, error: memberError } = await supabase.rpc('current_office_id').single()
  if (memberError || !memberData) return { data: null, error: 'غير مصرح' }

  const settingsPayload = {
    session_reminders: result.data.session_reminders,
    task_completed: result.data.task_completed,
    subscription_updates: result.data.subscription_updates
  }

  // Uses Owner RLS inside Postgres
  const { error } = await supabase
    .from('offices')
    .update({ 
      name: result.data.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: settingsPayload as any, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', memberData)

  if (error) {
    console.error('Error updating office settings:', error)
    return { data: null, error: 'فشل تحديث الإعدادات. تأكدأنك تمتلك صلاحية مدير النظام لهذا المكتب.' }
  }

  revalidatePath('/dashboard/settings')
  return { data: null, error: null }
}
