'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

import { Database } from '@/types/database'
import { deleteSessionAction } from '@/lib/actions/sessions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { SessionDialog } from './SessionDialog'
import { Search, Plus, MoreHorizontal, Pencil, Trash2, CalendarDays, Clock } from 'lucide-react'

// Extended type since it includes the joined case and client
type SessionRowExt = Database['public']['Tables']['sessions']['Row'] & { 
  cases: { title: string, clients: { name: string } | null } | null 
}
type CaseRow = Database['public']['Tables']['cases']['Row']

const statusMap: Record<string, string> = {
  'scheduled': 'مجدولة',
  'completed': 'مكتملة',
  'postponed': 'مؤجلة',
  'cancelled': 'ملغاة'
}

export function SessionTable({ initialSessions, cases }: { initialSessions: SessionRowExt[], cases: CaseRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sessions, setSessions] = useState<SessionRowExt[]>(initialSessions)
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionRowExt | null>(null)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setSessions(initialSessions)
  }, [initialSessions])

  const filteredSessions = sessions.filter(s => 
    s.cases?.title?.includes(search) || 
    (s.cases?.clients?.name && s.cases.clients.name.includes(search)) ||
    s.court?.includes(search)
  )

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

  const getStatusColor = (s: string) => {
    if (s === 'scheduled') return 'default'
    if (s === 'completed') return 'secondary'
    if (s === 'postponed') return 'outline'
    if (s === 'cancelled') return 'destructive'
    return 'default'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="بحث حسب القضية، الموكل، المحكمة..." 
            className="pl-4 pr-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="me-2 h-4 w-4" /> إضافة جلسة جديدة
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold w-[250px]">ارتباط بالقضية / العميل</TableHead>
              <TableHead className="text-right font-bold">تاريخ ووقت الجلسة</TableHead>
              <TableHead className="text-right font-bold">النوع والمحكمة</TableHead>
              <TableHead className="text-right font-bold">الحالة</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                  لا يوجد جلسات مسجلة بناءً على تصفيتك
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-primary line-clamp-1">{s.cases?.title}</span>
                      <span className="text-xs text-muted-foreground mt-1">{s.cases?.clients?.name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center text-sm font-medium">
                        <CalendarDays className="h-3.5 w-3.5 ml-1.5 text-blue-600 dark:text-blue-400" />
                        {s.session_date ? format(new Date(s.session_date), "d MMMM yyyy", { locale: ar }) : '—'}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 ml-1.5" />
                        <span dir="ltr">{s.session_time ? s.session_time.substring(0, 5) : 'غير محدد'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{s.session_type}</span>
                      {(s.court || s.hall) && (
                        <span className="text-xs text-muted-foreground">{s.court} {s.hall ? `- ${s.hall}` : ''}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Badge variant={getStatusColor(s.outcome) as any} className="font-normal rounded-md">
                      {statusMap[s.outcome] || s.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu >
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSession(s)}>
                          <Pencil className="me-2 h-4 w-4" /> تعديل الجلسة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingId(s.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                          <Trash2 className="me-2 h-4 w-4" /> حذف الجلسة
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

      <SessionDialog 
        open={isAddOpen || !!editingSession} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingSession(null)
          }
        }} 
        sessionItem={editingSession}
        cases={cases}
      />

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
    </div>
  )
}
