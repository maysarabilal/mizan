'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { 
  Calendar, 
  User, 
  Briefcase, 
  Tag, 
  Activity, 
  Type, 
  AlignLeft,
  ChevronDown,
  Loader2
} from 'lucide-react'

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
import { Trash2 } from 'lucide-react'
import { deleteTaskAction } from '@/lib/actions/tasks'

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
    setIsSubmitting(true)
    const result = isEditing 
      ? await updateTaskAction(taskItem.id, values)
      : await createTaskAction(values)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(isEditing ? 'تم تحديث المهمة بنجاح' : 'تم إنشاء المهمة بنجاح')
    form.reset()
    onOpenChange(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!taskItem?.id) return
    if (!confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) return

    setIsSubmitting(true)
    const { error } = await deleteTaskAction(taskItem.id)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم حذف المهمة')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0 border-none shadow-2xl overflow-hidden rounded-2xl bg-white">
        
        {/* Header - Digital Atelier Style */}
        <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-[#1a2744] to-[#2a3a5a] text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {isEditing ? 'تعديل تفاصيل المهمة' : 'إضافة مهمة جديدة'}
          </DialogTitle>
          <DialogDescription className="text-slate-300 mt-2 text-sm leading-relaxed">
            {isEditing 
              ? 'قم بتحديث المعلومات والمسؤوليات الخاصة بهذه المهمة لضمان دقة التنفيذ.'
              : 'أدخل تفاصيل المهمة الجديدة، حدد أولويتها، وقم بإسنادها للفرد المناسب من فريقك.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
              
              {/* Task Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                      <Type className="h-4 w-4 text-[#C9A84C]" />
                      عنوان المهمة
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Input 
                          placeholder="مثال: مراجعة مسودة عقد الإيجار..." 
                          disabled={isSubmitting} 
                          className="bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all rounded-xl h-11"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-[#C9A84C]" />
                      الوصف والتعليمات
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أضف تفاصيل إضافية أو ملاحظات خاصة للمكلف بالمهمة..."
                        className="resize-none bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all rounded-xl min-h-[100px]"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#C9A84C]" />
                        الحالة التشغيلية
                      </FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl h-11 focus:ring-[#C9A84C] focus:border-[#C9A84C]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200">
                          {STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value} className="focus:bg-[#C9A84C]/10 focus:text-[#92741F] cursor-pointer">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#C9A84C]" />
                        مستوى الأهمية
                      </FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl h-11 focus:ring-[#C9A84C] focus:border-[#C9A84C]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200">
                          {PRIORITIES.map(s => (
                            <SelectItem key={s.value} value={s.value} className="focus:bg-[#C9A84C]/10 focus:text-[#92741F] cursor-pointer">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Due Date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#C9A84C]" />
                      الموعد النهائي (Due Date)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="date"
                          dir="ltr"
                          className="text-right rtl:text-left bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all rounded-xl h-11"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-5 pt-2 border-t border-slate-100 mt-4">
                {/* Assigned User */}
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-[#C9A84C]" />
                        المكلف بالعمل
                      </FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                        value={field.value ?? '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 shadow-sm border-dashed border-2 hover:border-[#C9A84C] transition-colors">
                            <SelectValue placeholder="غير معين">
                              {field.value
                                ? teamMembers.find(m => m.user_id === field.value)?.profiles?.full_name
                                : "بانتظار التكليف..."}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="__none__" className="text-slate-400">— بدون تكليف حالياً —</SelectItem>
                          {teamMembers.map(member => (
                            <SelectItem key={member.user_id} value={member.user_id} className="focus:bg-[#C9A84C]/10 focus:text-[#92741F] cursor-pointer">
                              {member.profiles?.full_name || 'مستخدم غير معروف'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Related Case */}
                <FormField
                  control={form.control}
                  name="case_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#C9A84C]" />
                        الارتباط بملف قضية
                      </FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                        value={field.value ?? '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 shadow-sm border-dashed border-2 hover:border-[#C9A84C] transition-colors">
                            <SelectValue placeholder="غير مرتبطة">
                              {field.value
                                ? cases.find(c => c.id === field.value)?.title
                                : "مهمة إدارية عامة"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="__none__" className="text-slate-400">— لا ترتبط بقضية معينة —</SelectItem>
                          {cases.map(c => (
                            <SelectItem key={c.id} value={c.id} className="focus:bg-[#C9A84C]/10 focus:text-[#92741F] cursor-pointer">
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </form>
          </Form>
        </div>
        
        {/* Footer - Digital Atelier Buttons */}
        <div className="flex gap-3 p-6 px-8 border-t bg-slate-50/80 justify-end shrink-0">
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-4 ml-auto"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
            </Button>
          )}
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl px-6"
          >
            إغلاق
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            onClick={form.handleSubmit(onSubmit)}
            className="bg-[#1a2744] hover:bg-[#2a3a5a] text-white rounded-xl px-8 min-w-[140px] shadow-lg shadow-[#1a2744]/20 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </div>
            ) : (
              isEditing ? 'تحديث المهمة' : 'إنشاء المهمة'
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
