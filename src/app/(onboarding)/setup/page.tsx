import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { SetupClient } from './SetupClient'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Historical user classification — check ALL records (bypass RLS)
  // Ownership in Mizan is stored as office_members.role = 'owner',
  // so office_members covers both membership and ownership history.
  const adminDb = createAdminClient()
  const { data: historicalMember } = await adminDb
    .from('office_members')
    .select('id, is_active')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false }) // active records first
    .limit(1)
    .maybeSingle()

  if (historicalMember) {
    // Both EXISTING_ACTIVE and EXISTING_INACTIVE should be redirected to the dashboard.
    // Dashboard layout + SubscriptionGuard will appropriately handle locked/inactive members natively.
    redirect('/dashboard')
  }

  // Category NEW → truly new user, allow onboarding
  return <SetupClient />
}
