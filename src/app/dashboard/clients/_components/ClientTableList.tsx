'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Eye, MoreHorizontal, Pencil, Trash2, Phone, Mail, MapPin, CreditCard } from 'lucide-react'
import { Database } from '@/types/database'
import { deleteClientAction } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientDialog } from '../ClientDialog'

type Client = Database['public']['Tables']['clients']['Row']

export function ClientTableList({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteClientAction(deletingId)
    setIsDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف العميل بنجاح')
      router.refresh()
    }
    setDeletingId(null)
  }

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <>
      <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8F9FB] hover:bg-[#F8F9FB] border-b border-black/[0.08]">
              <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5 w-[220px]">العميل</TableHead>
              <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">رقم الهوية</TableHead>
              <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">الهاتف</TableHead>
              <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">البريد الإلكتروني</TableHead>
              <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">العنوان</TableHead>
              <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">تاريخ الإضافة</TableHead>
              <TableHead className="text-center text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-3 w-[90px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-40 text-[#9AA3B2] text-[14px]">
                  لا يوجد عملاء مضافين بعد
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="border-b border-black/[0.06] hover:bg-[#FAFBFC] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  {/* Client Name + Avatar */}
                  <TableCell className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F0EAD6] flex items-center justify-center shrink-0">
                        {client.avatar_url ? (
                          <img src={client.avatar_url} alt={client.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-[12px] font-bold text-[#3B3A33]">{getInitials(client.name)}</span>
                        )}
                      </div>
                      <span className="text-[14px] font-semibold text-[#0F1724]">{client.name}</span>
                    </div>
                  </TableCell>

                  {/* ID Number */}
                  <TableCell className="py-3 px-5">
                    {client.id_number ? (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#0F1724]">
                        <CreditCard className="h-3.5 w-3.5 text-[#9AA3B2]" />
                        {client.id_number}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#C5CAD0]">—</span>
                    )}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="py-3 px-5">
                    {client.phone ? (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#0F1724]" dir="ltr">
                        <Phone className="h-3.5 w-3.5 text-[#9AA3B2]" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#C5CAD0]">—</span>
                    )}
                  </TableCell>

                  {/* Email */}
                  <TableCell className="py-3 px-5">
                    {client.email ? (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#0F1724]" dir="ltr">
                        <Mail className="h-3.5 w-3.5 text-[#9AA3B2]" />
                        {client.email}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#C5CAD0]">—</span>
                    )}
                  </TableCell>

                  {/* Address */}
                  <TableCell className="py-3 px-5">
                    {client.address ? (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#0F1724]">
                        <MapPin className="h-3.5 w-3.5 text-[#9AA3B2]" />
                        <span className="truncate max-w-[150px]">{client.address}</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#C5CAD0]">—</span>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-3 px-5 text-[13px] text-[#6B7280]">
                    {format(new Date(client.created_at), 'd MMMM yyyy', { locale: ar })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#9AA3B2] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10"
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#9AA3B2] hover:bg-slate-100 hover:text-[#0F1724] transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingClient(client)}>
                            <Pencil className="me-2 h-4 w-4" /> تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setDeletingId(client.id)}
                          >
                            <Trash2 className="me-2 h-4 w-4" /> حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <ClientDialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        client={editingClient}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">حذف العميل</DialogTitle>
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
    </>
  )
}
