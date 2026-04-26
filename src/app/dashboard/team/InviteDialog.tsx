'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Copy, RefreshCw, AlertTriangle, UserPlus, CheckCircle2 } from 'lucide-react'

import { inviteSchema, INVITE_ROLES, ROLE_LABELS } from '@/lib/validations/team'
import { generateInviteCodeAction } from '@/lib/actions/team'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface InviteDialogProps {
  open: boolean
}

export function InviteDialog({ open }: InviteDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [copied, setCopied] = useState(false)

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'lawyer', email: '' }
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
      setCopied(true)
      toast.success('تم نسخ الكود للحافظة')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      router.replace('/dashboard/team')
      setTimeout(() => {
        setGeneratedCode(null)
        setLimitReached(false)
        setCopied(false)
        form.reset()
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Gold accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#C9A84C] via-[#e8c96a] to-[#C9A84C] shrink-0" />

        <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[17px] font-bold text-[#0F1724]">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-[#C9A84C]" />
            </div>
            توجيه دعوة انضمام
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#9AA3B2]">
            {limitReached
              ? 'تنبيه: وصلت للحد الأقصى لخطتك الحالية'
              : 'اختر صلاحية العضو الجديد وأنشئ كود الانضمام.'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {limitReached ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in-50">
              <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#0F1724]">وصلت الحد الأقصى لخطتك</h3>
                <p className="text-[13px] text-[#8B939A] mt-1.5 max-w-[300px] leading-relaxed">
                  لا يمكنك إصدار دعوات إضافية. تحتاج لترقية خطتك لإضافة مستخدمين جدد.
                </p>
              </div>
              <Link href="/dashboard/subscription" className="w-full max-w-[240px]">
                <button className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#b8973e] text-white font-semibold text-[14px] rounded-lg transition-colors">
                  طلب ترقية الخطة
                </button>
              </Link>
            </div>
          ) : !generatedCode ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {/* Role select */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724]">
                        دور العضو الجديد <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-black/[0.10] focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]">
                            <SelectValue placeholder="اختر الدور" />
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

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724]">
                        البريد الإلكتروني
                        <span className="text-[#9AA3B2] font-normal ms-1">(اختياري)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="example@email.com"
                          className="border-black/[0.10] focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
                          dir="ltr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Roles explanation */}
                <div className="bg-[#F8F9FB] border border-black/[0.06] rounded-lg p-3.5">
                  <p className="text-[11px] font-semibold text-[#6B7280] mb-2">ملخص الأدوار:</p>
                  <ul className="space-y-1.5">
                    {[
                      { role: 'admin', desc: 'إدارة الفريق والقضايا بدون الاشتراكات' },
                      { role: 'lawyer', desc: 'إدارة كاملة للقضايا والجلسات' },
                      { role: 'secretary', desc: 'إدخال بيانات بدون صلاحية الحذف' },
                      { role: 'trainee', desc: 'عرض وإضافة مهام تحت الإشراف' },
                    ].map(item => (
                      <li key={item.role} className="flex items-start gap-1.5 text-[12px]">
                        <span className="font-semibold text-[#0F1724] shrink-0">{ROLE_LABELS[item.role as keyof typeof ROLE_LABELS]}:</span>
                        <span className="text-[#8B939A]">{item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </form>
            </Form>
          ) : (
            /* Generated Code View */
            <div className="flex flex-col gap-4 animate-in fade-in-50">
              <div className="bg-[#FDFCF7] border border-[#C9A84C]/30 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                <p className="text-[13px] font-medium text-[#8B939A]">كود الانضمام (صالح 7 أيام)</p>
                <span className="text-[36px] font-black tracking-[0.2em] text-[#C9A84C] font-mono">
                  {generatedCode}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/40 text-[#C9A84C] text-[13px] font-semibold rounded-lg hover:bg-[#C9A84C]/10 transition-colors"
                >
                  {copied
                    ? <><CheckCircle2 className="h-4 w-4" /> تم النسخ!</>
                    : <><Copy className="h-4 w-4" /> نسخ الكود</>
                  }
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-[12px] text-amber-800 leading-relaxed">
                <strong>تنبيه:</strong> أرسل هذا الكود للعضو. سيحتاج لإدخاله في صفحة إعداد المكتب عند التسجيل.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-black/[0.08] bg-[#F8F9FB] shrink-0">
          <button
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 text-[13px] font-medium text-[#6B7280] bg-white border border-black/[0.10] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            {generatedCode ? 'إغلاق' : 'إلغاء'}
          </button>
          {!generatedCode && !limitReached && (
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-white bg-[#C9A84C] hover:bg-[#b8973e] rounded-lg transition-colors disabled:opacity-60"
            >
              {isSubmitting
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> جاري الإنشاء...</>
                : 'توليد الكود'
              }
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
