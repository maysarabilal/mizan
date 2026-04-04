'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { sessionSchema } from '@/lib/validations/sessions'
import { createSessionAction, updateSessionAction } from '@/lib/actions/sessions'
import { Database } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type SessionRow = Database['public']['Tables']['sessions']['Row']
type CaseRow = Database['public']['Tables']['cases']['Row']

interface SessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionItem?: SessionRow | null
  cases: CaseRow[]
  preselectedCaseId?: string
}

const SESSION_TYPES = ['مرافعة', 'نطق بالحكم', 'استجواب', 'تقديم مستندات', 'خبرة', 'أخرى']
const STATUSES = ['scheduled', 'completed', 'postponed', 'cancelled']

const statusMap: Record<string, string> = {
  'scheduled': 'مجدولة',
  'completed': 'مكتملة',
  'postponed': 'مؤجلة',
  'cancelled': 'ملغاة'
}

export function SessionDialog({ open, onOpenChange, sessionItem, cases, preselectedCaseId }: SessionDialogProps) {
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
      <DialogContent className="sm:max-w-[500px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle>{isEditing ? 'تعديل بيانات الجلسة' : 'إضافة جلسة أو موعد جديد'}</DialogTitle>
          <DialogDescription>
            أدخل تاريخ ومكان انعقاد الجلسة لارتباطها بالقضية.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4 pb-20 mt-2">
              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القضية المرتبطة *</FormLabel>
                    <Select 
                      disabled={isSubmitting || !!preselectedCaseId} 
                      onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                      value={field.value || undefined} >
                      <FormControl>
                        <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="session_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الجلسة *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          dir="ltr"
                          className="text-right rtl:text-left"
                          disabled={isSubmitting} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="session_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وقت الجلسة</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          dir="ltr"
                          className="text-right rtl:text-left"
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="session_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الجلسة *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>حالة الجلسة *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="court"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المحكمة / الجهة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: المحكمة العمالية" disabled={isSubmitting} {...field} value={field.value || ''} />
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
                      <FormLabel>تحديد القاعة / الفرع</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: قاعة 3" disabled={isSubmitting} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطلبات / مذكرات / ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ما المطلوب في هذه الجلسة؟" 
                        className="resize-none" 
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
            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex gap-2 p-6 border-t bg-muted/20 justify-end shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الجلسة'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
