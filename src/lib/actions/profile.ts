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
