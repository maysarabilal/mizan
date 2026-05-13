'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useInView } from '@/hooks/useInView'

export default function CtaSection() {
  const { ref, isInView } = useInView(0.2)

  return (
    <section className="relative py-28 sm:py-32 overflow-hidden bg-gradient-l-navy" ref={ref}>
      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Image src="/images/mizan-logo.png" alt="" width={300} height={300}
          className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] opacity-[0.05]"
          aria-hidden="true" />
      </div>

      {/* Decorative gold lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-l-gold/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-l-gold/30 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Brand values */}
        <div className={`flex items-center justify-center gap-4 mb-8 transition-all duration-700 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <span className="text-l-gold-light/60 text-xs tracking-[0.3em] uppercase font-cormorant">Justice</span>
          <span className="text-l-gold/20">&#8226;</span>
          <span className="text-l-gold-light/60 text-xs tracking-[0.3em] uppercase font-cormorant">Trust</span>
          <span className="text-l-gold/20">&#8226;</span>
          <span className="text-l-gold-light/60 text-xs tracking-[0.3em] uppercase font-cormorant">Excellence</span>
        </div>

        <h2 className={`font-cormorant text-3xl sm:text-4xl lg:text-5xl text-gradient-l-gold mb-6 leading-tight transition-all duration-700 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          مكتبك يستحق نظاماً بمستوى احترافيتك
        </h2>

        <div className="w-20 h-px bg-gradient-to-r from-transparent via-l-gold to-transparent mx-auto mb-6 opacity-50" />

        <p className={`text-l-text text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          كن من أوائل المنضمين لنجاح ميزان.. سجل الآن لتجربة المنصة وشاركنا في بنائها لتكون الخيار الأول للمحامي العربي
        </p>

        <div className={`mb-8 transition-all duration-700 delay-400 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <Link href="/register"
            className="inline-block px-10 sm:px-12 py-4 sm:py-5 bg-gradient-l-gold text-l-navy rounded-lg font-bold text-base sm:text-lg hover:scale-105 hover:shadow-l-gold-lg transition-all duration-300"
          >
            ابدأ تجربتك المجانية لـ 14 يوماً ←
          </Link>
        </div>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 transition-all duration-700 delay-600 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          {['لا بطاقة ائتمانية', 'إلغاء في أي وقت', 'دعم فني كامل'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-l-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-l-gold-light text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
