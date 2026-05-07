'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { requestPlanUpgradeAction } from '@/lib/actions/subscriptions'

// Display names — frontend only, DB stores Arabic names separately
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  'individual': 'الأساس',
  'office': 'الاحتراف',
  'institution': 'الريادة',
  'individual_yearly': 'الأساس — سنوي',
  'office_yearly': 'الاحتراف — سنوي',
  'institution_yearly': 'الريادة — سنوي',
  'enterprise': 'المؤسسات',
}

const PLAN_FEATURES: Record<string, string[]> = {
  'individual': [
    'إدارة القضايا والعملاء',
    'تتبع الجلسات والمواعيد',
    'إدارة المهام والتذكيرات',
    'البحث الموحد المتقدم',
    'دعم فني أساسي',
  ],
  'office': [
    'كل مميزات خطة الأساس',
    'إدارة فريق حتى 10 أعضاء',
    'صلاحيات ودعوات متقدمة',
    'سجل النشاطات والتدقيق',
    'دعم فني ذو أولوية',
  ],
  'institution': [
    'كل مميزات خطة الاحتراف',
    'إدارة فريق حتى 20 عضواً',
    'تقارير وإحصائيات متقدمة',
    'إعدادات مخصصة للمؤسسة',
    'دعم فني مخصص',
  ],
  'enterprise': [
    'كل مميزات خطة الريادة',
    'عدد أعضاء غير محدود',
    'تكامل مخصص مع أنظمتك',
    'مدير حساب مخصص',
    'اتفاقية مستوى خدمة (SLA)',
  ],
}

// Mapping: monthly slug → yearly slug
const YEARLY_SLUG_MAP: Record<string, string> = {
  'individual': 'individual_yearly',
  'office': 'office_yearly',
  'institution': 'institution_yearly',
  'enterprise': 'enterprise',
}

