'use server'

import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/profile'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'

export async function getProfileAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'غير مصرح' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'تعذر جلب بيانات الملف الشخصي' }
  }

  // Also send the auth email since it's read-only
  return { data: { ...data, email: user.email }, error: null }
}

export async function updateProfileAction(values: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const result = profileSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'غير مصرح' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: result.data.full_name,
      phone: result.data.phone || null,
      job_title: result.data.job_title || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { data: null, error: 'حدث خطأ أثناء حفظ البيانات' }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'غير مصرح' }

  const file = formData.get('file') as File
  if (!file) return { data: null, error: 'لم يتم اختيار ملف' }

  if (file.size > 2 * 1024 * 1024) {
    return { data: null, error: 'حجم الملف يتجاوز 2 ميغابايت' }
  }

  const ext = file.name.split('.').pop()
  const filePath = `avatars/${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Avatar upload error:', uploadError)
    return { data: null, error: 'فشل رفع الصورة' }
  }

  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)

  // Append cache-busting timestamp
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    console.error('Avatar url update error:', updateError)
    return { data: null, error: 'فشل تحديث رابط الصورة' }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard', 'layout')
  return { data: publicUrl, error: null }
}
