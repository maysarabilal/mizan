'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useInView } from '@/hooks/useInView'
import { useCounter } from '@/hooks/useCounter'

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const { ref: statsRef, isInView: statsInView } = useInView(0.3)

  const lawyersCount = useCounter(500, statsInView, 2000)
  const casesCount = useCounter(10000, statsInView, 2000)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const scrollToScreenshots = () => {
    const element = document.querySelector('#screenshots')
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen bg-l-navy flex items-center justify-center overflow-hidden">
      {/* Subtle geometric pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8922A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Brand values decoration */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-30">
        <span className="text-l-gold/50 text-xs tracking-[0.3em] uppercase font-cormorant">العدالة</span>
        <span className="text-l-gold/30">&#8226;</span>
        <span className="text-l-gold/50 text-xs tracking-[0.3em] uppercase font-cormorant">الثقة</span>
        <span className="text-l-gold/30">&#8226;</span>
        <span className="text-l-gold/50 text-xs tracking-[0.3em] uppercase font-cormorant">التميز</span>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        {/* Logo */}
        <div className={`mb-8 transition-all duration-1000 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.8]'}`}>
          <Image src="/images/mizan-logo.png" alt="ميزان" width={220} height={220}
            className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] mx-auto drop-shadow-[0_0_50px_rgba(184,146,42,0.3)]" />
        </div>

        {/* Main Title */}
        <h1 className={`font-cormorant text-6xl sm:text-7xl lg:text-8xl text-gradient-l-gold font-bold mb-3 transition-all duration-700 delay-200 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          MIZAN
        </h1>

        {/* Arabic title */}
        <p className={`font-cormorant text-3xl sm:text-4xl text-l-gold mb-2 transition-all duration-700 delay-300 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          مـيــزان
        </p>

        {/* Subtitle */}
        <h2 className={`text-xl sm:text-2xl text-l-text font-medium mb-6 transition-all duration-700 delay-400 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          نظام إدارة مكاتب المحاماة
        </h2>

        {/* Divider */}
        <div className={`w-24 h-px bg-gradient-to-r from-transparent via-l-gold to-transparent mb-6 transition-all duration-700 delay-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Description */}
        <p className={`text-l-muted text-base max-w-[560px] mb-10 leading-relaxed transition-all duration-700 delay-600 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          من القضايا والجلسات إلى الفريق والأتعاب — كل ما يحتاجه مكتبك القانوني في منصة واحدة متكاملة
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row items-center gap-4 mb-16 transition-all duration-700 delay-800 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <Link href="/register"
            className="px-8 py-3.5 bg-gradient-l-gold text-l-navy rounded-lg font-semibold text-base hover:scale-[1.03] hover:brightness-110 transition-all duration-300 flex items-center gap-2"
          >
            ابدأ تجربتك المجانية
            <span>&#8592;</span>
          </Link>
          <button onClick={scrollToScreenshots}
            className="px-8 py-3.5 border border-l-gold/40 text-l-gold bg-transparent rounded-lg font-medium text-base hover:bg-l-gold/10 transition-all duration-300"
          >
            شاهد كيف يعمل
          </button>
        </div>

        {/* Beta Notice Stats */}
        <div ref={statsRef} className={`flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 transition-all duration-700 delay-800 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm uppercase tracking-widest text-l-gold-light font-bold">الحالة الحالية</span>
            <span className="text-xl font-bold text-white px-4 py-1 bg-l-gold/10 rounded-full border border-l-gold/20">إطلاق تجريبي (Public Beta)</span>
          </div>
          <div className="hidden sm:block w-px h-12 bg-l-gold/20" />
          <div className="flex flex-col items-center gap-1 max-w-[300px]">
            <span className="text-sm uppercase tracking-widest text-l-gold-light font-bold">هدفنا</span>
            <span className="text-sm text-l-muted">نحن نطور ميزان بناءً على ملاحظاتكم الحقيقية لنصل لأفضل نظام إداري قانوني</span>
          </div>
        </div>
      </div>

      {/* Scroll Down Arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
        <ChevronDown className="w-8 h-8 text-l-gold/60" />
      </div>
    </section>
  )
}
