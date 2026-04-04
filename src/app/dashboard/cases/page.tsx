import { getCases } from '@/lib/actions/cases'
import { getClients } from '@/lib/actions/clients'
import { createClient } from '@/lib/supabase/server'
import { CaseTable } from './CaseTable'

export default async function CasesPage() {
  const supabase = await createClient()

  // Execute all fetches in parallel for speed
  const [
    { data: cases },
    { data: clients },
    { data: teamResponse }
  ] = await Promise.all([
    getCases(),
    getClients(),
    supabase.from('office_members').select('user_id, profiles(full_name)').eq('is_active', true)
  ])

  // Normalizing shape to avoid typescript errors down the tree
  const teamMembers = teamResponse || []

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">إدارة القضايا</h1>
        <p className="text-muted-foreground text-sm">تتبع حالات القضايا، الدرجات التقاضية، والمهام الموكلة للفريق</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CaseTable initialCases={cases as any || []} clients={clients || []} teamMembers={teamMembers} />
    </div>
  )
}
