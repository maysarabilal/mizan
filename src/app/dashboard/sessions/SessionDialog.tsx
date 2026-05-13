'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { FileCheck, FilePlus, FileUp, AlertCircle } from 'lucide-react'
import { getDay } from 'date-fns'

import { sessionSchema } from '@/lib/validations/sessions'
import { createSessionAction, updateSessionAction } from '@/lib/actions/sessions'
import { Database } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'


type SessionRow = Database['public']['Tables']['sessions']['Row']
type CaseRow = Database['public']['Tables']['cases']['Row']

interface SessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionItem?: SessionRow | null
  cases: CaseRow[]
  preselectedCaseId?: string
  workingDays?: string[]
}

const SESSION_TYPES = ['مرافعة', 'نطق بالحكم', 'استجواب', 'تقديم مستندات', 'خبرة', 'أخرى']
const STATUSES = ['scheduled', 'completed', 'postponed', 'cancelled']

const statusMap: Record<string, string> = {
  'scheduled': 'مجدولة',
  'completed': 'مكتملة',
  'postponed': 'مؤجلة',
  'cancelled': 'ملغاة'
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function SessionDialog({ open, onOpenChange, sessionItem, cases, preselectedCaseId, workingDays = [] }: SessionDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!sessionItem

  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      case_id: sessionItem?.case_id || preselectedCaseId || '',
      session_date: sessionItem?.session_date || '',
      session_time: sessionItem?.session_time || '',
      court: sessionItem?.court || '',
      hall: sessionItem?.hall || '',
      session_type: sessionItem?.session_type || 'مرافعة',
      outcome: sessionItem?.outcome || 'scheduled',
      notes: sessionItem?.notes || '',
    },
  })

  // Watch date for working days warning
  const watchedDate = form.watch('session_date')
  const isNonWorkingDay = watchedDate && workingDays.length > 0 && (() => {
    const date = new Date(watchedDate)
    const dayIndex = getDay(date)
    return !workingDays.includes(DAY_NAMES[dayIndex])
  })()

  useEffect(() => {
    form.reset({
      case_id: sessionItem?.case_id || preselectedCaseId || '',
      session_date: sessionItem?.session_date || '',
      session_time: sessionItem?.session_time || '',
      court: sessionItem?.court || '',
      hall: sessionItem?.hall || '',
      session_type: sessionItem?.session_type || 'مرافعة',
      outcome: sessionItem?.outcome || 'scheduled',
      notes: sessionItem?.notes || '',
    })
  }, [sessionItem, preselectedCaseId, form])

  async function onSubmit(values: z.infer<typeof sessionSchema>) {
    setIsSubmitting(true)
    let error = null
    
    if (isEditing) {
      const result = await updateSessionAction(sessionItem.id, values)
      error = result.error
    } else {
      const result = await createSessionAction(values)
      error = result.error
    }
    
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(isEditing ? 'تم تحديث الجلسة بنجاح' : 'تمت إضافة الجلسة بنجاح')
    onOpenChange(false)
    form.reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/8 dark:border-zinc-800">
          <DialogTitle className="text-lg font-bold text-[#0F1724] dark:text-zinc-100">
            {isEditing ? 'تعديل بيانات الجلسة' : 'إضافة جلسة أو موعد جديد'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#8B939A]">
            أدخل تاريخ ومكان انعقاد الجلسة لارتباطها بالقضية.
          </DialogDescription>
          <div className="h-[2px] bg-gradient-to-l from-[#C9A84C] via-[#C9A84C]/50 to-transparent mt-3 rounded-full" />
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 py-5 pb-4">
              {/* Section: القضية */}
              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">القضية المرتبطة *</FormLabel>
                    <Select 
                      disabled={isSubmitting || !!preselectedCaseId} 
                      onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                      value={field.value || undefined} >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
                          <SelectValue placeholder="اختر القضية">
                            {field.value && field.value !== '__none__' 
                              ? `${cases.find(c => c.id === field.value)?.case_number} - ${cases.find(c => c.id === field.value)?.title}`
                              : "اختر القضية"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cases.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="font-mono text-xs text-muted-foreground me-2">[{c.case_number}]</span>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Divider */}
              <div className="border-t border-dashed border-black/8 dark:border-zinc-800" />

              {/* Section: التوقيت */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="session_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">تاريخ الجلسة *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          dir="ltr"
                          className={`text-right rtl:text-left h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700 ${isNonWorkingDay ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                          disabled={isSubmitting} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      {isNonWorkingDay && (
                        <div className="flex items-center gap-2 mt-1.5 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-medium leading-none">تنبيه: هذا اليوم خارج أيام العمل الرسمية المحددة للمكتب.</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="session_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">وقت الجلسة</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          dir="ltr"
                          className="text-right rtl:text-left h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700"
                          disabled={isSubmitting} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section: النوع والحالة */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="session_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">نوع الجلسة *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">حالة الجلسة *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
                            <SelectValue>
                              {field.value ? statusMap[field.value] : "حالة الجلسة"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map(t => <SelectItem key={t} value={t}>{statusMap[t]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-black/8 dark:border-zinc-800" />

              {/* Section: المكان */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="court"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">المحكمة / الجهة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: المحكمة العمالية" className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" disabled={isSubmitting} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">تحديد القاعة / الفرع</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: قاعة 3" className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" disabled={isSubmitting} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">الطلبات / مذكرات / ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ما المطلوب في هذه الجلسة؟" 
                        className="resize-none bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" 
                        rows={3}
                        disabled={isSubmitting} 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Divider */}
              <div className="border-t border-dashed border-black/8 dark:border-zinc-800" />

              {/* Attachments — Info Note */}
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  📎 لرفع المرفقات والمستندات، توجّه إلى صفحة تفاصيل الجلسة
                </span>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="flex gap-2 px-6 py-4 border-t border-black/8 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 justify-end shrink-0 rounded-b-xl">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="border-black/8">
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="bg-[#C9A84C] hover:bg-[#b89a42] text-[#1A2744] font-semibold"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الجلسة'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