// The monthly slugs to display in order (RTL: Basis -> Office -> Institution -> Enterprise)
const MONTHLY_DISPLAY_ORDER = ['individual', 'office', 'institution', 'enterprise']

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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

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

  // Build a slug→plan lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planBySlug: Record<string, any> = {}
  for (const p of plans) {
    planBySlug[p.slug] = p
  }

  // Determine which plans to show based on billing cycle
  const displayPlans = MONTHLY_DISPLAY_ORDER.map(monthlySlug => {
    const slug = billingCycle === 'yearly' ? YEARLY_SLUG_MAP[monthlySlug] : monthlySlug
    return planBySlug[slug]
  }).filter(Boolean)

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-[#F0EAD6] border border-black/8 rounded-full p-1 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`
              rounded-full px-6 py-2 text-sm font-medium transition-all
              ${billingCycle === 'monthly'
                ? 'bg-[#1A2744] text-white shadow-[0px_2px_4px_rgba(0,0,0,0.1)]'
                : 'text-[#9AA3B2] hover:text-[#1A2744]'
              }
            `}
          >
            شهري
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`
              rounded-full px-6 py-2 text-sm font-medium transition-all flex items-center gap-1.5
              ${billingCycle === 'yearly'
                ? 'bg-[#1A2744] text-white shadow-[0px_2px_4px_rgba(0,0,0,0.1)]'
                : 'text-[#9AA3B2] hover:text-[#1A2744]'
              }
            `}
          >
            سنوي
            <span className="text-white text-[12px] font-semibold">وفّر ~17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {displayPlans.map((plan) => {
          const isActive = plan.id === currentPlanId
          const isEnterprise = plan.slug === 'enterprise'
          const baseSlug = plan.slug.replace('_yearly', '')
          const displayName = PLAN_DISPLAY_NAMES[plan.slug] ?? plan.name
          const features = PLAN_FEATURES[baseSlug] ?? []
          const isPendingThisPlan = pendingRequest?.requested_plan_id === plan.id
          const globalPending = !!pendingRequest

          const getCardStyles = () => {
            if (baseSlug === 'office') {
              return {
                wrapper: 'border-2 border-[#C9A84C] shadow-[0px_4px_16px_rgba(201,168,76,0.15)] bg-white rounded-[8px] p-[24px] relative scale-105 -translate-y-2',
                title: 'uppercase tracking-[0.5px] text-[14px] font-semibold text-[#9AA3B2] mb-[16px]',
                price: 'text-[32px] font-bold text-[#0F1724]',
                priceSuffix: 'text-[14px] font-medium text-[#9AA3B2]',
                button: 'bg-[#C9A84C] text-[#1A2744] font-semibold rounded-[6px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] h-[36px] w-full mt-6',
              }
            } else if (baseSlug === 'individual') {
              return {
                wrapper: 'border-2 border-[#1A2744] shadow-[0px_1px_3px_rgba(0,0,0,0.05)] bg-white rounded-[8px] p-[24px] h-[448px] relative',
                title: 'uppercase tracking-[0.5px] text-[14px] font-semibold text-[#9AA3B2] mb-[16px]',
                price: 'text-[32px] font-bold text-[#0F1724]',
                priceSuffix: 'text-[14px] font-medium text-[#9AA3B2]',
                button: 'border border-black/8 text-[#0F1724] font-semibold rounded-[6px] h-[38px] w-full mt-6 hover:bg-black/5',
              }
            } else if (baseSlug === 'institution') {
              return {
                wrapper: 'border border-black/8 shadow-[0px_1px_3px_rgba(0,0,0,0.05)] bg-white rounded-[8px] p-[24px] h-[448px] relative',
                title: 'uppercase tracking-[0.5px] text-[14px] font-semibold text-[#9AA3B2] mb-[16px]',
                price: 'text-[32px] font-bold text-[#0F1724]',
                priceSuffix: 'text-[14px] font-medium text-[#9AA3B2]',
                button: 'border border-black/8 text-[#0F1724] font-semibold rounded-[6px] h-[38px] w-full mt-6 hover:bg-black/5',
              }
            } else {
              // enterprise
              return {
                wrapper: 'border border-black/8 shadow-[0px_1px_3px_rgba(0,0,0,0.05)] bg-white rounded-[8px] p-[24px] h-[448px] relative',
                title: 'uppercase tracking-[0.5px] text-[14px] font-semibold text-[#9AA3B2] mb-[16px]',
                price: 'text-[26px] font-bold text-[#0F1724]',
                priceSuffix: '',
                button: 'border border-black/8 text-[#0F1724] font-semibold rounded-[6px] h-[38px] w-full mt-6 hover:bg-black/5',
              }
            }
          }

          const styles = getCardStyles()

          return (
            <div key={plan.id} className={styles.wrapper}>
              {/* Badges */}
              {isActive && (
                <div className="absolute -top-[10px] right-[26px] bg-[#1A2744] text-white rounded-full px-[12px] py-[4px] text-[12px] font-semibold">
                  باقتك الحالية
                </div>
              )}
              {baseSlug === 'office' && !isActive && (
                <div className="absolute -top-[10px] right-[26px] bg-[#C9A84C] text-[#1A2744] rounded-full px-[12px] py-[4px] text-[12px] font-semibold flex items-center gap-1">
                  ⭐ الأكثر شعبية
                </div>
              )}

              <div className={styles.title}>{PLAN_DISPLAY_NAMES[plan.slug] ?? plan.name}</div>

              {/* Price section */}
              <div className="mb-[24px]">
                {isEnterprise ? (
                  <div className={styles.price}>تواصل معنا</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className={styles.price}>
                      ₪{plan.billing_cycle === 'yearly' ? Math.round(Number(plan.price_ils) / 12) : Number(plan.price_ils)}
                    </span>
                    <span className={styles.priceSuffix}>/شهر</span>
                  </div>
                )}
              </div>

              {/* Users Limit */}
              <div className="text-[14px] text-[#0F1724] mb-[24px]">
                {isEnterprise ? 'عدد أعضاء غير محدود' : `حتى ${plan.max_users} مستخدمين`}
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-black/8 mb-[24px]"></div>

              {/* Features List */}
              <ul className="flex flex-col gap-[14px] flex-1">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-[12px] text-[14px] text-[#0F1724]">
                    <div className="w-[16px] h-[16px] rounded-full border-[1.33px] border-[#1A2744] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-[10px] w-[10px] text-[#1A2744]" strokeWidth={3} />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {isEnterprise ? (
                <Link href="mailto:support@mizan.com" className="w-full">
                  <button className={styles.button}>
                    تواصل معنا
                  </button>
                </Link>
              ) : (
                <button
                  className={styles.button}
                  disabled={isActive || globalPending || !!isProcessing}
                  onClick={() => handleRequestUpgrade(plan.id)}
                >
                  {isActive
                    ? 'الباقة مفعّلة'
                    : isPendingThisPlan
                      ? (pendingRequest?.status === 'awaiting_payment' ? 'بانتظار تأكيد الدفع' : 'الطلب قيد المراجعة')
                      : globalPending
                        ? (pendingRequest?.status === 'awaiting_payment' ? 'لديك طلب بانتظار الدفع' : 'طلب آخر قيد المراجعة')
                        : isProcessing === plan.id
                          ? 'جاري إرسال الطلب...'
                          : 'طلب الترقية'
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
