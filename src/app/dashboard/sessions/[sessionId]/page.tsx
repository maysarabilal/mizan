import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import { getCases } from '@/lib/actions/cases'
import { SessionDetailClient } from './SessionDetailClient'

export const dynamic = 'force-dynamic'

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>
}

async function SessionDetailContent({ params }: SessionDetailPageProps) {
  const subError = await requireActiveSubscription()
  if (subError) notFound()

  const { sessionId } = await params
  const supabase = await createClient()

  // NEW: Permission check
  const { data: hasViewPerm } = await supabase.rpc('has_permission', { p_perm: 'view_sessions' }).single()
  if (!hasViewPerm) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase.from('office_members').select('role').eq('user_id', user?.id || '').single()
    if (member?.role !== 'owner') notFound()
  }

  // Fetch session with case, client, and lawyer
  const [sessionResult, { data: cases }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        *,
        cases (
          id,
          title,
          case_number,
          case_type,
          status,
          priority,
          clients:client_id(id, name, phone, email),
          profiles!cases_assigned_to_fkey(full_name)
        )
      `)
      .eq('id', sessionId)
      .single(),
    getCases(),
  ])

  if (sessionResult.error || !sessionResult.data) {
    notFound()
  }

  return (
    <SessionDetailClient
      session={sessionResult.data}
      cases={cases || []}
    />
  )
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <Suspense fallback={<SessionDetailLoading />}>
      <SessionDetailContent params={params} />
    </Suspense>
  )
}

function SessionDetailLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="h-5 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
      <div className="flex justify-between items-start">
        <div className="h-8 w-64 bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-9 w-24 bg-slate-200 dark:bg-zinc-800 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        ))}
      </div>
      <div className="h-40 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
    </div>
  )
}
