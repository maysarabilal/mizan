'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, Edit, MoreHorizontal, Trash2, Scale, ShieldAlert, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CaseDialog } from '../CaseDialog'
import { deleteCaseAction } from '@/lib/actions/cases'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseTableList({ cases, clients, teamMembers }: { cases: any[], clients: Client[], teamMembers: any[] }) {
  const router = useRouter()

  const [isAddOpen, setIsAddOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCase, setEditingCase] = useState<any | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteCaseAction(deletingId)
    setIsDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف القضية بنجاح')
      router.refresh()
    }
    setDeletingId(null)
  }

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'جارية':
      case 'في الاستئناف':
        return 'bg-[#E0F2FE] text-[#0369A1] border-transparent'
      case 'مغلقة':
      case 'مكتملة':
        return 'bg-[#F3F4F6] text-[#9AA3B2] border-transparent'
      case 'معلقة':
        return 'bg-[#FFEDD5] text-[#C2410C] border-transparent'
      default:
        return 'bg-gray-100 text-gray-800 border-transparent'
    }
  }

  const getPriorityBadgeStyles = (priority: string) => {
    switch (priority) {
      case 'عالية':
        return 'bg-[#DC2626] text-white border-transparent'
      case 'متوسطة':
        return 'bg-yellow-100 text-yellow-800 border-transparent'
      case 'منخفضة':
        return 'bg-green-100 text-green-800 border-transparent'
      default:
        return 'bg-gray-100 text-gray-800 border-transparent'
    }
  }

  // Exposed setter so parent (page.tsx) can trigger Add dialog
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__openAddCaseDialog = () => setIsAddOpen(true)
  }

  return (
    <>
      {/* Table */}
      {!cases || cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-zinc-950 border-x border-[#eef0f4] dark:border-zinc-800">
          <Scale className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">لا توجد قضايا</h3>
          <p className="text-sm text-muted-foreground mt-1">لم يتم العثور على أي قضايا تطابق الفلاتر المحددة.</p>
        </div>
      ) : (
        <div className="border-x border-[#eef0f4] dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="w-[110px] whitespace-nowrap">رقم القضية</TableHead>
                <TableHead className="min-w-[200px]">عنوان القضية</TableHead>
                <TableHead className="min-w-[140px]">العميل</TableHead>
                <TableHead className="whitespace-nowrap">النوع</TableHead>
                <TableHead className="whitespace-nowrap">الحالة</TableHead>
                <TableHead className="whitespace-nowrap">الأهمية</TableHead>
                <TableHead className="min-w-[140px]">المحامي المسؤول</TableHead>
                <TableHead className="whitespace-nowrap">آخر جلسة</TableHead>
                <TableHead className="text-end w-[110px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
                  onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                >
                  <TableCell className="font-mono text-xs">
                    {c.case_number || <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary line-clamp-1">{c.title}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {c.clients?.name || <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">{c.case_type}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={`font-normal text-xs ${getStatusBadgeStyles(c.status)}`}>
                      {c.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={`font-normal text-xs ${getPriorityBadgeStyles(c.priority)}`}>
                      {c.priority === 'عالية' && <AlertCircle className="w-3 h-3 ml-1" />}
                      {c.priority}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {c.profiles?.full_name || <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="text-sm">
                    {c.last_session_date
                      ? format(new Date(c.last_session_date), 'dd MMM yyyy', { locale: ar })
                      : <span className="text-gray-400 dark:text-gray-600">—</span>
                    }
                  </TableCell>

                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/cases/${c.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); setEditingCase(c) }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-zinc-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCase(c)}>
                            <Edit className="me-2 h-4 w-4" /> تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-red-50 dark:focus:bg-red-950"
                            onClick={() => setDeletingId(c.id)}
                          >
                            <Trash2 className="me-2 h-4 w-4" /> حذف القضية
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

      {/* CaseDialog for add/edit */}
      <CaseDialog
        open={isAddOpen || !!editingCase}
        onOpenChange={(open) => {
          if (!open) { setIsAddOpen(false); setEditingCase(null) }
        }}
        caseItem={editingCase}
        clients={clients}
        teamMembers={teamMembers}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه القضية نهائياً؟ سيؤدي ذلك إلى حذف جميع الجلسات والمهام المرتبطة بها.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isDeleting}>تراجع</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export a named ref for the Add button trigger from outside
export type { CaseTableListHandle }
interface CaseTableListHandle {
  openAdd: () => void
}
