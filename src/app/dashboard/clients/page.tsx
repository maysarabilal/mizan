import { getClients } from '@/lib/actions/clients'
import { ClientTable } from './ClientTable'

export default async function ClientsPage() {
  const { data: clients } = await getClients()

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">العملاء</h1>
        <p className="text-muted-foreground text-sm">إدارة قاعدة عملائك والشركات المرتبطة بالمكتب</p>
      </div>

      <ClientTable initialClients={clients || []} />
    </div>
  )
}
