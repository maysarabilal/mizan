import { Suspense } from 'react'
import { getTasks } from '@/lib/actions/tasks'
import { getCases } from '@/lib/actions/cases'
import { createClient } from '@/lib/supabase/server'
import { TasksClient } from './TasksClient'
import { Database } from '@/types/database'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & {
  cases?: { title: string } | null
  sessions?: { session_date: string; court: string | null } | null
  assigned_user?: { full_name: string } | null
}

type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

async function TasksPageContent() {
  const supabase = await createClient()

  const [
    { data: tasks },
    { data: cases },
    { data: sessions },
    { data: teamResponse }
  ] = await Promise.all([
    getTasks(),
    getCases(),
    // Only fetch needed columns — not select('*')
    supabase.from('sessions').select('id, office_id, case_id, session_date, session_time, court, hall, session_type, outcome, notes, created_at, updated_at').order('session_date', { ascending: false }),
    supabase.from('office_members').select('user_id, profiles(full_name)').eq('is_active', true)
  ])

  const teamMembers = teamResponse || []

  return (
    <TasksClient
      tasks={(tasks || []) as unknown as TaskRowExt[]}
      cases={cases || []}
      sessions={sessions || []}
      teamMembers={teamMembers as unknown as TeamMember[]}
    />
  )
}

function TasksLoading() {
  return (
    <div className="flex flex-col gap-6 w-full h-full animate-pulse">
      <div className="h-10 w-64 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-96 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6 w-full h-full animate-in fade-in duration-300">
      <Suspense fallback={<TasksLoading />}>
        <TasksPageContent />
      </Suspense>
    </div>
  )
}
