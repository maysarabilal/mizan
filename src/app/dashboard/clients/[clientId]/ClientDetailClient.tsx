'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Edit, Mail, Phone, MapPin, CreditCard,
  Calendar, User, Briefcase, Trash2, ShieldAlert,
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ClientDialog } from '../ClientDialog'
import { deleteClientAction } from '@/lib/actions/clients'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientDetailClient({ client, cases }: { client: Client, cases: any[] }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await deleteClientAction(client.id)
    setIsDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف العميل بنجاح')
      router.push('/dashboard/clients')
    }
    setDeleteOpen(false)
  }

  const initials = client.name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جارية':
      case 'في الاستئناف':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E0E7FF] text-[#4338CA]">{status}</span>
      case 'مغلقة':
      case 'مكتملة':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#9AA3B2]">{status}</span>
      case 'معلقة':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#C2410C]">{status}</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#9AA3B2]">{status}</span>
    }
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'عالية') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DC2626] text-white">{priority}</span>
    if (priority === 'متوسطة') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#C2410C]">{priority}</span>
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#9AA3B2]">{priority}</span>
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Back Link */}
      <div className="pb-2">
        <Link
          href="/dashboard/clients"
          className="flex items-center gap-2 text-[#9AA3B2] hover:text-[#1A2744] transition-colors text-sm font-medium w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للعملاء
        </Link>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Profile Card */}
        <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08]">
            <span className="text-base font-semibold text-[#0F1724]">الملف الشخصي</span>
            <button onClick={() => setEditOpen(true)}>
              <Edit className="h-[18px] w-[18px] text-[#9AA3B2] hover:text-[#C9A84C] transition-colors" />
            </button>
          </div>
          <div className="px-6 py-8 flex flex-col items-center gap-5">
            {/* Avatar */}
            <div className="w-[88px] h-[88px] rounded-full bg-[#F0EAD6] flex items-center justify-center border-2 border-[#C9A84C]/20">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.name} className="w-[88px] h-[88px] rounded-full object-cover" />
              ) : (
                <span className="text-[28px] font-bold text-[#3B3A33]">{initials}</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[20px] font-bold text-[#0F1724]">{client.name}</span>
              <span className="text-[13px] text-[#9AA3B2]">موكل</span>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-3 w-full">
              {client.id_number && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724]">
                  <CreditCard className="h-4 w-4 text-[#9AA3B2] shrink-0" />
                  <span dir="ltr">{client.id_number}</span>
                </div>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724] hover:bg-[#e8eaed] transition-colors">
                    <Phone className="h-4 w-4 text-[#9AA3B2] shrink-0" />
                    <span dir="ltr">{client.phone}</span>
                  </div>
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724] hover:bg-[#e8eaed] transition-colors">
                    <Mail className="h-4 w-4 text-[#9AA3B2] shrink-0" />
                    {client.email}
                  </div>
                </a>
              )}
              {client.address && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724]">
                  <MapPin className="h-4 w-4 text-[#9AA3B2] shrink-0" />
                  {client.address}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1 border-black/10 text-[#0F1724] font-medium"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="h-4 w-4 me-2" /> تعديل
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Client Details Card */}
        <div className="lg:col-span-2 bg-white border border-black/[0.08] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08]">
            <span className="text-base font-semibold text-[#0F1724]">معلومات العميل</span>
          </div>
          <div className="p-6 flex flex-col gap-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">الاسم الكامل</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{client.name}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">رقم الهوية</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{client.id_number || '—'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">الهاتف</span>
                <span className="text-[15px] font-semibold text-[#0F1724]" dir="ltr">{client.phone || '—'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">البريد الإلكتروني</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{client.email || '—'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">العنوان</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{client.address || '—'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">تاريخ الإضافة</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">
                  {format(new Date(client.created_at), 'dd MMM yyyy', { locale: ar })}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">عدد القضايا</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{cases.length}</span>
              </div>
            </div>
            {client.notes && (
              <>
                <div className="h-px bg-black/[0.06]" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[#9AA3B2]">الملاحظات</span>
                  <p className="text-[15px] text-[#0F1724] leading-[22px] whitespace-pre-wrap">{client.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08]">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-[#9AA3B2]" />
            <span className="text-base font-semibold text-[#0F1724]">القضايا المرتبطة</span>
            <span className="bg-[#1A2744] text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {cases.length}
            </span>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
            <p className="font-medium text-[#0F1724]">لا توجد قضايا مرتبطة</p>
            <p className="text-sm text-[#9AA3B2] mt-1">اربط هذا العميل بقضية من صفحة القضايا</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F9FB] hover:bg-[#F8F9FB] border-b border-black/[0.08]">
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">عنوان القضية</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">رقم القضية</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">النوع</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">الحالة</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">الأهمية</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">المحامي</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-6">عدد الجلسات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-b border-black/[0.06] hover:bg-[#FAFBFC] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                >
                  <TableCell className="py-3.5 px-6 font-semibold text-[14px] text-[#0F1724]">
                    {c.title}
                  </TableCell>
                  <TableCell className="py-3.5 px-6 text-[13px] text-[#6B7280]">
                    {c.case_number || '—'}
                  </TableCell>
                  <TableCell className="py-3.5 px-6">
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-[#F0EAD6] text-[#3B3A33] border border-black/8">
                      {c.case_type}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5 px-6">{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="py-3.5 px-6">{getPriorityBadge(c.priority)}</TableCell>
                  <TableCell className="py-3.5 px-6 text-[13px] text-[#0F1724]">
                    {c.profiles?.full_name || '—'}
                  </TableCell>
                  <TableCell className="py-3.5 px-6 text-[13px] text-[#6B7280]">
                    {c.sessions?.length || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <ClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> تأكيد حذف العميل
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع القضايا والجلسات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>تراجع</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'حذف العميل'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
