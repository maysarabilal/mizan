'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createOfficeSchema, joinOfficeSchema } from '@/lib/validations/onboarding'
import { createOfficeWithTrial, joinOfficeWithCode } from '@/lib/actions/onboarding'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SetupClient() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const createForm = useForm<z.infer<typeof createOfficeSchema>>({
    resolver: zodResolver(createOfficeSchema),
    defaultValues: { office_name: '', plan_slug: 'individual' },
  })

  const joinForm = useForm<z.infer<typeof joinOfficeSchema>>({
    resolver: zodResolver(joinOfficeSchema),
    defaultValues: { invite_code: '' },
  })

  async function onCreateSubmit(values: z.infer<typeof createOfficeSchema>) {
    setIsCreating(true)
    const { error } = await createOfficeWithTrial(values)
    setIsCreating(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم إنشاء المكتب بنجاح! جاري التوجيه...')
    // Use window.location as a fail-safe for hard refresh if router is busy
    router.refresh()
    router.push('/dashboard')
  }

  async function onJoinSubmit(values: z.infer<typeof joinOfficeSchema>) {
    setIsJoining(true)
    const { error } = await joinOfficeWithCode(values)
    setIsJoining(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم الانضمام للمكتب بنجاح! جاري التوجيه...')
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-6 w-full rounded-xl bg-white p-6 shadow-sm border dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">إعداد المكتب</h1>
        <p className="text-sm text-muted-foreground">قم بإنشاء مكتب جديد أو انضم لمكتب موجود مسبقاً</p>
      </div>

      <Tabs defaultValue="create" className="w-full mt-4" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">تأسيس مكتب</TabsTrigger>
          <TabsTrigger value="join">انضمام بموجب دعوة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-6">
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
              <FormField
                control={createForm.control}
                name="office_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المكتب / الشركة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مكتب العدالة للمحاماة" disabled={isCreating} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3">
                <FormLabel>اختر باقة البداية (7 أيام تجربة مجانية)</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { slug: 'individual', name: 'فردي', price: '149' },
                    { slug: 'office', name: 'مكتب', price: '349' },
                    { slug: 'institution', name: 'مؤسسة', price: '699' }
                  ].map((plan) => (
                    <div 
                      key={plan.slug}
                      onClick={() => createForm.setValue('plan_slug', plan.slug)}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        createForm.watch('plan_slug') === plan.slug 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-zinc-100 hover:border-zinc-200 text-zinc-600'
                      }`}
                    >
                      <span className="font-bold">{plan.name}</span>
                      <span className="text-xs">{plan.price} ₪ / شهر</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isCreating}>
                {isCreating ? 'جاري التأسيس...' : 'تأسيس المكتب (تجربة مجانية)'}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="join" className="mt-6">
          <Form {...joinForm}>
            <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="flex flex-col gap-4">
              <FormField
                control={joinForm.control}
                name="invite_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز الدعوة</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الرمز المكون من 6 أحرف" dir="ltr" className="text-center tracking-[0.3em] font-mono text-lg uppercase" disabled={isJoining} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2" variant="secondary" disabled={isJoining}>
                {isJoining ? 'جاري التحقق...' : 'انضمام'}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
