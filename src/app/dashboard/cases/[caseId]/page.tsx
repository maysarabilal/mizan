import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import { CaseDetailClient } from './CaseDetailClient'
import CaseDetailLoading from './loading'

export const dynamic = 'force-dynamic'

interface CaseDetailPageProps {
  params: Promise<{ caseId: string }>
}

async function CaseDetailContent({ params }: CaseDetailPageProps) {
  const subError = await requireActiveSubscription()
  if (subError) notFound()

  const { caseId } = await params
  const supabase = await createClient()

  // NEW: Permission check
  const { data: hasViewPerm } = await supabase.rpc('has_permission', { p_perm: 'view_cases' }).single()
  if (!hasViewPerm) {
    const { data: { user } } = await supabase.auth.getUser()
    // Owners always have permission
    const { data: member } = await supabase.from('office_members').select('role').eq('user_id', user?.id || '').single()
    if (member?.role !== 'owner') {
       notFound() // Return notFound to avoid leaking case existence or redirect
    }
  }

  // Fetch case with client and assigned lawyer in parallel with sessions
  const [caseResult, sessionsResult] = await Promise.all([
    supabase
      .from('cases')
      .select(`
        *,
        clients:client_id(id, name, phone, email),
        profiles!cases_assigned_to_fkey(full_name)
      `)
      .eq('id', caseId)
      .single(),

    supabase
      .from('sessions')
      .select('*')
      .eq('case_id', caseId)
      .order('session_date', { ascending: false }),
  ])

  if (caseResult.error || !caseResult.data) {
    notFound()
  }

  // Get current user ID and role for attachments permissions
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('office_members')
    .select('role')
    .eq('user_id', user?.id || '')
    .single()

  return (
    <CaseDetailClient
      caseData={caseResult.data}
      sessions={sessionsResult.data || []}
      currentUserId={user?.id || ''}
      userRole={member?.role || ''}
    />
  )
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  return (
    <Suspense fallback={<CaseDetailLoading />}>
      <CaseDetailContent params={params} />
    </Suspense>
  )
}
