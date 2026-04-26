import { getClients } from '@/lib/actions/clients'
import { ClientTableList } from './_components/ClientTableList'
import { ClientFilters } from './_components/ClientFilters'
import { AddClientButton } from './_components/AddClientButton'
import { ClientPagination } from './_components/ClientPagination'
import { Users } from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ''
  const currentPage = Number(params.page) || 1

  const { data: allClients } = await getClients(search || undefined)
  const clients = allClients || []

  const totalPages = Math.max(1, Math.ceil(clients.length / ITEMS_PER_PAGE))
  const paginatedClients = clients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-[#0F1724]">العملاء</h1>
            <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold px-2.5 py-1 rounded-full border border-[#C9A84C]/20">
              {clients.length}
            </span>
          </div>
          <p className="text-[14px] text-[#8B939A]">
            إدارة قاعدة العملاء والموكلين المرتبطين بالمكتب.
          </p>
        </div>
        <AddClientButton clients={paginatedClients} allClients={clients} />
      </div>

      {/* Filters */}
      <ClientFilters />

      {/* Table */}
      <ClientTableList clients={paginatedClients} />

      {/* Pagination */}
      <ClientPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={clients.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  )
}
