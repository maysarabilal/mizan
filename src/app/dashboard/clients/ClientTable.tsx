'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

import { Database } from '@/types/database'
import { deleteClientAction } from '@/lib/actions/clients'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ClientDialog } from './ClientDialog'
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

type Client = Database['public']['Tables']['clients']['Row']

export function ClientTable({ initialClients }: { initialClients: Client[] }) {
  const router = useRouter()
  // Local state for search handling (basic filtering, or could trigger server refetch via push)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<Client[]>(initialClients)
  
  // Dialogs internal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Update clients when initial props change
  useEffect(() => {
    setClients(initialClients)
  }, [initialClients])

  const filteredClients = clients.filter(c => 
    c.name.includes(search) || 
    (c.phone && c.phone.includes(search)) || 
    (c.email && c.email.includes(search))
  )

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteClientAction(deletingId)
    setIsDeleting(false)

    if (error) {
      toast.error(error)
      setDeletingId(null)
      return
    }

    toast.success('تم حذف العميل بنجاح')
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="بحث عن عميل..." 
            className="pl-4 pr-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="me-2 h-4 w-4" /> إضافة عميل
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold w-[250px]">اسم العميل</TableHead>
              <TableHead className="text-right font-bold">تاريخ الإضافة</TableHead>
              <TableHead className="text-right font-bold">الهاتف</TableHead>
              <TableHead className="text-right font-bold">البريد الإلكتروني</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                  لا يوجد عملاء مضافين بعد
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-primary">{client.name}</TableCell>
                  <TableCell>
                    {format(new Date(client.created_at), "d MMMM yyyy", { locale: ar })}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right rtl:text-left text-muted-foreground">{client.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu >
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">فتح القائمة</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingClient(client)}>
                          <Pencil className="me-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingId(client.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                          <Trash2 className="me-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Forms & Dialogs */}
      <ClientDialog 
        open={isAddOpen || !!editingClient} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingClient(null)
          }
        }} 
        client={editingClient}
      />

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>حذف العميل</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع القضايا والجلسات المرتبطة به.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isDeleting}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
