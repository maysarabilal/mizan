import { getProfileAction } from '@/lib/actions/profile'
import { ProfileForm } from './ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, memberRes] = await Promise.all([
    getProfileAction(),
    supabase
      .from('office_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
  ])

  const ROLE_LABELS: Record<string, string> = {
    owner: 'مالك المكتب',
    admin: 'مدير',
    lawyer: 'محامي',
    secretary: 'سكرتير',
    trainee: 'متدرب',
  }

  const role = memberRes.data?.role || 'lawyer'
  const roleLabel = ROLE_LABELS[role] || role

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F1724]">الملف الشخصي</h1>
        <p className="text-sm text-[#9AA3B2]">
          تعديل معلومات حسابك، اسم العرض، وبيانات التواصل.
        </p>
      </div>

      <ProfileForm initialData={profileRes.data || {}} role={roleLabel} />
    </div>
  )
}
