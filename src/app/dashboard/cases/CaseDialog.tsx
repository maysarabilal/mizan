'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { FileCheck, FilePlus, FileUp } from 'lucide-react'

import { caseSchema } from '@/lib/validations/cases'
import { createCaseAction, updateCaseAction, checkConflictOfInterest } from '@/lib/actions/cases'
import { Database } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'


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
      opposing_party: caseItem?.opposing_party || '',
    },
  })

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
      opposing_party: caseItem?.opposing_party || '',
    })
  }, [caseItem, form])

  const handleOpposingPartyBlur = async () => {
    const opposingParty = form.getValues('opposing_party')
    if (!opposingParty || opposingParty.trim().length < 2) return

    const officeId = caseItem?.office_id || clients[0]?.office_id
    if (!officeId) return

    const { data, error } = await checkConflictOfInterest(opposingParty, officeId)
    if (error) {
      console.error(error)
      return
    }

    if (data?.hasConflict && data.matchedClient) {
      toast.warning(
        `تنبيه تضارب مصالح: اسم الخصم مشابه لاسم عميل مسجل بالمكتب (${data.matchedClient.name})`,
        { duration: 6000 }
      )
    }
  }

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
      <DialogContent className="sm:max-w-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/8 dark:border-zinc-800">
          <DialogTitle className="text-lg font-bold text-[#0F1724] dark:text-zinc-100">
            {isEditing ? 'تعديل بيانات القضية' : 'إضافة قضية جديدة'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#8B939A]">
            أدخل البيانات الأساسية للقضية للبدء في تتبعها.
          </DialogDescription>
          <div className="h-[2px] bg-gradient-to-l from-[#C9A84C] via-[#C9A84C]/50 to-transparent mt-3 rounded-full" />
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 py-5 pb-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">موضوع القضية *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مطالبة مالية بموجب شيك" className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Client + Case number */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">الموكل (العميل) *</FormLabel>
                      <Select 
                        disabled={isSubmitting} 
                        onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                        value={field.value || undefined} 
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
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
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">رقم القضية (في المحكمة)</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: 145/2026" dir="ltr" className="text-right rtl:text-left h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" disabled={isSubmitting} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Opposing Party */}
              <FormField
                control={form.control}
                name="opposing_party"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">الخصم (الطرف الآخر)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="اسم الخصم..." 
                        className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" 
                        disabled={isSubmitting} 
                        {...field} 
                        value={field.value || ''}
                        onBlur={(e) => {
                          field.onBlur()
                          const value = e.target.value.trim()
                          if (value.length >= 2) {
                            const match = clients.find(client =>
                              client.name.toLowerCase().includes(value.toLowerCase()) ||
                              value.toLowerCase().includes(client.name.toLowerCase())
                            )
                            if (match) {
                              toast.warning(
                                `⚠️ تنبيه تضارب مصالح: "${match.name}" مسجل كعميل في المكتب. يرجى مراجعة المحامي المسؤول.`,
                                { duration: 6000 }
                              )
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Divider */}
              <div className="border-t border-dashed border-black/8 dark:border-zinc-800" />

              {/* Type + Status + Priority + Degree */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="case_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">النوع *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
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
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">الحالة *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
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
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">الأهمية *</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value} >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
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
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">الدرجة</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value ?? undefined} >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
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

              {/* Assigned lawyer */}
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">تعيين لمحامي</FormLabel>
                      <Select 
                        disabled={isSubmitting} 
                        onValueChange={(val) => field.onChange(val === '__none__' ? null : val)} 
                        value={field.value || undefined} 
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700">
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

              {/* Divider */}
              <div className="border-t border-dashed border-black/8 dark:border-zinc-800" />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724] dark:text-zinc-200">ملاحظات إضافية</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="تفاصيل، وقائع، ملاحظات..." 
                        className="resize-none bg-slate-50 dark:bg-zinc-900 border-black/8 dark:border-zinc-700" 
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

              {/* Divider */}
              <div className="border-t border-dashed border-black/8 dark:border-zinc-800" />

              {/* Attachments — Info Note */}
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  📎 لرفع المرفقات والمستندات، توجّه إلى صفحة تفاصيل القضية
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
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ القضية'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
