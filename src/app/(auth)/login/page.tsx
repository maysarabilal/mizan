'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { loginSchema } from '@/lib/validations/auth'
import { signIn } from '@/lib/actions/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export default function LoginPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true)
    const { data, error } = await signIn(values)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم تسجيل الدخول بنجاح')
    if (data?.redirect) {
      router.push(data.redirect)
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full rounded-xl bg-l-navy border border-l-gold/20 p-8 shadow-l-gold shadow-sm">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gradient-l-gold font-cormorant">تسجيل الدخول</h1>
        <p className="text-sm text-l-muted">أهلاً بك مجدداً في ميزان</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-l-text">كلمة المرور</FormLabel>
                  <Link href="/forgot-password" title="نسيت كلمة المرور؟" className="text-xs text-l-gold hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" dir="ltr" className="text-right rtl:text-left bg-l-charcoal border-l-gold/15 text-l-text focus:border-l-gold" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-2 bg-gradient-l-gold text-l-navy hover:brightness-110" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-white/60">ليس لديك حساب؟</span>{' '}
        <Link href="/register" className="font-bold text-l-gold hover:text-l-gold-light transition-colors underline underline-offset-4 decoration-l-gold/30">
          أنشئ حسابك الآن
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
