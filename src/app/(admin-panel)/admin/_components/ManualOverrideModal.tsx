'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { updateSubscriptionDirectlyAction } from '@/lib/actions/admin'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManualOverrideModal({ office, open, onClose }: { office: any, open: boolean, onClose: () => void }) {
  const sub = Array.isArray(office?.office_subscriptions) ? office?.office_subscriptions[0] : office?.office_subscriptions
  const [status, setStatus] = useState(sub?.status || 'active')
  const [date, setDate] = useState(sub?.current_period_end ? format(new Date(sub.current_period_end), 'yyyy-MM-dd') : '')
  const [planId, setPlanId] = useState(sub?.plan_id || '')
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availablePlans, setAvailablePlans] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      // Sync props on open
      setStatus(sub?.status || 'active')
      setDate(sub?.current_period_end ? format(new Date(sub.current_period_end), 'yyyy-MM-dd') : '')
      setPlanId(sub?.plan_id || '')

      const fetchPlans = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('subscription_plans')
          .select('*')
          // @ts-expect-error is_active dynamically added
          .eq('is_active', true)
          .neq('slug', 'enterprise')
          .order('price_ils', { ascending: true })
        
        if (data) setAvailablePlans(data)
      }
      fetchPlans()
    }
  }, [open, sub])

  const handleSave = async () => {
    if (!office) return
    setSaving(true)

    try {
      function toSafeISO(value: string | null | undefined): string | null {
        if (!value) return null
        const d = new Date(value)
        if (isNaN(d.getTime())) return null
        return d.toISOString()
      }

      const safeDate = toSafeISO(date)

      const requiresDateStatus = ['trialing', 'active', 'past_due', 'cancelled']
      
      if (requiresDateStatus.includes(status) && !safeDate) {
        toast.error('يرجى تحديد تاريخ الانتهاء قبل الحفظ.')
        setSaving(false)
        return
      }

      const current_period_end = safeDate || new Date().toISOString()

      const { error } = await updateSubscriptionDirectlyAction(office.id, {
        status,
        current_period_end,
        plan_id: planId || undefined
      })

      if (error) {
        toast.error('حدث خطأ أثناء حفظ التحديث: ' + error)
        setSaving(false)
        return
      }

      toast.success('تم تحديث اشتراك المكتب بنجاح.')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى.')
    } finally {
      setSaving(false)
    }
  }

  if (!office) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">تعديل اشتراك: {office.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-zinc-300">حالة الاشتراك</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white ring-offset-background"
            >
              <option value="active">فعال (Active)</option>
              <option value="trialing">تجريبي (Trialing)</option>
              <option value="past_due">متأخر الدفع (Past Due)</option>
              <option value="expired">منتهي (Expired)</option>
              <option value="cancelled">ملغى (Cancelled)</option>
              <option value="pending">معلق (Pending)</option>
              <option value="awaiting_payment">بانتظار الدفع (Awaiting Payment)</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-300">تاريخ الانتهاء</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-300">تغيير الباقة الحالية</Label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white ring-offset-background"
            >
              <option value="" disabled>اختر الباقة...</option>
              {availablePlans.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'})</option>
              ))}
            </select>
            {planId && availablePlans.find(p => p.id === planId)?.max_users < (office.memberCount || 0) && (
              <p className="text-xs text-amber-500 mt-1">تنبيه: عدد الأعضاء الحاليين ({office.memberCount}) يتجاوز حد الباقة الجديدة ({availablePlans.find(p => p.id === planId)?.max_users}).</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving} className="border-zinc-700 text-zinc-300">إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
