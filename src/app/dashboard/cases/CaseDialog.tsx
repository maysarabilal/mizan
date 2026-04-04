'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { caseSchema } from '@/lib/validations/cases'
import { createCaseAction, updateCaseAction } from '@/lib/actions/cases'
import { Database } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type CaseRow = Database['public']['Tables']['cases']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface CaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseItem?: CaseRow | null
  clients: Client[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any[]
}

const CASE_TYPES = ['مدني', 'جنائي', 'تجاري', 'إداري', 'عمالي', 'أسري', 'عقاري', 'أخرى']
const STATUSES = ['جارية', 'معلقة', 'مكتملة', 'في الاستئناف', 'مغلقة']
const PRIORITIES = ['عالية', 'متوسطة', 'منخفضة']
const DEGREES = ['ابتدائي', 'استئناف', 'نقض']

export function CaseDialog({ open, onOpenChange, caseItem, clients, teamMembers }: CaseDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!caseItem

  const form = useForm<z.infer<typeof caseSchema>>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      client_id: caseItem?.client_id || '',
      title: caseItem?.title || '',
      case_number: caseItem?.case_number || '',
      case_type: caseItem?.case_type || 'مدني',
      status: caseItem?.status || 'جارية',
      priority: caseItem?.priority || 'متوسطة',
      litigation_degree: caseItem?.litigation_degree || '',
      assigned_to: caseItem?.assigned_to || '',
      notes: caseItem?.notes || '',
    },
  })

  // Update form if caseItem changes
  useEffect(() => {
    form.reset({
      client_id: caseItem?.client_id || '',
      title: caseItem?.title || '',
      case_number: caseItem?.case_number || '',
      case_type: caseItem?.case_type || 'مدني',
      status: caseItem?.status || 'جارية',
      priority: caseItem?.priority || 'متوسطة',
      litigation_degree: caseItem?.litigation_degree || '',
      assigned_to: caseItem?.assigned_to || '',
      notes: caseItem?.notes || '',
    })
  }, [caseItem, form])

  async function onSubmit(values: z.infer<typeof caseSchema>) {
    setIsSubmitting(true)
    
    let error = null
    if (isEditing) {
      const result = await updateCaseAction(caseItem.id, values)
      error = result.error
    } else {
      const result = await createCaseAction(values)
      error = result.error
    }
    
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(isEditing ? 'تم تحديث بيانات القضية بنجاح' : 'تمت إضافة القضية بنجاح')
    onOpenChange(false)
    form.reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle>{isEditing ? 'تعديل بيانات القضية' : 'إضافة قضية جديدة'}</DialogTitle>
          <DialogDescription>
            أدخل البيانات الأساسية للقضية للبدء في تتبعها.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4 pb-20 mt-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موضوع القضية *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مطالبة مالية بموجب شيك" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموكل (العميل) *</FormLabel>
                      <Select 
                        disabled={isSubmitting} 
                        onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                        value={field.value || undefined} 
                        
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر العميل">
                              {field.value && field.value !== '__none__' 
                                ? clients.find(c => c.id === field.value)?.name 
                                : "اختر العميل"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="case_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم القضية (في المحكمة)</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: 145/2026" dir="ltr" className="text-right rtl:text-left" disabled={isSubmitting} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="case_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>النوع *</FormLabel>
<Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة *</FormLabel>
<Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأهمية *</FormLabel>
<Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="litigation_degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدرجة</FormLabel>
<Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value ?? undefined} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEGREES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعيين لمحامي</FormLabel>
                      <Select 
                        disabled={isSubmitting} 
                        onValueChange={(val) => field.onChange(val === '__none__' ? null : val)} 
                        value={field.value || undefined} 
                        
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="غير معين">
                              {field.value && field.value !== '__none__' 
                                ? teamMembers.find(m => m.user_id === field.value)?.profiles?.full_name 
                                : "غير معين"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">— لا يوجد —</SelectItem>
                          {teamMembers.map(member => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                              {member.profiles?.full_name || 'مستخدم غير معروف'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات إضافية</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="تفاصيل، وقائع، ملاحظات..." 
                        className="resize-none" 
                        rows={4}
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
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ القضية'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
