import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import { getClients } from '@/lib/actions/clients'
import { Badge } from '@/components/ui/badge'
import { CaseFilters } from './_components/CaseFilters'
import { CaseTableList } from './_components/CaseTableList'
import { CasePagination } from './_components/CasePagination'
import CasesLoading from './loading'
import { AddCaseButton } from './_components/AddCaseButton'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  type?: string
  status?: string
  priority?: string
  page?: string
  per_page?: string
}

async function CasesPageContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const subError = await requireActiveSubscription()
  if (subError) redirect('/dashboard')

  const params = await searchParams
  const supabase = await createClient()

  // Parse params
  const q = params.q || ''
  const type = params.type && params.type !== 'all' ? params.type : null
  const status = params.status && params.status !== 'all' ? params.status : null
  const priority = params.priority && params.priority !== 'all' ? params.priority : null
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = [10, 25, 50, 100].includes(Number(params.per_page)) ? Number(params.per_page) : 10
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Build cases query
  let query = supabase
    .from('cases')
    .select(`
      *,
      clients:client_id(name),
      profiles!cases_assigned_to_fkey(full_name)
    `, { count: 'exact' })

  if (q) query = query.or(`title.ilike.%${q}%,case_number.ilike.%${q}%`)

  // Map UI status labels to actual DB values
  if (status) {
    query = query.eq('status', status)
  }

  if (type) query = query.eq('case_type', type)
  if (priority) query = query.eq('priority', priority)

  query = query.order('created_at', { ascending: false }).range(from, to)

  // Fetch cases + clients + team in parallel
  const [{ data: casesData, count, error }, { data: clients }, teamRes] = await Promise.all([
    query,
    getClients(),
    supabase.from('office_members').select('user_id, profiles(full_name)').eq('is_active', true),
  ])

  if (error) console.error('Error fetching cases:', error)

  const teamMembers = teamRes.data || []

  // Fetch latest session per case in one query
  let sessionMap: Record<string, string | null> = {}
  if (casesData && casesData.length > 0) {
    const caseIds = casesData.map((c) => c.id)
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('case_id, session_date')
      .in('case_id', caseIds)
      .order('session_date', { ascending: false })

    if (sessionsData) {
      for (const s of sessionsData) {
        if (!sessionMap[s.case_id]) sessionMap[s.case_id] = s.session_date
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processedCases = (casesData || []).map((c: any) => ({
    ...c,
    last_session_date: sessionMap[c.id] ?? null,
  }))

  const totalCases = count || 0

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-primary">القضايا</h1>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
            {totalCases}
          </Badge>
        </div>

        {/* Add Case button (client component) */}
        <AddCaseButton clients={clients || []} teamMembers={teamMembers} />
      </div>

      {/* Filters */}
      <CaseFilters />

      {/* Table + Pagination */}
      <div className="flex flex-col rounded-xl shadow-sm border border-[#eef0f4] dark:border-zinc-800 overflow-hidden">
        <CaseTableList
          cases={processedCases}
          clients={clients || []}
          teamMembers={teamMembers}
        />
        <CasePagination total={totalCases} />
      </div>
    </div>
  )
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<CasesLoading />}>
      <CasesPageContent searchParams={searchParams} />
    </Suspense>
  )
}
