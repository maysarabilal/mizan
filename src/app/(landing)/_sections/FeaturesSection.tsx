'use client'

import { Scale, CalendarDays, Users, Kanban, Wallet, Bell } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const features = [
  {
    icon: Scale,
    title: 'إدارة القضايا الذكية',
    description: 'تتبع كامل لكل قضية — أطراف الدعوى، المستندات، التطورات، وكاشف تضارب المصالح التلقائي',
    badge: 'مميزة',
  },
  {
    icon: CalendarDays,
    title: 'تقويم الجلسات',
    description: 'جدول جلساتك بصورة واضحة مع تذكيرات تلقائية قبل كل موعد — لا تفوّت جلسة بعد الآن',
    badge: null,
  },
  {
    icon: Users,
    title: 'إدارة الفريق والصلاحيات',
    description: 'حدد صلاحيات كل عضو في المكتب — محامٍ، متدرب، سكرتارية — مع سجل نشاطات كامل',
    badge: null,
  },
  {
    icon: Kanban,
    title: 'لوحة المهام Kanban',
    description: 'وزّع المهام على فريقك وتابع تقدمها بصرياً، مع تنبيهات للمواعيد المتأخرة',
    badge: null,
  },
  {
    icon: Wallet,
    title: 'إدارة الأتعاب القانونية',
    description: 'تتبع دقيق لما دفعه كل موكل، المبالغ المعلقة، والإشعارات التلقائية عند الاستحقاق',
    badge: 'جديد',
  },
  {
    icon: Bell,
    title: 'إشعارات فورية',
    description: 'إشعارات Web Push حقيقية تصلك على هاتفك حتى لو كان المتصفح مغلقاً',
    badge: null,
  },
]

export default function FeaturesSection() {
  const { ref, isInView } = useInView(0.15)

  return (
    <section id="features" className="bg-l-navy py-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className={`font-cormorant text-3xl sm:text-4xl text-gradient-l-gold mb-5 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            كل ما يحتاجه مكتبك في مكان واحد
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-l-gold to-transparent mx-auto mb-5 opacity-50" />
          <p className={`text-l-gold-light text-base max-w-[600px] mx-auto transition-all duration-700 delay-200 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            ميزان صُمِّم خصيصاً لمكاتب المحاماة العربية، بفهم عميق لطبيعة العمل القانوني
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={feature.title}
                className={`bg-l-charcoal rounded-xl p-7 border border-l-gold/15 transition-all duration-700 hover:border-l-gold/50 hover:-translate-y-1.5 group ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: isInView ? `${index * 100}ms` : '0ms' }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-full bg-l-gold/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-l-gold" />
                  </div>
                  {feature.badge && (
                    <span className="px-3 py-1 text-xs font-medium bg-l-gold/15 text-l-gold rounded-full">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-l-text mb-3">{feature.title}</h3>
                <p className="text-l-gold-light/90 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
