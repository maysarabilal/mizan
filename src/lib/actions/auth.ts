'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginSchema, registerSchema, resetPasswordSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/types/actions'

export async function signIn(values: z.infer<typeof loginSchema>): Promise<ActionResult<{ redirect: string }>> {
  const result = loginSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'البيانات المدخلة غير صحيحة' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error || !data.user) {
    return { data: null, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
  }

  // Determine redirection path based on office_members
  const { data: memberData } = await supabase
    .from('office_members')
    .select('office_id')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle()

  const redirect = memberData ? '/dashboard' : '/setup'

  return { data: { redirect }, error: null }
}

export async function signUp(values: z.infer<typeof registerSchema>): Promise<ActionResult> {
  const result = registerSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'البيانات المدخلة غير صحيحة' }

  const supabase = await createClient()
  // Disable email confirmation requirement in local dev if it causes issues, but for production it should be set in supabase settings.
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.full_name,
      },
    },
  })

  if (error) {
    if (error.status === 422 || error.message.includes('already registered')) {
      return { data: null, error: 'هذا البريد مستخدم مسبقاً' }
    }
    return { data: null, error: 'حدث خطأ، يرجى المحاولة مجدداً' }
  }

  if (data.user) {
    // Insert into profiles using admin client (bypassing RLS until user confirms email, or because auth schema insert is restricted)
    const adminSupabase = createAdminClient()
    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: data.user.id,
      full_name: result.data.full_name,
    })

    if (profileError) {
      // If profile creation fails, we might want to log it or handle it gently. Still considered a success for auth, but the user may need to update profile later.
      console.error('Error creating profile for user', profileError)
    }
  }

  return { data: null, error: null }
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { data: null, error: null }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(values: z.infer<typeof resetPasswordSchema>): Promise<ActionResult> {
  const result = resetPasswordSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'البيانات المدخلة غير صحيحة' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email)

  if (error) {
    return { data: null, error: 'حدث خطأ في إرسال رابط استعادة كلمة المرور' }
  }

  return { data: null, error: null }
}
