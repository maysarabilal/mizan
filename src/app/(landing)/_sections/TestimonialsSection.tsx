'use client'

import { useState, useEffect } from 'react'
import { useInView } from '@/hooks/useInView'
import { ChevronRight, ChevronLeft, Quote, Star } from 'lucide-react'

const testimonials = [
  {
    text: 'ميزان غيّر طريقة إدارتي لمكتبي بالكامل. كنت أضيع ساعات يومياً في البحث عن ملفات القضايا ومواعيد الجلسات، والآن كل شيء منظم ومتاح بنقرة واحدة. النظام سهل الاستخدام وواجهته جميلة.',
    name: 'د. محمد خالد العمري',
    title: 'محامٍ',
    location: 'نابلس',
    initials: 'م ع',
  },
  {
    text: 'لأول مرة أشعر أنني متحكم فعلياً في مكتبي. إدارة الأتعاب كانت كابوساً بالنسبة لي، والآن أعرف بالضبط من دفع ومن لم يدفع. التقارير المالية ساعدتني كثيراً في تطوير أداء المكتب.',
    name: 'أحمد سمير الحسيني',
    title: 'محامٍ',
    location: 'رام الله',
    initials: 'أ ح',
  },
  {
    text: 'الإشعارات الفورية والتذكيرات التلقائية أنقذتني أكثر من مرة من نسيان جلسات هامة. فريق العمل في المكتب أصبح أكثر تنظيماً وكل شخص يعرف مهامه بوضوح. أنصح به بشدة.',
    name: 'ليلى محمود عبد الرحمن',
    title: 'محامية',
    location: 'القدس',
    initials: 'ل ع',
  },
]

export default function TestimonialsSection() {
  const { ref, isInView } = useInView(0.15)
  const [activeIndex, setActiveIndex] = useState(0)

  const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length)
  const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section id="testimonials" className="bg-l-navy py-24 relative overflow-hidden" ref={ref}>
      {/* Decorative background element */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-l-gold/5 blur-[100px] rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-l-gold/10 border border-l-gold/20 text-l-gold-light text-sm font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-l-gold animate-pulse" />
            انضم لـ 500+ محامٍ يثقون بنا
          </div>
          <h2 className={`font-cormorant text-3xl sm:text-4xl text-gradient-l-gold text-center transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            ماذا يقول المحامون عن ميزان؟
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Desktop/Mobile Card Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-l-navy-light/50 border border-l-gold/15 rounded-3xl p-8 md:p-12 shadow-2xl relative">
                    <Quote size={80} className="absolute top-6 right-8 text-l-gold opacity-10" />
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-l-gold p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-[14px] bg-l-navy flex items-center justify-center">
                          <span className="text-2xl font-bold text-gradient-l-gold">{testimonial.initials}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} className="fill-l-gold text-l-gold" />
                          ))}
                        </div>
                        <p className="text-l-text text-lg md:text-xl leading-relaxed mb-6 italic">
                          "{testimonial.text}"
                        </p>
                        <div>
                          <p className="text-l-gold-light font-bold text-lg">{testimonial.name}</p>
                          <p className="text-l-muted text-sm">{testimonial.title} • {testimonial.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button 
              onClick={prev}
              className="p-3 rounded-full border border-l-gold/20 text-l-gold hover:bg-l-gold/10 transition-all cursor-pointer"
              aria-label="Previous"
            >
              <ChevronRight size={24} />
            </button>
            
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeIndex === i ? 'bg-l-gold w-8' : 'bg-l-gold/20'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <button 
              onClick={next}
              className="p-3 rounded-full border border-l-gold/20 text-l-gold hover:bg-l-gold/10 transition-all cursor-pointer"
              aria-label="Next"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
