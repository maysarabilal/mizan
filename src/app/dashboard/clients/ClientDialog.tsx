'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Camera, User } from 'lucide-react'

import { clientSchema } from '@/lib/validations/clients'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'
import { Database } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!client

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      phone: client?.phone || '',
      email: client?.email || '',
      id_number: client?.id_number || '',
      address: client?.address || '',
      notes: client?.notes || '',
    },
  })

  useEffect(() => {
    form.reset({
      name: client?.name || '',
      phone: client?.phone || '',
      email: client?.email || '',
      id_number: client?.id_number || '',
      address: client?.address || '',
      notes: client?.notes || '',
    })
  }, [client, form])

  async function onSubmit(values: z.infer<typeof clientSchema>) {
    setIsSubmitting(true)
    
    let error = null
    if (isEditing) {
      const result = await updateClientAction(client.id, values)
      error = result.error
    } else {
      const result = await createClientAction(values)
      error = result.error
    }
    
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(isEditing ? 'تم تحديث بيانات العميل بنجاح' : 'تمت إضافة العميل بنجاح')
    onOpenChange(false)
    form.reset()
    router.refresh()
  }

  const clientInitials = client?.name
    ? client.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/8">
          <DialogTitle className="text-lg font-bold text-[#0F1724]">
            {isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#8B939A]">
            أدخل البيانات الأساسية للعميل للبدء في تتبعها.
          </DialogDescription>
          <div className="h-[2px] bg-gradient-to-l from-[#C9A84C] via-[#C9A84C]/50 to-transparent mt-3 rounded-full" />
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 py-5 pb-4">
              
              {/* Avatar Placeholder */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-[#F0EAD6] flex items-center justify-center border-2 border-[#C9A84C]/20">
                    {client?.avatar_url ? (
                      <img src={client.avatar_url} alt={client.name} className="w-20 h-20 rounded-full object-cover" />
                    ) : clientInitials ? (
                      <span className="text-[22px] font-bold text-[#3B3A33]">{clientInitials}</span>
                    ) : (
                      <User className="h-8 w-8 text-[#9AA3B2]" />
                    )}
                  </div>
                  {/* Upload overlay — disabled placeholder */}
                  <button
                    type="button"
                    disabled
                    title="قريباً — رفع صورة العميل يتطلب إعداد Supabase Storage"
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                  <span className="absolute -bottom-1 -left-1 bg-[#C9A84C]/20 text-[#C9A84C] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#C9A84C]/30">
                    قريباً
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-black/[0.06]" />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724]">اسم العميل *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="الاسم الكامل للعميل أو الشركة"
                        disabled={isSubmitting}
                        className="h-10 bg-slate-50 border-black/8"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ID Number + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724]">رقم الهوية</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: 012345678"
                          dir="ltr"
                          className="h-10 bg-slate-50 border-black/8 text-right"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value || ''}
                        />
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
                      <FormLabel className="text-[13px] font-semibold text-[#0F1724]">رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0500000000"
                          dir="ltr"
                          className="h-10 bg-slate-50 border-black/8 text-right"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724]">البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        dir="ltr"
                        className="h-10 bg-slate-50 border-black/8 text-right"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724]">عنوان السكن</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="المدينة، الشارع، رقم المبنى..."
                        className="h-10 bg-slate-50 border-black/8"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Divider */}
              <div className="h-px bg-black/[0.06]" />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#0F1724]">ملاحظات إضافية</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="تفاصيل، وقائع، ملخّصات..." 
                        className="resize-none bg-slate-50 border-black/8 min-h-[80px]" 
                        rows={3}
                        disabled={isSubmitting} 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-black/8 bg-slate-50 justify-end shrink-0 rounded-b-xl">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="border-black/8">
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="bg-[#C9A84C] hover:bg-[#b89a42] text-[#1A2744] font-semibold"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ العميل'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
