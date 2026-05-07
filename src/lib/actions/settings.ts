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

  const { error } = await supabase
    .from('offices')
    .update({
      name: result.data.name,
      specialization: result.data.specialization || null,
      license_number: result.data.license_number || null,
      address: result.data.address || null,
      working_days: result.data.working_days as unknown as import('@/types/database').Json,
      working_hours_start: result.data.working_hours_start || null,
      working_hours_end: result.data.working_hours_end || null,
      settings: settingsPayload as unknown as import('@/types/database').Json,
      updated_at: new Date().toISOString()
    })
    .eq('id', memberData)

  if (error) {
    console.error('Error updating office settings:', error)
    return { data: null, error: 'فشل تحديث الإعدادات. تأكد أنك تمتلك صلاحية مدير النظام لهذا المكتب.' }
  }

  revalidatePath('/dashboard/settings')
  return { data: null, error: null }
}

export async function uploadOfficeLogo(formData: FormData): Promise<ActionResult<string>> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()

  const { data: officeId, error: officeError } = await supabase.rpc('current_office_id').single()
  if (officeError || !officeId) return { data: null, error: 'غير مصرح' }

  const file = formData.get('file') as File
  if (!file) return { data: null, error: 'لم يتم اختيار ملف' }

  if (file.size > 2 * 1024 * 1024) {
    return { data: null, error: 'حجم الملف يتجاوز 2 ميغابايت' }
  }

  const ext = file.name.split('.').pop()
  const filePath = `logos/${officeId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Logo upload error:', uploadError)
    return { data: null, error: 'فشل رفع الشعار' }
  }

  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)

  // Append cache-busting timestamp
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('offices')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', officeId)

  if (updateError) {
    console.error('Logo url update error:', updateError)
    return { data: null, error: 'فشل تحديث رابط الشعار' }
  }

  revalidatePath('/dashboard/settings')
  return { data: publicUrl, error: null }
}

export async function getActivityLog() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'غير مصرح' }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, details, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching activity log:', error)
    return { data: [], error: null }
  }

  return { data: data || [], error: null }
}
