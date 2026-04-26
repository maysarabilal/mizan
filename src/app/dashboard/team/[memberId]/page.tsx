import { getMemberById } from '@/lib/actions/team'
import { redirect, notFound } from 'next/navigation'
import { MemberDetailClient } from './MemberDetailClient'
import { createClient } from '@/lib/supabase/server'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params
  const supabase = await createClient()

  // 1. Check permissions
  const { data: hasViewPerm, error: permError } = await supabase.rpc('has_permission', { p_perm: 'view_team' }).single()
  if (permError || !hasViewPerm) redirect('/dashboard')

  // 2. Fetch data
  const { data: member, error } = await getMemberById(memberId)
  if (error || !member) notFound()

  // 3. Render
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <MemberDetailClient member={member as any} />
}
