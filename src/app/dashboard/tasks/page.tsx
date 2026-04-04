import { getTasks } from '@/lib/actions/tasks'
import { getCases } from '@/lib/actions/cases'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { KanbanBoard } from './KanbanBoard'

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

  // Execute all fetches in parallel
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
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">إدارة المهام</h1>
        <p className="text-muted-foreground text-sm">تتبع مهام الفريق، تحديد الأولويات، وتنفيذ الأعمال بسلاسة من مكان واحد</p>
      </div>

      {/* The Kanban Board dynamically renders columns based on the tasks array */}
      <KanbanBoard initialTasks={(tasks || []) as unknown as TaskRowExt[]} cases={cases || []} teamMembers={teamMembers as unknown as TeamMember[]} />
    </div>
  )
}
