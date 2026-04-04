'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, ArrowUpRight } from 'lucide-react'
import { requestPlanUpgradeAction } from '@/lib/actions/subscriptions'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PlansGrid({ 
  plans, 
  currentPlanId, 
  pendingRequest 
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plans: any[], 
  currentPlanId?: string, 
  pendingRequest?: { requested_plan_id: string; status: string } | null 
}) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const handleRequestUpgrade = async (planId: string) => {
    setIsProcessing(planId)
    const { error } = await requestPlanUpgradeAction(planId)
    setIsProcessing(null)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم إرسال طلب الترقية للمسؤول')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {plans.map((plan) => {
        const isActive = plan.id === currentPlanId
        const isInfinite = plan.max_users > 1000
        const isPendingThisPlan = pendingRequest?.requested_plan_id === plan.id
        const globalPending = !!pendingRequest

        return (
          <Card 
            key={plan.id} 
            className={`flex flex-col relative overflow-hidden transition-all ${isActive ? 'border-primary ring-1 ring-primary shadow-md' : 'hover:border-primary/50'}`}
          >
            {isActive && (
              <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-xs font-bold text-center py-1">
                الباقة الحالية
              </div>
            )}
            <CardHeader className={isActive ? 'pt-8' : ''}>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>موجهة خصيصاً للتغطية الفعالة</CardDescription>
              {plan.slug !== 'enterprise' && (
                <div className="mt-4 flex items-baseline text-4xl font-extrabold gap-1">
                  {plan.price_ils} <span className="text-lg text-muted-foreground font-medium">₪ / {plan.billing_cycle === 'yearly' ? 'سنوياً' : 'شهرياً'}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="flex flex-col gap-3 text-sm">
                {plan.slug !== 'enterprise' ? (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    أعضاء الفريق: {isInfinite ? 'غير محدود' : `حتى ${plan.max_users} مستخدمين`}
                  </li>
                ) : (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    أعضاء الفريق: غير محدود ومخصص لاحتياجاتك
                  </li>
                )}
                {plan.features?.team_management && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    صلاحيات ودعوات الفريق المتطورة
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  دعم فني وتحديثات مستمرة
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  تخزين ملفات القضايا والجلسات السحابي
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              {plan.slug === 'enterprise' ? (
                <Link href="mailto:support@mizan.com" className="w-full">
                  <Button className="w-full outline">
                    تواصل معنا
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full" 
                  variant={isActive || isPendingThisPlan || isProcessing === plan.id ? 'outline' : 'default'}
                  disabled={isActive || globalPending || !!isProcessing}
                  onClick={() => handleRequestUpgrade(plan.id)}
                >
                  {isActive 
                    ? 'الباقة مفعّلة' 
                    : isPendingThisPlan 
                      ? (pendingRequest?.status === 'awaiting_payment' ? 'بانتظار تأكيد الدفع' : 'الطلب قيد المراجعة')
                      : globalPending
                        ? (pendingRequest?.status === 'awaiting_payment' ? 'لديك طلب آخر بانتظار الدفع' : 'طلب آخر قيد المراجعة')
                        : isProcessing === plan.id 
                          ? 'جاري إرسال الطلب...' 
                          : <><ArrowUpRight className="me-2 h-4 w-4" /> طلب الترقية لهذه الباقة</>
                  }
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
