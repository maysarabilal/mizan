'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Database } from '@/types/database'
import { deleteCaseAction } from '@/lib/actions/cases'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CaseDialog } from './CaseDialog'
import { Search, Plus, MoreHorizontal, Pencil, Trash2, ShieldAlert } from 'lucide-react'

// Extended type since it includes the joined client name
type CaseRowExt = Database['public']['Tables']['cases']['Row'] & { clients: { name: string } | null }
type Client = Database['public']['Tables']['clients']['Row']
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseTable({ initialCases, clients, teamMembers }: { initialCases: CaseRowExt[], clients: Client[], teamMembers: any[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cases, setCases] = useState<CaseRowExt[]>(initialCases)
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<CaseRowExt | null>(null)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setCases(initialCases)
  }, [initialCases])

  const filteredCases = cases.filter(c => 
    c.title.includes(search) || 
    (c.case_number && c.case_number.includes(search)) || 
    (c.clients?.name && c.clients.name.includes(search))
  )

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteCaseAction(deletingId)
    setIsDeleting(false)

    if (error) {
      toast.error(error)
      setDeletingId(null)
      return
    }

    toast.success('تم حذف القضية بنجاح')
    setDeletingId(null)
    router.refresh()
  }

  const getPriorityColor = (p: string) => {
    if (p === 'عالية') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    if (p === 'متوسطة') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }

  const getStatusColor = (s: string) => {
    if (s === 'جارية') return 'default'
    if (s === 'مكتملة' || s === 'مغلقة') return 'secondary'
    if (s === 'معلقة') return 'outline'
    if (s === 'في الاستئناف') return 'destructive'
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
            placeholder="بحث حسب الموضوع، الموكل، الرقم..." 
            className="pl-4 pr-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="me-2 h-4 w-4" /> إضافة قضية
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold w-[300px]">موضوع القضية</TableHead>
              <TableHead className="text-right font-bold">الموكل</TableHead>
              <TableHead className="text-right font-bold">النوع</TableHead>
              <TableHead className="text-right font-bold">الحالة</TableHead>
              <TableHead className="text-right font-bold">الأهمية</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  لا يوجد قضايا مسجلة بناءً على تصفيتك
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-primary line-clamp-1">{c.title}</span>
                      {c.case_number && <span className="text-xs text-muted-foreground mt-1 tracking-widest" dir="ltr">{c.case_number}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.clients?.name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.case_type}</TableCell>
                  <TableCell>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Badge variant={getStatusColor(c.status) as any} className="font-normal rounded-md">{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-normal rounded-md border-transparent ${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu >
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCase(c)}>
                          <Pencil className="me-2 h-4 w-4" /> تعديل واطلاع
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingId(c.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                          <Trash2 className="me-2 h-4 w-4" /> حذف القضية
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

      <CaseDialog 
        open={isAddOpen || !!editingCase} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingCase(null)
          }
        }} 
        caseItem={editingCase}
        clients={clients}
        teamMembers={teamMembers}
      />

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه القضية بشكل نهائي؟ سيؤدي ذلك إلى حذف جميع المهام والجلسات المرتبطة بها. (هذا الإجراء مسموح به لمدير المكتب فقط).
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
