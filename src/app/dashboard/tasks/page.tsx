import { getTasks } from '@/lib/actions/tasks'
import { getCases } from '@/lib/actions/cases'
import { createClient } from '@/lib/supabase/server'
import { TasksClient } from './TasksClient'
import { Database } from '@/types/database'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & {
  cases?: { title: string } | null
  assigned_user?: { full_name: string } | null
}

type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

export default async function TasksPage() {
  const supabase = await createClient()

  const [
    { data: tasks },
    { data: cases },
    { data: teamResponse }
  ] = await Promise.all([
    getTasks(),
    getCases(),
    supabase.from('office_members').select('user_id, profiles(full_name)').eq('is_active', true)
  ])

  const teamMembers = teamResponse || []

  return (
    <div className="flex flex-col gap-6 w-full h-full animate-in fade-in duration-300">
      <TasksClient
        tasks={(tasks || []) as unknown as TaskRowExt[]}
        cases={cases || []}
        teamMembers={teamMembers as unknown as TeamMember[]}
      />
    </div>
  )
}
