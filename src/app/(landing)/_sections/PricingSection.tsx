'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Star } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const plans = [
  {
    id: 'basic',
    title: 'الأساس',
    subtitle: 'المحامي المستقل',
    monthlyPrice: 49,
    yearlyPrice: 39,
    featured: false,
    features: [
      { text: 'مستخدم واحد', included: true },
      { text: 'إدارة قضايا وجلسات أساسية', included: true },
      { text: 'تنبيهات النظام', included: true },
      { text: 'تخزين 1GB للمستندات', included: true },
      { text: 'لوحة المهام Kanban', included: false },
      { text: 'إدارة الأتعاب', included: false },
    ],
    cta: 'ابدأ مجاناً',
    ctaStyle: 'outline' as const,
  },
  {
    id: 'pro',
    title: 'الاحتراف',
    subtitle: 'المكاتب الصغيرة والمتوسطة',
    monthlyPrice: 149,
    yearlyPrice: 119,
    featured: true,
    badge: 'الأكثر شعبية ★',
    features: [
      { text: 'حتى 5 مستخدمين', included: true },
      { text: 'لوحة المهام Kanban الكاملة', included: true },
      { text: 'إدارة الأتعاب القانونية', included: true },
      { text: 'صلاحيات مخصصة للفريق', included: true },
      { text: 'إشعارات فورية (Web Push)', included: true },
      { text: 'رفع شعار المكتب', included: true },
      { text: 'تخزين 10GB', included: true },
    ],
    cta: 'ابدأ تجربتك ←',
    ctaStyle: 'filled' as const,
  },
  {
    id: 'enterprise',
    title: 'الريادة',
    subtitle: 'الشركات القانونية الكبيرة',
    monthlyPrice: 349,
    yearlyPrice: 279,
    featured: false,
    features: [
      { text: 'مستخدمون غير محدودون', included: true },
      { text: 'كل مميزات "الاحتراف"', included: true },
      { text: 'إرفاق ملفات ومستندات', included: true },
      { text: 'سجل نشاطات تفصيلي', included: true },
      { text: 'دعم فني أولوية 24/7', included: true },
      { text: 'تخزين 100GB', included: true },
      { text: 'تقارير متقدمة', included: true },
    ],
    cta: 'تواصل معنا',
    ctaStyle: 'outline' as const,
  },
]

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const { ref, isInView } = useInView(0.15)

  return (
    <section id="pricing" className="bg-l-navy py-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className={`font-cormorant text-3xl sm:text-4xl text-gradient-l-gold mb-5 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            اختر باقتك
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-l-gold to-transparent mx-auto mb-5 opacity-50" />
          <p className={`text-l-muted text-base transition-all duration-700 delay-200 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            باقات تناسب كل مكتب محاماة، من المستقل إلى الشركات الكبرى
          </p>
        </div>

        {/* Toggle */}
        <div className={`flex items-center justify-center gap-4 mb-14 transition-all duration-700 delay-300 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <div className="flex items-center bg-l-charcoal rounded-full p-1 border border-l-gold/15">
            <button onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isYearly ? 'bg-gradient-l-gold text-l-navy' : 'text-l-muted hover:text-l-text'
              }`}
            >
              شهري
            </button>
            <button onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isYearly ? 'bg-gradient-l-gold text-l-navy' : 'text-l-muted hover:text-l-text'
              }`}
            >
              سنوياً
            </button>
          </div>
          {isYearly && <span className="text-emerald-400 text-sm font-medium">↩ وفّر 20%</span>}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, index) => (
            <div key={plan.id}
              className={`relative rounded-xl transition-all duration-700 ${
                plan.featured ? 'bg-l-charcoal ring-l-gold-featured md:scale-105 z-10 animate-glow-pulse' : 'bg-l-charcoal border border-l-gold/15'
              } ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: isInView ? `${index * 150}ms` : '0ms' }}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gradient-l-gold text-l-navy text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    الأكثر شعبية
                  </span>
                </div>
              )}
              <div className="p-6 sm:p-8 pt-10">
                <h3 className="text-xl font-bold text-gradient-l-gold mb-1">{plan.title}</h3>
                <p className="text-sm text-l-gold-light mb-6">{plan.subtitle}</p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white transition-all duration-500" key={isYearly ? 'yearly' : 'monthly'}>
                      ₪{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-l-gold-light text-sm">/شهر</span>
                  </div>
                  {isYearly && <p className="text-xs text-l-gold-light/80 mt-1">يُدفع سنوياً (₪{plan.yearlyPrice * 12})</p>}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-l-gold flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-l-muted flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-l-text' : 'text-l-muted line-through'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.id === 'enterprise' ? '/contact' : '/register'}
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    plan.ctaStyle === 'filled'
                      ? 'bg-gradient-l-gold text-l-navy hover:scale-[1.02] hover:brightness-110'
                      : 'border border-l-gold text-l-gold hover:bg-l-gold/10'
                  }`}
                >
                  {plan.cta.includes('←') ? (
                    <span>ابدأ تجربتك ←</span>
                  ) : (
                    plan.cta
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className={`text-center text-l-muted text-sm mt-10 transition-all duration-700 delay-600 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          جميع الباقات تشمل تجربة مجانية 14 يوماً بدون بطاقة ائتمانية
        </p>
      </div>
    </section>
  )
}
