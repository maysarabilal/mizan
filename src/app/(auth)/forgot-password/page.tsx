'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { resetPassword } from '@/lib/actions/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setIsSubmitting(true)
    const { error } = await resetPassword(values)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 w-full rounded-xl bg-white p-8 shadow-sm border dark:bg-zinc-900 dark:border-zinc-800 text-center">
        <h1 className="text-xl font-bold tracking-tight text-primary">تم إرسال الرابط</h1>
        <p className="text-sm text-muted-foreground">
          لقد قمنا بإرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى مراجعة صندوق الوارد الخاص بك.
        </p>
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full mt-4">العودة لتسجيل الدخول</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full rounded-xl bg-white p-8 shadow-sm border dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">استعادة كلمة المرور</h1>
        <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور</p>
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

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  )
}
