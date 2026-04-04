'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { taskSchema } from '@/lib/validations/tasks'
import { createTaskAction, updateTaskAction } from '@/lib/actions/tasks'
import { Database } from '@/types/database'
import { STATUS_LABELS, PRIORITY_LABELS, AppStatus, AppPriority } from '@/lib/constants/enums'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type TaskRowExt = Database['public']['Tables']['tasks']['Row'] & { 
  cases?: { title: string } | null,
  assigned_user?: { full_name: string } | null
}
type CaseRow = Database['public']['Tables']['cases']['Row']
type TeamMember = {
  user_id: string
  profiles: { full_name: string } | null
}

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskItem?: TaskRowExt | null
  cases: CaseRow[]
  teamMembers: TeamMember[]
  defaultStatus?: string
}

const STATUSES = (Object.keys(STATUS_LABELS) as AppStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

const PRIORITIES = (Object.keys(PRIORITY_LABELS) as AppPriority[]).map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))

export function TaskDialog({ open, onOpenChange, taskItem, cases, teamMembers, defaultStatus }: TaskDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!taskItem

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: (defaultStatus || 'todo') as 'todo' | 'in_progress' | 'done',
      due_date: '',
      assigned_to: null,
      case_id: null,
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      title: taskItem?.title || '',
      description: taskItem?.description || '',
      status: (taskItem?.status || defaultStatus || 'todo'),
      priority: taskItem?.priority || 'medium',
      due_date: taskItem?.due_date || '',
      assigned_to: taskItem?.assigned_to || null,
      case_id: taskItem?.case_id || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }, [open, taskItem, defaultStatus, form])

  async function onSubmit(values: z.infer<typeof taskSchema>) {
    if (isEditing) {
      setIsSubmitting(true)
      const result = await updateTaskAction(taskItem.id, values)
      setIsSubmitting(false)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('تم تحديث المهمة بنجاح')
      form.reset()
      onOpenChange(false)
      router.refresh()
      return
    }

    setIsSubmitting(true)
    const { error } = await createTaskAction(values)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم إنشاء المهمة بنجاح')
    form.reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle>{isEditing ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المهمة وتعيينها لفريق العمل وارتباطها بقضية معينة.
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
                    <FormLabel>عنوان المهمة *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مراجعة مستندات الاستئناف" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف والتفاصيل</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أضف تفاصيل وتعليمات إضافية حول المهمة..."
                        className="resize-none"
                        rows={3}
                        disabled={isSubmitting}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة *</FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
                          {PRIORITIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ استحقاق المهمة</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        dir="ltr"
                        className="text-right rtl:text-left"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعيين لمحامي / إداري</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                      value={field.value ?? '__none__'} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="غير معين">
                            {field.value
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
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ربط بقضية</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                      value={field.value ?? '__none__'} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="غير مرتبطة">
                            {field.value
                              ? cases.find(c => c.id === field.value)?.title
                              : "غير مرتبطة"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— لا يوجد —</SelectItem>
                        {cases.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ المهمة'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
