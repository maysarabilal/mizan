import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import { getCases } from '@/lib/actions/cases'
import { getOfficeConfig } from '@/lib/actions/settings'
import { Badge } from '@/components/ui/badge'
import { SessionFilters } from './_components/SessionFilters'
import { SessionTableList } from './_components/SessionTableList'
import { SessionPagination } from './_components/SessionPagination'
import { AddSessionButton } from './_components/AddSessionButton'
import { SessionCalendarView } from './_components/SessionCalendarView'
import SessionsLoading from './loading'
import { SessionViewToggle } from './_components/SessionViewToggle'


interface SearchParams {
  q?: string
  status?: string
  type?: string
  court?: string
  date_from?: string
  date_to?: string
  page?: string
  per_page?: string
  view?: string
}

async function SessionsPageContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const subError = await requireActiveSubscription()
  if (subError) redirect('/dashboard')

  const params = await searchParams
  const supabase = await createClient()

  // Parse params
  const q = params.q || ''
  const status = params.status && params.status !== 'all' ? params.status : null
  const type = params.type && params.type !== 'all' ? params.type : null
  const court = params.court && params.court !== 'all' ? params.court : null
  const dateFrom = params.date_from || null
  const dateTo = params.date_to || null
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = [10, 25, 50, 100].includes(Number(params.per_page)) ? Number(params.per_page) : 10
  const offset = (page - 1) * perPage
  const view = params.view === 'calendar' ? 'calendar' : 'list'

  // Use RPC for search (supports cross-table search: client name, lawyer name, case title)
  const [rpcResult, { data: cases }, distinctTypesRes, distinctCourtsRes, calendarResult, officeRes] = await Promise.all([
    supabase.rpc('search_sessions', {
      search_term: q || null,
      filter_status: status,
      filter_type: type,
      filter_court: court,
      filter_date_from: dateFrom,
      filter_date_to: dateTo,
      page_offset: offset,
      page_limit: perPage,
    }),
    getCases(),
    supabase.from('sessions').select('session_type').not('session_type', 'is', null),
    supabase.from('sessions').select('court').not('court', 'is', null),
    // For calendar view, fetch ALL sessions (no pagination)
    view === 'calendar'
      ? supabase
          .from('sessions')
          .select(`*, cases (title, clients(name), profiles!cases_assigned_to_fkey(full_name))`)
          .order('session_date', { ascending: true })
      : Promise.resolve({ data: null, error: null }),
    getOfficeConfig(),
  ])

  if (rpcResult.error) console.error('Error fetching sessions:', rpcResult.error)

  // Extract distinct values
  const sessionTypes = [...new Set(
    (distinctTypesRes.data || [])
      .map((r: { session_type: string | null }) => r.session_type)
      .filter(Boolean) as string[]
  )].sort()

  const courts = [...new Set(
    (distinctCourtsRes.data || [])
      .map((r: { court: string | null }) => r.court)
      .filter(Boolean) as string[]
  )].sort()

  // Transform RPC results to match component interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcData = (rpcResult.data || []) as any[]
  const totalSessions = rpcData.length > 0 ? Number(rpcData[0].total_count) : 0

  const sessions = rpcData.map((r) => ({
    id: r.id,
    office_id: r.office_id,
    case_id: r.case_id,
    session_date: r.session_date,
    session_time: r.session_time,
    court: r.court,
    hall: r.hall,
    session_type: r.session_type,
    outcome: r.outcome,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    cases: {
      title: r.case_title,
      clients: r.client_name ? { name: r.client_name } : null,
      profiles: r.lawyer_name ? { full_name: r.lawyer_name } : null,
    },
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarSessions = (calendarResult.data || []) as any[]

  const workingDays = (officeRes.data?.working_days as string[]) || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-primary">الجلسات والمواعيد</h1>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
              {totalSessions}
            </Badge>
          </div>
          <AddSessionButton cases={cases || []} workingDays={workingDays} />
        </div>
        <p className="text-sm text-muted-foreground">
          جدولة الجلسات، مواعيد المحاكم، وتتبع مسارات القضايا بشكل يومي أو شهري
        </p>
      </div>

      {/* View Toggle + Legend */}
      <SessionViewToggle currentView={view} />

      {view === 'list' ? (
        <>
          {/* Filters */}
          <SessionFilters sessionTypes={sessionTypes} courts={courts} />

          {/* Table + Pagination */}
          <div className="flex flex-col rounded-lg shadow-sm border border-black/8 dark:border-zinc-800 overflow-hidden">
            <SessionTableList sessions={sessions} cases={cases || []} workingDays={workingDays} />
            <SessionPagination total={totalSessions} />
          </div>
        </>
      ) : (
        /* Calendar View */
        <SessionCalendarView sessions={calendarSessions} cases={cases || []} workingDays={workingDays} />
      )}
    </div>
  )
}

export default async function SessionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<SessionsLoading />}>
      <SessionsPageContent searchParams={searchParams} />
    </Suspense>
  )
}
