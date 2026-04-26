'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { MoreHorizontal, Pencil, Trash2, CalendarDays, ShieldAlert, Eye, User } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SessionDialog } from '../SessionDialog'
import { deleteSessionAction } from '@/lib/actions/sessions'
import { Database } from '@/types/database'

type SessionRowExt = {
  id: string
  office_id: string
  case_id: string
  session_date: string
  session_time: string | null
  court: string | null
  hall: string | null
  session_type: string | null
  outcome: string
  notes: string | null
  created_at: string
  updated_at: string
  cases: {
    title: string
    clients: { name: string } | null
    profiles?: { full_name: string } | null
  } | null
}
type CaseRow = Database['public']['Tables']['cases']['Row']

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  scheduled:  { label: 'مجدولة',  bg: '#EFF6FF', text: '#3B82F6' },
  completed:  { label: 'مكتملة',  bg: '#F0FDF4', text: '#22C55E' },
  postponed:  { label: 'مؤجلة',  bg: '#FFF7ED', text: '#F97316' },
  cancelled:  { label: 'ملغاة',   bg: '#FEF2F2', text: '#EF4444' },
}

interface SessionTableListProps {
  sessions: SessionRowExt[]
  cases: CaseRow[]
}

export function SessionTableList({ sessions, cases }: SessionTableListProps) {
  const router = useRouter()

  const [editingSession, setEditingSession] = useState<SessionRowExt | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteSessionAction(deletingId)
    setIsDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف الجلسة بنجاح')
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <>
      {!sessions || sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-zinc-950">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">لا توجد جلسات</h3>
          <p className="text-sm text-muted-foreground mt-1">لم يتم العثور على أي جلسات تطابق الفلاتر المحددة.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-black/8">
                <TableHead className="text-right whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6 w-[170px]">
                  التاريخ / الوقت
                </TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6">
                  القضية
                </TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6">
                  المحكمة / المحامي
                </TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6 w-[93px]">
                  القاعة
                </TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6">
                  نوع الجلسة
                </TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6">
                  الحالة
                </TableHead>
                <TableHead className="text-end whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#8B939A] py-4 px-6 w-[106px]">
                  الإجراءات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s, idx) => (
                <TableRow
                  key={s.id}
                  className={`border-b border-black/8 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors ${idx % 2 === 1 ? 'bg-[#F9FAFB] dark:bg-zinc-900/30' : ''}`}
                  onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                >
                  {/* Date/Time */}
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[#0F1724] dark:text-zinc-100">
                        {s.session_date ? format(new Date(s.session_date), 'd MMMM yyyy', { locale: ar }) : '—'}
                      </span>
                      <span className="text-xs text-[#8B939A]" dir="ltr">
                        {s.session_time ? s.session_time.substring(0, 5) : '—'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Case + Client */}
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-[#0F1724] dark:text-zinc-100 line-clamp-1">
                        {s.cases?.title || '—'}
                      </span>
                      <span className="text-xs text-[#8B939A]">{s.cases?.clients?.name || '—'}</span>
                    </div>
                  </TableCell>

                  {/* Court + Lawyer */}
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-[#0F1724] dark:text-zinc-200">
                        {s.court || '—'}
                      </span>
                      {s.cases?.profiles?.full_name && (
                        <span className="text-xs text-[#8B939A] flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {s.cases.profiles.full_name}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Hall */}
                  <TableCell className="py-4 px-6 text-sm text-[#0F1724] dark:text-zinc-200">
                    {s.hall || '—'}
                  </TableCell>

                  {/* Session Type - badge with dot */}
                  <TableCell className="py-4 px-6">
                    {s.session_type ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EFD9] rounded text-xs font-medium text-[#3B2F10]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B939A]" />
                        {s.session_type}
                      </span>
                    ) : '—'}
                  </TableCell>

                  {/* Status - colored pill */}
                  <TableCell className="py-4 px-6">
                    {(() => {
                      const config = statusConfig[s.outcome] || statusConfig.scheduled
                      return (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: config.bg, color: config.text }}
                        >
                          {config.label}
                        </span>
                      )
                    })()}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 px-6 text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/sessions/${s.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-zinc-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingSession(s)}>
                            <Pencil className="me-2 h-4 w-4" /> تعديل الجلسة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingId(s.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                          >
                            <Trash2 className="me-2 h-4 w-4" /> حذف الجلسة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <SessionDialog
        open={!!editingSession}
        onOpenChange={(open) => {
          if (!open) setEditingSession(null)
        }}
        sessionItem={editingSession}
        cases={cases}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> تأكيد حذف الجلسة
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
