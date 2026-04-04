'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { profileSchema } from '@/lib/validations/profile'
import { updateProfileAction } from '@/lib/actions/profile'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Save } from 'lucide-react'

interface ProfileFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData.full_name || '',
      phone: initialData.phone || '',
    },
  })

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsSubmitting(true)
    const { error } = await updateProfileAction(values)
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم حفظ التعديلات بنجاح')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        
        <FormItem>
          <FormLabel>البريد الإلكتروني</FormLabel>
          <FormControl>
            <Input 
              value={initialData.email || ''} 
              disabled 
              dir="ltr"
              className="bg-muted/50 cursor-not-allowed text-left max-w-sm" 
            />
          </FormControl>
          <FormDescription>
            هذا الحساب مرتبط بهذا البريد الإلكتروني. لا يمكن تغييره.
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسمك الكريم..." disabled={isSubmitting} className="max-w-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الهاتف</FormLabel>
              <FormControl>
                <Input 
                  placeholder="مثال: 05xxxxxxxxx" 
                  dir="ltr" 
                  className="max-w-sm text-right rtl:text-left" 
                  disabled={isSubmitting} 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : <><Save className="me-2 h-4 w-4" /> حفظ التعديلات</>}
          </Button>
        </div>
      </form>
    </Form>
  )
}
