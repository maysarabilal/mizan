'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Camera, Save, Loader2, Lock, Phone, Briefcase, User, X } from 'lucide-react'
import Image from 'next/image'

import { profileSchema } from '@/lib/validations/profile'
import { updateProfileAction, uploadAvatar } from '@/lib/actions/profile'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'

// TODO: Future - Per-member billing logic when payment gateway is integrated

interface ProfileFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any
  role: string
}

export function ProfileForm({ initialData, role }: ProfileFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar_url || null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData.full_name || '',
      phone: initialData.phone || '',
      job_title: initialData.job_title || '',
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف يتجاوز 2 ميغابايت')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const { data, error } = await uploadAvatar(formData)
    setIsUploading(false)

    if (error) {
      toast.error(error)
      setAvatarPreview(initialData.avatar_url || null)
      return
    }

    if (data) setAvatarPreview(data)
    toast.success('تم رفع الصورة الشخصية بنجاح')
    router.refresh()
  }

  return (
    <div className="bg-white border border-black/8 rounded-xl shadow-sm overflow-hidden">
      {/* Header with avatar */}
      <div className="bg-gradient-to-l from-[#1A2744] to-[#2A3A5C] p-8 flex flex-col items-center">
        <div className="relative group mb-4">
          <div
            className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center overflow-hidden bg-white/10 cursor-pointer"
            onClick={() => avatarPreview && setPreviewOpen(true)}
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="الصورة الشخصية" width={96} height={96} className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="h-10 w-10 text-white/60" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center shadow-lg hover:bg-[#D4B65C] transition-colors border-2 border-white"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <h2 className="text-xl font-bold text-white">{initialData.full_name || 'مستخدم ميزان'}</h2>
        <Badge className="mt-2 bg-white/15 text-white/90 border-white/20 hover:bg-white/20 text-xs">
          {role}
        </Badge>
      </div>

      {/* Form */}
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

            {/* Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#9AA3B2]" /> الاسم الكامل *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسمك الكريم..." disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (read-only) */}
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#9AA3B2]" /> البريد الإلكتروني
              </FormLabel>
              <FormControl>
                <Input
                  value={initialData.email || ''}
                  disabled
                  dir="ltr"
                  className="bg-[#F9FAFB] cursor-not-allowed text-left"
                />
              </FormControl>
              <FormDescription>
                هذا الحساب مرتبط بهذا البريد الإلكتروني. لا يمكن تغييره من هنا.
              </FormDescription>
            </FormItem>

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#9AA3B2]" /> رقم الهاتف
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: 05xxxxxxxxx"
                      dir="ltr"
                      className="text-left"
                      disabled={isSubmitting}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title */}
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#9AA3B2]" /> المسمى الوظيفي
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: محامي أول، مستشار قانوني..."
                      disabled={isSubmitting}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    يظهر هذا المسمى لباقي أفراد الفريق.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Badge (read-only) */}
            <div>
              <p className="text-sm font-medium mb-2 text-[#0F1724]">الدور في المكتب</p>
              <Badge variant="outline" className="text-sm border-[#C9A84C]/30 text-[#1A2744] bg-[#F0EAD6]/50">
                {role}
              </Badge>
              <p className="text-xs text-[#9AA3B2] mt-1.5">يتم تحديد الدور بواسطة مدير المكتب.</p>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1A2744] hover:bg-[#1A2744]/90 text-white min-w-[160px]"
              >
                {isSubmitting ? (
                  <><Loader2 className="me-2 h-4 w-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><Save className="me-2 h-4 w-4" /> حفظ التعديلات</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Lightbox */}
      {previewOpen && avatarPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setPreviewOpen(false)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <Image
              src={avatarPreview}
              alt="الصورة الشخصية"
              width={400}
              height={400}
              className="rounded-2xl object-contain max-h-[80vh] w-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
}
