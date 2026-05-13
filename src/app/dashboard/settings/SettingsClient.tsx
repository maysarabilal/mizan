'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Building2, Camera, Clock, Shield, Bell,
  Save, Loader2, MapPin, BadgeCheck, Scale,
  Monitor, Smartphone, Tablet, Globe, X
} from 'lucide-react'
import Image from 'next/image'

import { officeSettingsSchema } from '@/lib/validations/settings'
import { updateOfficeSettingsAction, uploadOfficeLogo } from '@/lib/actions/settings'
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// TODO: Future - Official holidays calendar integration
// TODO: Future - Advanced notification preferences

const SPECIALIZATIONS = [
  { value: 'جنائي', label: 'جنائي' },
  { value: 'عقاري', label: 'عقاري' },
  { value: 'أسرة', label: 'أسرة' },
  { value: 'تجاري', label: 'تجاري' },
  { value: 'عمالي', label: 'عمالي' },
  { value: 'إداري', label: 'إداري' },
  { value: 'عام', label: 'عام' },
]

const WORKING_DAYS = [
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الاثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
  { value: 'saturday', label: 'السبت' },
]

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]
).flat()

function getDeviceIcon(device: string | undefined) {
  if (!device) return <Globe className="h-4 w-4 text-[#9AA3B2]" />
  const d = device.toLowerCase()
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone className="h-4 w-4 text-[#9AA3B2]" />
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="h-4 w-4 text-[#9AA3B2]" />
  return <Monitor className="h-4 w-4 text-[#9AA3B2]" />
}

interface SettingsClientProps {
  office: {
    name: string
    logo_url: string | null
    specialization: string | null
    license_number: string | null
    address: string | null
    working_days: string[]
    working_hours_start: string | null
    working_hours_end: string | null
    settings: {
      session_reminders?: boolean
      task_completed?: boolean
      subscription_updates?: boolean
    }
  }
  activityLogs: {
    id: string
    action: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: any
    created_at: string
  }[]
}

