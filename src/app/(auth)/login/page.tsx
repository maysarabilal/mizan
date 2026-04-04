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
    <div className="flex flex-col gap-6 w-full rounded-xl bg-white p-8 shadow-sm border dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">تسجيل الدخول - ميزان</h1>
        <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني وكلمة المرور للولوج لحسابك</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" type="email" dir="ltr" className="text-right rtl:text-left" disabled={isSubmitting} {...field} />
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
                  <FormLabel>كلمة المرور</FormLabel>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" dir="ltr" className="text-right rtl:text-left" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'جاري التحقق...' : 'دخول'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          سجل مكتباً جديداً
        </Link>
      </div>
    </div>
  )
}
