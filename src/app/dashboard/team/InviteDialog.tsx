'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Copy, RefreshCw, AlertTriangle } from 'lucide-react'

import { inviteSchema, INVITE_ROLES, ROLE_LABELS } from '@/lib/validations/team'
import { generateInviteCodeAction } from '@/lib/actions/team'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface InviteDialogProps {
  open: boolean
}

export function InviteDialog({ open }: InviteDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'lawyer' }
  })

  async function onSubmit(values: z.infer<typeof inviteSchema>) {
    setIsSubmitting(true)
    const result = await generateInviteCodeAction(values)
    setIsSubmitting(false)

    if (result.error) {
      if (result.error === 'MEMBER_LIMIT_REACHED') {
        setLimitReached(true)
      } else {
        toast.error(result.error)
      }
      return
    }

    if (result.data?.code) {
      setGeneratedCode(result.data.code)
      toast.success('تم توليد كود الدعوة بنجاح')
      router.refresh()
    }
  }

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      toast.success('تم نسخ الكود للحافظة')
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      router.replace('/dashboard/team')
      setTimeout(() => {
        setGeneratedCode(null)
        setLimitReached(false)
        form.reset()
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" >
        <DialogHeader>
          <DialogTitle>توجيه دعوة انضمام للمكتب</DialogTitle>
          <DialogDescription>
            {limitReached 
              ? 'تنبيه محدودية حساب المكتب'
              : 'اختر صلاحية العضو الجديد. سيتم توليد كود انضمام فريد يمكنه استخدامه عند التسجيل.'}
          </DialogDescription>
        </DialogHeader>

        {limitReached ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">وصلت الحد الأقصى لخطتك الحالية</h3>
            <p className="text-sm text-zinc-400 max-w-[300px]">
              لا يمكنك إصدار دعوات إضافية بناءً على سعة اشتراكك الحالي. تحتاج إلى ترقية مساحة الأعضاء لمتابعة إضافة مستخدمين جدد للنظام.
            </p>
            
            <div className="w-full mt-2">
              <Link href="/dashboard/subscription" className="w-full max-w-[240px] block mx-auto">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold whitespace-nowrap">
                  طلب ترقية الخطة
                </Button>
              </Link>
            </div>
          </div>
        ) : !generatedCode ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صلاحية ودور العضو الجديد *</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} defaultValue={field.value} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الصلاحية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVITE_ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 text-xs leading-relaxed text-muted-foreground border">
                <strong>تذكير:</strong> 
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>مدير:</strong> إدارة الفريق والقضايا بدون الاشتراكات.</li>
                  <li><strong>محامي:</strong> إدارة كاملة للقضايا والجلسات.</li>
                  <li><strong>سكرتارية:</strong> إدخال بيانات بدون صلاحية الحذف.</li>
                  <li><strong>متدرب:</strong> عرض وإضافة مهام تحت الإشراف.</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><RefreshCw className="me-2 h-4 w-4 animate-spin" /> جاري الإنشاء...</> : 'توليد الكود'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col gap-4 py-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">كود الانضمام الخاص (صالح لمدة 7 أيام)</p>
              <h1 className="text-4xl font-black tracking-widest text-primary font-mono">{generatedCode}</h1>
              <Button variant="outline" size="sm" className="mt-4" onClick={copyToClipboard}>
                <Copy className="me-2 h-4 w-4" /> نسخ الكود
              </Button>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs p-3 rounded-md border border-amber-200 dark:border-amber-900 leading-relaxed">
              <strong>تنبيه:</strong> أرسل هذا الكود للعضو. سيحتاج لإدخاله في صفحة إعداد المكتب عند تسجيله للانضمام التلقائي.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
