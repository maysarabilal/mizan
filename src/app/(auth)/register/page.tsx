'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { registerSchema } from '@/lib/validations/auth'
import { signUp } from '@/lib/actions/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export default function RegisterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', full_name: '' },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsSubmitting(true)
    const { error } = await signUp(values)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم إنشاء الحساب بنجاح. يرجى توجيهك لإعداد المكتب...')
    router.push('/setup')    
  }

  return (
    <div className="flex flex-col gap-6 w-full rounded-xl bg-l-navy border border-l-gold/20 p-8 shadow-l-gold shadow-sm">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gradient-l-gold font-cormorant">تسجيل حساب جديد</h1>
        <p className="text-sm text-l-muted">انضم إلى ميزان لإدارة مكتبك بكفاءة</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-l-text">الاسم الكامل</FormLabel>
                <FormControl>
                  <Input placeholder="الاسم رباعي" className="bg-l-charcoal border-l-gold/15 text-l-text focus:border-l-gold" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-l-text">البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" type="email" dir="ltr" className="text-right rtl:text-left bg-l-charcoal border-l-gold/15 text-l-text focus:border-l-gold" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-l-text">كلمة المرور</FormLabel>
                <FormControl>
                  <Input type="password" dir="ltr" className="text-right rtl:text-left bg-l-charcoal border-l-gold/15 text-l-text focus:border-l-gold" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-l-text">تأكيد كلمة المرور</FormLabel>
                <FormControl>
                  <Input type="password" dir="ltr" className="text-right rtl:text-left bg-l-charcoal border-l-gold/15 text-l-text focus:border-l-gold" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-2 bg-gradient-l-gold text-l-navy hover:brightness-110" disabled={isSubmitting}>
            {isSubmitting ? 'جاري التسجيل...' : 'تسجيل حساب'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-white/60">لديك حساب بالفعل؟</span>{' '}
        <Link href="/login" className="font-bold text-l-gold hover:text-l-gold-light transition-colors underline underline-offset-4 decoration-l-gold/30">
          سجل الدخول من هنا
        </Link>
      </div>

      <div className="flex justify-center pt-2">
        <Link href="/" className="flex items-center gap-2 text-xs text-l-gold/70 hover:text-l-gold transition-colors">
          <span>العودة للرئيسية</span>
          <span className="rotate-180">&#10140;</span>
        </Link>
      </div>
    </div>
  )
}
