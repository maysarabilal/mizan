'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SessionDialog } from '@/app/dashboard/sessions/SessionDialog'
import { deleteSessionAction } from '@/lib/actions/sessions'
import { createClient } from '@/lib/supabase/browser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UpcomingSessions({ initialSessions }: { initialSessions: any[] }) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSession, setEditingSession] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cases, setCases] = useState<any[]>([])

  const statusMap: Record<string, string> = {
    'scheduled': 'مجدولة',
    'completed': 'مكتملة',
    'postponed': 'مؤجلة',
    'cancelled': 'ملغاة'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = async (session: any) => {
    setLoadingEdit(true)
    const supabase = createClient()
    const { data } = await supabase.from('cases').select('id, title, office_id, clients(name)')
    if (data) setCases(data)
    setLoadingEdit(false)
    setEditingSession(session)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteSessionAction(deletingId)
    setIsDeleting(false)

    if (error) {
      toast.error(error)
      setDeletingId(null)
      return
    }

    toast.success('تم حذف الجلسة بنجاح')
    setDeletingId(null)
    router.refresh()
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-[#eef0f4]">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-[#eef0f4] text-[#5a6480] text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">التاريخ والوقت</th>
              <th className="px-6 py-4 font-semibold">اسم القضية</th>
              <th className="px-6 py-4 font-semibold">المحكمة</th>
              <th className="px-6 py-4 font-semibold">الحالة</th>
              <th className="px-6 py-4 font-semibold text-center w-16">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef0f4]">
            {initialSessions && initialSessions.length > 0 ? (
              initialSessions.map((session) => (
                <tr key={session.id} className="hover:bg-[#eef0f4]/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-medium text-[#1a2744]">
                      {new Date(session.session_date).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-xs text-[#5a6480] mt-0.5">{session.session_time ? session.session_time.substring(0, 5) : 'غير محدد'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-medium text-[#1a2744]">
                      {session.cases?.title || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-[#5a6480]">{session.court || 'غير محدد'}</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f4f5f7] text-[#1a2744] border border-[#dde0e8]">
                      {statusMap[session.outcome] || session.outcome || 'مجدولة'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-[#1a2744] transition-colors focus:outline-none">
                        <MoreVertical className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href={`/dashboard/cases/${session.cases?.id || ''}`} className="w-full text-right block">
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" disabled={loadingEdit} onClick={() => handleEdit(session)}>
                          <Pencil className="me-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setDeletingId(session.id)}>
                          <Trash2 className="me-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#5a6480]">
                  لا توجد جلسات قادمة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingSession && (
        <SessionDialog 
          open={!!editingSession} 
          onOpenChange={(open) => !open && setEditingSession(null)} 
          sessionItem={editingSession}
          cases={cases}
        />
      )}

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              تأكيد حذف الجلسة
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الجلسة بشكل نهائي؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isDeleting}>تراجع</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'حذف نهائي!'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
