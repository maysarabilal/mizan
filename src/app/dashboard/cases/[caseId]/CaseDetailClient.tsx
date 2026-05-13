'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Download, Plus, Edit, MoreHorizontal,
  Mail, Phone, User, Calendar, FileText, CheckSquare, DollarSign,
  ShieldAlert, Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SessionDialog } from '@/app/dashboard/sessions/SessionDialog'
import { deleteSessionAction } from '@/lib/actions/sessions'
import { getCaseAttachments, deleteCaseAttachment } from '@/lib/actions/attachments'
import { AttachmentsSection } from '@/components/attachments/AttachmentsSection'
import { CaseFinancialTab } from './CaseFinancialTab'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseDetailClient({ caseData, sessions, currentUserId, userRole, canManageFees = false }: { caseData: any, sessions: any[], currentUserId: string, userRole: string, canManageFees?: boolean }) {
  const router = useRouter()
  const [addSessionOpen, setAddSessionOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSession, setEditingSession] = useState<any | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [isDeletingSession, setIsDeletingSession] = useState(false)

  const handleDeleteSession = async () => {
    if (!deletingSessionId) return
    setIsDeletingSession(true)
    const { error } = await deleteSessionAction(deletingSessionId)
    setIsDeletingSession(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف الجلسة بنجاح')
      router.refresh()
    }
    setDeletingSessionId(null)
  }

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

  const getSessionStatusBadge = (outcome: string) => {
    switch (outcome) {
      case 'completed':
      case 'مكتملة':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A] text-white">مكتملة</span>
      case 'postponed':
      case 'مؤجلة':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#C2410C]">مؤجلة</span>
      case 'cancelled':
      case 'ملغاة':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">ملغاة</span>
      case 'scheduled':
      case 'مجدولة':
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0369A1]">
          {outcome === 'scheduled' ? 'مجدولة' : (outcome || 'مجدولة')}
        </span>
    }
  }

  const clientName = caseData.clients?.name || '—'
  const clientInitials = clientName !== '—'
    ? clientName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : '?'
  const assignedLawyer = caseData.profiles?.full_name || '—'

  return (
    <div className="flex flex-col gap-6 px-4 py-5 md:p-8 font-[Inter]">
      {/* Back Link */}
      <div className="pb-2">
        <Link
          href="/dashboard/cases"
          className="flex items-center gap-2 text-[#9AA3B2] hover:text-[#1A2744] transition-colors text-sm font-medium w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للقضايا
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-xl md:text-[28px] font-bold leading-tight text-[#0F1724]">{caseData.title}</h1>
          <div className="flex items-center flex-wrap gap-2">
            {caseData.case_number && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F3F4F6] text-[#9AA3B2]">
                {caseData.case_number}
              </span>
            )}
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-[#F0EAD6] text-[#3B3A33] border border-black/8">
              {caseData.case_type}
            </span>
            {getStatusBadge(caseData.status)}
            {getPriorityBadge(caseData.priority)}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            className="flex items-center gap-2 bg-[#1A2744] hover:bg-[#1A2744]/90 text-white font-semibold flex-1 sm:flex-none justify-center"
            onClick={() => setAddSessionOpen(true)}
          >
            <Plus className="h-4 w-4" />
            إضافة جلسة
          </Button>
          {/* PLACEHOLDER — export feature not yet implemented */}
          <Button
            type="button"
            variant="outline"
            disabled
            title="قريباً — ميزة تصدير القضية قيد التطوير"
            className="flex items-center gap-2 border-black/10 text-[#0F1724] font-semibold opacity-60 cursor-not-allowed flex-1 sm:flex-none justify-center"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Case Information Card */}
        <div className="lg:col-span-2 bg-white border border-black/[0.08] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08]">
            <span className="text-base font-semibold text-[#0F1724]">معلومات القضية</span>
            <Edit className="h-[18px] w-[18px] text-[#9AA3B2]" />
          </div>
          <div className="p-6 flex flex-col gap-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">تاريخ التسجيل</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">
                  {format(new Date(caseData.created_at), 'dd MMM yyyy', { locale: ar })}
                </span>
              </div>
              {/* PLACEHOLDER — litigation_degree column not in DB schema yet */}
              <div className="flex flex-col gap-1.5" title="قريباً — حقل درجة التقاضي غير متاح بعد">
                <span className="text-[13px] font-medium text-[#9AA3B2]">درجة التقاضي</span>
                <span className="text-[15px] font-semibold text-[#9AA3B2] opacity-60">—</span>
              </div>
              {/* PLACEHOLDER — assigned_judge column not in DB schema yet */}
              <div className="flex flex-col gap-1.5" title="قريباً — حقل القاضي المعيّن غير متاح بعد">
                <span className="text-[13px] font-medium text-[#9AA3B2]">القاضي المعيّن</span>
                <span className="text-[15px] font-semibold text-[#9AA3B2] opacity-60">—</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">المحامي المسؤول</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{assignedLawyer}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">نوع القضية</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">{caseData.case_type}</span>
              </div>
              {caseData.opposing_party && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[#9AA3B2]">الخصم (الطرف الآخر)</span>
                  <span className="text-[15px] font-semibold text-[#0F1724]">{caseData.opposing_party}</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">آخر تحديث</span>
                <span className="text-[15px] font-semibold text-[#0F1724]">
                  {format(new Date(caseData.updated_at), 'dd MMM yyyy', { locale: ar })}
                </span>
              </div>
            </div>
            {caseData.notes && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#9AA3B2]">الملاحظات</span>
                <p className="text-[15px] text-[#0F1724] leading-[22px]">{caseData.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Summary Card */}
        <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08]">
            <span className="text-base font-semibold text-[#0F1724]">بيانات العميل</span>
            <Link href={`/dashboard/clients/${caseData.client_id}`}>
              <User className="h-4 w-4 text-[#9AA3B2] hover:text-[#C9A84C] transition-colors" />
            </Link>
          </div>
          <div className="px-6 py-6 flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-[72px] h-[72px] rounded-full bg-[#F0EAD6] flex items-center justify-center border-2 border-[#C9A84C]/20">
                {caseData.clients?.avatar_url ? (
                  <img src={caseData.clients.avatar_url} alt={clientName} className="w-[72px] h-[72px] rounded-full object-cover" />
                ) : (
                  <span className="text-[24px] font-semibold text-[#3B3A33]">{clientInitials}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[18px] font-semibold text-[#0F1724]">{clientName}</span>
              <span className="text-[13px] text-[#9AA3B2]">موكل</span>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-col gap-3 w-full">
              {caseData.clients?.id_number && (
                <div className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724]">
                  <ShieldAlert className="h-4 w-4 text-[#9AA3B2]" />
                  <span dir="ltr">{caseData.clients.id_number}</span>
                </div>
              )}
              {caseData.clients?.email && (
                <a href={`mailto:${caseData.clients.email}`}>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724] hover:bg-[#e8eaed] transition-colors">
                    <Mail className="h-4 w-4 text-[#9AA3B2]" />
                    {caseData.clients.email}
                  </button>
                </a>
              )}
              {caseData.clients?.phone && (
                <a href={`tel:${caseData.clients.phone}`}>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724] hover:bg-[#e8eaed] transition-colors">
                    <Phone className="h-4 w-4 text-[#9AA3B2]" />
                    {caseData.clients.phone}
                  </button>
                </a>
              )}
              {caseData.clients?.address && (
                <div className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724]">
                  <Calendar className="h-4 w-4 text-[#9AA3B2]" />
                  {caseData.clients.address}
                </div>
              )}
              <Link href={`/dashboard/clients/${caseData.client_id}`}>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F3F4F6] rounded-lg text-[14px] text-[#0F1724] hover:bg-[#e8eaed] transition-colors">
                  <User className="h-4 w-4 text-[#9AA3B2]" />
                  عرض الملف الشخصي
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Panel */}
      <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
        <Tabs defaultValue="sessions" dir="rtl">
          <TabsList className="flex w-full h-auto p-0 bg-transparent border-b border-black/[0.08] rounded-none justify-start gap-0 overflow-x-auto scrollbar-hide">
            <TabsTrigger
              value="sessions"
              className="flex items-center gap-2 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2744] data-[state=active]:text-[#1A2744] data-[state=inactive]:text-[#9AA3B2] font-medium text-sm bg-transparent shadow-none"
            >
              <Calendar className="h-4 w-4" />
              الجلسات
              <span className="bg-[#1A2744] text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {sessions.length}
              </span>
            </TabsTrigger>
            {/* PLACEHOLDER — Documents feature not implemented */}
            <TabsTrigger
              value="documents"
              className="flex items-center gap-2 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2744] data-[state=active]:text-[#1A2744] data-[state=inactive]:text-[#9AA3B2] font-medium text-sm bg-transparent shadow-none"
            >
              <FileText className="h-4 w-4" />
              المرفقات
            </TabsTrigger>
            {/* PLACEHOLDER — Tasks per-case linking not implemented */}
            <TabsTrigger
              value="tasks"
              disabled
              title="قريباً — ربط المهام بالقضايا قيد التطوير"
              className="flex items-center gap-2 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=inactive]:text-[#9AA3B2] font-medium text-sm bg-transparent shadow-none opacity-60 cursor-not-allowed"
            >
              <CheckSquare className="h-4 w-4" />
              المهام
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="flex items-center gap-2 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2744] data-[state=active]:text-[#1A2744] data-[state=inactive]:text-[#9AA3B2] font-medium text-sm bg-transparent shadow-none"
            >
              <DollarSign className="h-4 w-4" />
              المصاريف
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="m-0">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
                <p className="font-medium text-[#0F1724]">لا توجد جلسات مسجلة</p>
                <p className="text-sm text-[#9AA3B2] mt-1">اضغط على "إضافة جلسة" لتسجيل أول جلسة</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F3F4F6] hover:bg-[#F3F4F6]">
                        <TableHead className="text-[#9AA3B2] font-medium text-sm py-4 px-6">التاريخ والوقت</TableHead>
                        <TableHead className="text-[#9AA3B2] font-medium text-sm py-4 px-6">نوع الجلسة</TableHead>
                        <TableHead className="text-[#9AA3B2] font-medium text-sm py-4 px-6">المحكمة</TableHead>
                        <TableHead className="text-[#9AA3B2] font-medium text-sm py-4 px-6">القاعة</TableHead>
                        <TableHead className="text-[#9AA3B2] font-medium text-sm py-4 px-6">الحالة</TableHead>
                        <TableHead className="text-[#9AA3B2] font-medium text-sm py-4 px-6 text-end">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s) => (
                        <TableRow key={s.id} className="border-b border-black/[0.08] hover:bg-gray-50/50">
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-[14px] text-[#0F1724]">
                                {format(new Date(s.session_date), 'dd MMM yyyy', { locale: ar })}
                              </span>
                              {s.session_time && (
                                <span className="text-[12px] text-[#9AA3B2]">{s.session_time}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 font-medium text-[14px] text-[#0F1724]">{s.session_type || '—'}</TableCell>
                          <TableCell className="py-4 px-6 text-[14px] text-[#0F1724]">{s.court || '—'}</TableCell>
                          <TableCell className="py-4 px-6 text-[14px] text-[#0F1724]">{s.hall || '—'}</TableCell>
                          <TableCell className="py-4 px-6">{getSessionStatusBadge(s.outcome)}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#9AA3B2] hover:text-[#1A2744] hover:bg-slate-100" onClick={() => setEditingSession(s)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#9AA3B2] hover:bg-slate-100 hover:text-[#1A2744] transition-colors">
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingSession(s)}><Edit className="me-2 h-4 w-4" /> تعديل</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-red-50" onClick={() => setDeletingSessionId(s.id)}><Trash2 className="me-2 h-4 w-4" /> حذف</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="block sm:hidden divide-y divide-black/[0.06]">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm text-[#0F1724]">
                            {format(new Date(s.session_date), 'dd MMM yyyy', { locale: ar })}
                          </span>
                          {s.session_time && <span className="text-xs text-[#9AA3B2]" dir="ltr">{s.session_time.substring(0,5)}</span>}
                        </div>
                        {getSessionStatusBadge(s.outcome)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5A6480]">
                        {s.session_type && <span>{s.session_type}</span>}
                        {s.court && <span>{s.court}</span>}
                        {s.hall && <span>{s.hall}</span>}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={() => setEditingSession(s)} className="flex items-center gap-1.5 text-xs text-[#8B939A] hover:text-[#C9A84C]">
                          <Edit className="h-3.5 w-3.5" /> تعديل
                        </button>
                        <button onClick={() => setDeletingSessionId(s.id)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="documents" className="m-0 p-6">
            <AttachmentsSection
              entityId={caseData.id}
              entityType="case"
              currentUserId={currentUserId}
              userRole={userRole}
              fetchAttachments={getCaseAttachments}
              deleteAttachment={deleteCaseAttachment}
            />
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
              <p className="font-medium text-[#0F1724]">لا توجد مهام</p>
              <p className="text-sm text-[#9AA3B2] mt-1">ميزة المهام المرتبطة بالقضية قيد التطوير</p>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="m-0">
            <CaseFinancialTab
              caseId={caseData.id}
              userRole={userRole}
              canManageFees={canManageFees}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Session Dialog */}
      <SessionDialog
        open={addSessionOpen || !!editingSession}
        onOpenChange={(open) => {
          if (!open) { setAddSessionOpen(false); setEditingSession(null) }
        }}
        sessionItem={editingSession}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cases={[caseData as any]}
        preselectedCaseId={caseData.id}
      />

      {/* Delete Session Confirmation */}
      <Dialog open={!!deletingSessionId} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> تأكيد حذف الجلسة
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setDeletingSessionId(null)} disabled={isDeletingSession}>تراجع</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSession} disabled={isDeletingSession}>
              {isDeletingSession ? 'جاري الحذف...' : 'حذف الجلسة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
