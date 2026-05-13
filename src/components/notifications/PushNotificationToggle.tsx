'use client'

import { useState, useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

export function PushNotificationToggle() {
  const { status, isSubscribed, subscribe, unsubscribe } = usePushNotifications()
  const [loading, setLoading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    }
  }, [])

  if (status === 'unsupported') {
    return (
      <div className="text-sm text-muted-foreground">
        متصفحك لا يدعم إشعارات الويب
      </div>
    )
  }

  const handleToggle = async () => {
    setLoading(true)
    if (isSubscribed) {
      const ok = await unsubscribe()
      if (ok) toast.success('تم إيقاف الإشعارات')
      else toast.error('فشل إيقاف الإشعارات')
    } else {
      if (status === 'denied') {
        toast.warning('الإشعارات محجوبة في إعدادات المتصفح. يرجى السماح بها يدوياً من شريط العنوان.')
        setLoading(false)
        return
      }
      const ok = await subscribe()
      if (ok) toast.success('تم تفعيل الإشعارات بنجاح ✅')
      else toast.error('لم يتم السماح بالإشعارات')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">إشعارات المتصفح</p>
        <p className="text-xs text-muted-foreground">
          {isSubscribed
            ? 'ستصلك إشعارات حتى عند إغلاق التطبيق'
            : 'تفعيل الإشعارات للحصول على تنبيهات فورية'}
        </p>
        {status === 'denied' && (
          <p className="text-xs text-red-500 mt-1">
            الإشعارات محجوبة — يرجى السماح من إعدادات المتصفح
          </p>
        )}
        {isIOS && !isStandalone && (
          <p className="text-xs text-amber-600 mt-1">
            على iOS: أضف التطبيق إلى الشاشة الرئيسية لتفعيل الإشعارات
          </p>
        )}
      </div>
      <div dir="ltr">
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={loading || status === 'loading'}
        />
      </div>
    </div>
  )
}
