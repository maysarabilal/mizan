'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Pencil, Trash2, Calendar, Clock, Building2,
  User, FileText, ShieldAlert, DoorOpen, Scale, Phone, Mail,
  FileUp, FileCheck, FilePlus,
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SessionDialog } from '@/app/dashboard/sessions/SessionDialog'
import { deleteSessionAction } from '@/lib/actions/sessions'
import { Database } from '@/types/database'

type CaseRow = Database['public']['Tables']['cases']['Row']

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: 'مجدولة', bg: '#EFF6FF', text: '#3B82F6' },
  completed: { label: 'مكتملة', bg: '#F0FDF4', text: '#22C55E' },
  postponed: { label: 'مؤجلة', bg: '#FFF7ED', text: '#F97316' },
  cancelled: { label: 'ملغاة', bg: '#FEF2F2', text: '#EF4444' },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SessionDetailClient({ session, cases }: { session: any, cases: CaseRow[] }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const config = statusConfig[session.outcome] || statusConfig.scheduled

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await deleteSessionAction(session.id)
    setIsDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('تم حذف الجلسة بنجاح')
      router.push('/dashboard/sessions')
    }
  }

  const caseData = session.cases
  const clientData = caseData?.clients
  const lawyerName = caseData?.profiles?.full_name

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Back link */}
      <Link
        href="/dashboard/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-[#9AA3B2] hover:text-[#0F1724] dark:hover:text-zinc-100 transition-colors w-fit"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للجلسات
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#0F1724] dark:text-zinc-100">
              {caseData?.title || 'جلسة بدون قضية'}
            </h1>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: config.bg, color: config.text }}
            >
              {config.label}
            </span>
            {session.session_type && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EFD9] rounded text-xs font-medium text-[#3B2F10]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B939A]" />
                {session.session_type}
              </span>
            )}
          </div>
          {caseData?.case_number && (
            <span className="text-sm text-[#8B939A] font-mono">
              رقم القضية: {caseData.case_number}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="gap-2 border-black/8"
          >
            <Pencil className="h-4 w-4" /> تعديل
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Date */}
        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">التاريخ</span>
          </div>
          <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">
            {session.session_date
              ? format(new Date(session.session_date), 'd MMMM yyyy', { locale: ar })
              : '—'}
          </span>
        </div>

        {/* Time */}
        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">الوقت</span>
          </div>
          <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100" dir="ltr">
            {session.session_time ? session.session_time.substring(0, 5) : '—'}
          </span>
        </div>

        {/* Court */}
        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium">المحكمة</span>
          </div>
          <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">
            {session.court || '—'}
          </span>
        </div>

        {/* Hall */}
        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <DoorOpen className="h-4 w-4" />
            <span className="text-xs font-medium">القاعة / الفرع</span>
          </div>
          <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">
            {session.hall || '—'}
          </span>
        </div>

        {/* Lawyer */}
        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <User className="h-4 w-4" />
            <span className="text-xs font-medium">المحامي المعيّن</span>
          </div>
          <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">
            {lawyerName || '—'}
          </span>
        </div>

        {/* Case type */}
        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <Scale className="h-4 w-4" />
            <span className="text-xs font-medium">نوع القضية</span>
          </div>
          <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">
            {caseData?.case_type || '—'}
          </span>
        </div>

        {/* Client name */}
        {clientData && (
          <>
            <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 text-[#8B939A]">
                <User className="h-4 w-4" />
                <span className="text-xs font-medium">الموكل</span>
              </div>
              <Link
                href={`/dashboard/clients/${caseData?.client_id}`}
                className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100 hover:text-[#C9A84C] transition-colors"
              >
                {clientData.name || '—'}
              </Link>
              <div className="flex flex-col gap-1 mt-1">
                {clientData.id_number && (
                  <span className="text-xs text-[#8B939A] flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> {clientData.id_number}
                  </span>
                )}
                {clientData.phone && (
                  <span className="text-xs text-[#8B939A] flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {clientData.phone}
                  </span>
                )}
                {clientData.email && (
                  <span className="text-xs text-[#8B939A] flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {clientData.email}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-3 p-5 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2 text-[#8B939A]">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-semibold">الملاحظات والمذكرات</span>
        </div>
        <p className="text-sm text-[#0F1724] dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
          {session.notes || 'لا توجد ملاحظات مسجلة لهذه الجلسة.'}
        </p>
      </div>

      {/* Attachments Placeholder */}
      <div className="flex flex-col gap-3 p-5 bg-white dark:bg-zinc-950 border border-black/8 dark:border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#8B939A]">
            <FileUp className="h-4 w-4" />
            <span className="text-sm font-semibold">المرفقات والمستندات</span>
          </div>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px]">
            قريباً
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-black/15 dark:border-zinc-700 rounded-md text-sm text-[#8B939A] opacity-60 cursor-not-allowed hover:border-[#C9A84C]/30 transition-colors"
            title="قريباً — إرفاق مذكرة"
          >
            <FileCheck className="h-4 w-4" /> مذكرات
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-black/15 dark:border-zinc-700 rounded-md text-sm text-[#8B939A] opacity-60 cursor-not-allowed hover:border-[#C9A84C]/30 transition-colors"
            title="قريباً — إرفاق طلب"
          >
            <FilePlus className="h-4 w-4" /> طلبات
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-black/15 dark:border-zinc-700 rounded-md text-sm text-[#8B939A] opacity-60 cursor-not-allowed hover:border-[#C9A84C]/30 transition-colors"
            title="قريباً — إرفاق مستند"
          >
            <FileUp className="h-4 w-4" /> مستندات
          </button>
        </div>
      </div>

      {/* Link to case */}
      {caseData && (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 border border-black/8 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-[#8B939A]" />
            <div>
              <span className="text-sm font-semibold text-[#0F1724] dark:text-zinc-100">{caseData.title}</span>
              <span className="text-xs text-[#8B939A] block">{caseData.case_number}</span>
            </div>
          </div>
          <Link href={`/dashboard/cases/${caseData.id}`}>
            <Button variant="outline" size="sm" className="gap-2 border-black/8">
              عرض القضية <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            </Button>
          </Link>
        </div>
      )}

      {/* Edit dialog */}
      <SessionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        sessionItem={session}
        cases={cases}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> تأكيد حذف الجلسة
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الجلسة بشكل نهائي؟ لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>تراجع</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'حذف نهائي!'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