export function SettingsClient({ office, activityLogs }: SettingsClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(office.logo_url)
  const [logoLightboxOpen, setLogoLightboxOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const workingDays = Array.isArray(office.working_days) ? office.working_days : ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']

  const form = useForm<z.infer<typeof officeSettingsSchema>>({
    resolver: zodResolver(officeSettingsSchema),
    defaultValues: {
      name: office.name || '',
      specialization: office.specialization || '',
      license_number: office.license_number || '',
      address: office.address || '',
      working_days: workingDays as string[],
      working_hours_start: office.working_hours_start || '08:00',
      working_hours_end: office.working_hours_end || '16:00',
      session_reminders: office.settings?.session_reminders !== false,
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف يتجاوز 2 ميغابايت')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const { data, error } = await uploadOfficeLogo(formData)
    setIsUploading(false)

    if (error) {
      toast.error(error)
      setLogoPreview(office.logo_url)
      return
    }

    if (data) setLogoPreview(data)
    toast.success('تم رفع الشعار بنجاح')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F1724]">إعدادات المكتب</h1>
        <p className="text-sm text-[#9AA3B2]">تخصيص البيانات العامة للمكتب، أوقات العمل، والأمان.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">

          {/* ─── Section 1: Office Identity ─── */}
          <div className="bg-white border border-black/8 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1A2744] flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0F1724]">هوية المكتب</h2>
                <p className="text-sm text-[#9AA3B2]">البيانات الأساسية والمعلومات العامة لمكتبك.</p>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div
                    className="w-20 h-20 rounded-full border-2 border-dashed border-[#C9A84C]/40 flex items-center justify-center bg-[#F0EAD6]/30 overflow-hidden cursor-pointer"
                    onClick={() => logoPreview && setLogoLightboxOpen(true)}
                  >
                    {logoPreview ? (
                      <Image src={logoPreview} alt="شعار المكتب" width={80} height={80} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Building2 className="h-8 w-8 text-[#9AA3B2]" />
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
                    className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-[#1A2744] flex items-center justify-center shadow-md hover:bg-[#C9A84C] transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F1724]">شعار المكتب</p>
                  <p className="text-xs text-[#9AA3B2]">PNG أو JPG — أقصى حجم 2 ميغابايت</p>
                </div>
              </div>

              {/* Office Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المكتب / المؤسسة *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المكتب القانوني..." disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormDescription>سيظهر هذا الاسم في جميع المراسلات والفواتير الرسمية.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specialization */}
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-[#9AA3B2]" /> التخصص
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر تخصص المكتب..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPECIALIZATIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* License Number */}
                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-[#9AA3B2]" /> رقم الترخيص المهني
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: 12345" disabled={isSubmitting} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#9AA3B2]" /> العنوان
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="عنوان المكتب الرئيسي..."
                        className="resize-none"
                        rows={2}
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
          </div>

          {/* ─── Section 2: Working Hours ─── */}
          <div className="bg-white border border-black/8 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C] flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0F1724]">أوقات العمل</h2>
                <p className="text-sm text-[#9AA3B2]">حدد أيام وساعات عمل المكتب الرسمية.</p>
              </div>
            </div>

            {/* Working Days */}
            <FormField
              control={form.control}
              name="working_days"
              render={() => (
                <FormItem className="mb-6">
                  <FormLabel className="text-sm font-medium">أيام العمل</FormLabel>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {WORKING_DAYS.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="working_days"
                        render={({ field }) => {
                          const checked = field.value?.includes(day.value) ?? false
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const current = field.value || []
                                field.onChange(
                                  checked ? current.filter((v: string) => v !== day.value) : [...current, day.value]
                                )
                              }}
                              className={`
                                px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm
                                ${checked
                                  ? 'bg-[#1A2744] text-white border-[#1A2744]'
                                  : 'bg-white text-[#0F1724] border-black/8 hover:border-[#C9A84C]/40'
                                }
                              `}
                            >
                              {day.label}
                            </button>
                          )
                        }}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {/* Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="working_hours_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بداية الدوام</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || '08:00'}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="working_hours_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نهاية الدوام</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || '16:00'}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ─── Section 3: Security ─── */}
          {/* TODO: Future - Active sessions management with device count */}
          {/* TODO: Future - Geo-location approximation in activity log */}
          <div className="bg-white border border-black/8 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0F1724] flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0F1724]">الأمان</h2>
                <p className="text-sm text-[#9AA3B2]">سجل النشاط الأخير لحسابك.</p>
              </div>
            </div>

            {activityLogs.length === 0 ? (
              <div className="border border-dashed border-black/8 rounded-xl p-8 text-center">
                <Shield className="h-10 w-10 text-[#9AA3B2] mx-auto mb-3" />
                <p className="text-sm text-[#9AA3B2]">لا يوجد سجل نشاط حتى الآن.</p>
                <p className="text-xs text-[#9AA3B2] mt-1">ستظهر هنا سجلات تسجيل الدخول والعمليات المهمة.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block border border-black/8 rounded-xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b border-black/8 bg-[#F9FAFB]">
                        <th className="text-xs font-semibold text-[#9AA3B2] uppercase tracking-wider p-3 px-4">النشاط</th>
                        <th className="text-xs font-semibold text-[#9AA3B2] uppercase tracking-wider p-3 px-4">المتصفح</th>
                        <th className="text-xs font-semibold text-[#9AA3B2] uppercase tracking-wider p-3 px-4">الجهاز</th>
                        <th className="text-xs font-semibold text-[#9AA3B2] uppercase tracking-wider p-3 px-4">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="border-b border-black/5 last:border-b-0 hover:bg-black/[0.02] transition-colors">
                          <td className="p-3 px-4 text-sm text-[#0F1724]">{log.action}</td>
                          <td className="p-3 px-4 text-sm text-[#9AA3B2]">{log.details?.browser || '—'}</td>
                          <td className="p-3 px-4">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(log.details?.device)}
                              <span className="text-sm text-[#9AA3B2]">{log.details?.device || '—'}</span>
                            </div>
                          </td>
                          <td className="p-3 px-4 text-sm text-[#9AA3B2]" dir="ltr">
                            {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block sm:hidden flex flex-col gap-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="border border-black/8 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-[#0F1724]">{log.action}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {getDeviceIcon(log.details?.device)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#9AA3B2]">
                        {log.details?.browser && <span>{log.details.browser}</span>}
                        {log.details?.device && <span>{log.details.device}</span>}
                      </div>
                      <span className="text-xs text-[#9AA3B2]" dir="ltr">
                        {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ─── Section 4: Notifications ─── */}
          <div className="bg-white border border-black/8 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C] flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0F1724]">إشعارات النظام التلقائية</h2>
                <p className="text-sm text-[#9AA3B2]">تخصيص أنواع التنبيهات التي يستقبلها فريقك.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Push Notifications */}
              <div className="mb-4 pb-4 border-b border-black/8">
                <PushNotificationToggle />
              </div>

              <FormField
                control={form.control}
                name="session_reminders"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-xl border border-black/8 p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-[#0F1724]">تذكير الجلسات القادمة</p>
                      <p className="text-xs text-[#9AA3B2]">إرسال إشعار تذكيري قبل ميعاد الجلسة بيوم واحد.</p>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="task_completed"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-xl border border-black/8 p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-[#0F1724]">تنبيه إنجاز المهام</p>
                      <p className="text-xs text-[#9AA3B2]">إرسال إشعار للمدير والمسؤول عند اكتمال مهمة.</p>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="subscription_updates"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-xl border border-black/8 p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-[#0F1724]">تحديثات وتنبيهات الاشتراك</p>
                      <p className="text-xs text-[#9AA3B2]">استقبال رسائل حول موعد الاستحقاق والفواتير القادمة.</p>
                    </div>
                    <div dir="ltr">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting} className="w-full sm:w-auto">
              تراجع
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#1A2744] hover:bg-[#1A2744]/90 text-white sm:min-w-[160px]"
            >
              {isSubmitting ? (
                <><Loader2 className="me-2 h-4 w-4 animate-spin" /> جاري الحفظ...</>
              ) : (
                <><Save className="me-2 h-4 w-4" /> حفظ التغييرات</>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Logo Lightbox */}
      {logoLightboxOpen && logoPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLogoLightboxOpen(false)}
        >
          <button
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLogoLightboxOpen(false)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <Image
              src={logoPreview}
              alt="شعار المكتب"
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
