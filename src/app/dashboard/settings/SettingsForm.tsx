'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { officeSettingsSchema } from '@/lib/validations/settings'
import { updateOfficeSettingsAction } from '@/lib/actions/settings'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'

interface SettingsFormProps {
  office: {
    name: string
    settings: {
      session_reminders?: boolean
      task_completed?: boolean
      subscription_updates?: boolean
    }
  }
}

export function SettingsForm({ office }: SettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof officeSettingsSchema>>({
    resolver: zodResolver(officeSettingsSchema),
    defaultValues: {
      name: office.name || '',
      session_reminders: office.settings?.session_reminders !== false, // Defaults true if missing
      task_completed: office.settings?.task_completed !== false,
      subscription_updates: office.settings?.subscription_updates !== false,
    },
  })

  async function onSubmit(values: z.infer<typeof officeSettingsSchema>) {
    setIsSubmitting(true)
    const { error } = await updateOfficeSettingsAction(values)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم حفظ إعدادات المكتب بنجاح')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-none border-t-0 border-x-0 rounded-none bg-transparent">
          <CardContent className="pt-6 px-0 lg:w-1/2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المكتب / المؤسسة</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المكتب القانوني..." disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormDescription>
                    سيظهر هذا الاسم في جميع المراسلات والفواتير الرسمية.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-none border-t-0 border-x-0 rounded-none bg-transparent">
          <CardContent className="pt-6 px-0 space-y-6 lg:w-1/2">
            <h3 className="text-lg font-semibold text-primary">إشعارات النظام التلقائية</h3>
            <p className="text-sm text-muted-foreground mb-4">قم بتخصيص أنواع التنبيهات التي ترغب أن يستقبلها فريقك.</p>

            <FormField
              control={form.control}
              name="session_reminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-foreground">
                      تذكير الجلسات القادمة
                    </FormLabel>
                    <FormDescription>
                      إرسال إشعار تذكيري قبل ميعاد الجلسة المسجلة بيوم واحد.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      className="data-[state=checked]:bg-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="task_completed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-foreground">
                      تنبيه إنجاز المهام
                    </FormLabel>
                    <FormDescription>
                      إرسال إشعار للمدير والمسؤول عن المهمة عند اكتمالها عبر الموظف.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      className="data-[state=checked]:bg-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscription_updates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-foreground">
                      تحديثات وتنبيهات الاشتراك
                    </FormLabel>
                    <FormDescription>
                      استقبال رسائل حول موعد الاستحقاق والفواتير القادمة.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      className="data-[state=checked]:bg-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4 lg:w-1/2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
            تراجع
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
