import { notFound } from 'next/navigation'
import { getClientById, getClientCases } from '@/lib/actions/clients'
import { ClientDetailClient } from './ClientDetailClient'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: hasViewPerm } = await supabase.rpc('has_permission', { p_perm: 'view_clients' }).single()
  if (!hasViewPerm) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase.from('office_members').select('role').eq('user_id', user?.id || '').single()
    if (member?.role !== 'owner') notFound()
  }

  const { data: client, error: clientError } = await getClientById(clientId)
  if (clientError || !client) notFound()

  const { data: cases } = await getClientCases(clientId)

  return <ClientDetailClient client={client} cases={cases || []} />
}
