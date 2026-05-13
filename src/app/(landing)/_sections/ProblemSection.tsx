'use client'

import { FolderOpen, CalendarX, CircleDollarSign } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const problems = [
  {
    icon: FolderOpen,
    title: 'ضياع ملفات القضايا',
    description: 'قضايا موزعة بين أوراق وأجهزة مختلفة، لا نظام يجمعها',
    borderColor: 'border-t-l-crimson/70',
  },
  {
    icon: CalendarX,
    title: 'نسيان مواعيد الجلسات',
    description: 'لا تذكيرات تلقائية، والتأخر على جلسة يكلف موكلك حقه',
    borderColor: 'border-t-l-gold/70',
  },
  {
    icon: CircleDollarSign,
    title: 'فوضى في الأتعاب',
    description: 'لا تعرف من دفع ومن لم يدفع — الأتعاب تضيع بين المواعيد',
    borderColor: 'border-t-l-crimson/70',
  },
]

export default function ProblemSection() {
  const { ref, isInView } = useInView(0.2)

  return (
    <section className="bg-l-parchment py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Title */}
        <h2 className={`font-cormorant text-3xl sm:text-4xl text-l-navy text-center mb-14 transition-all duration-700 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          هل تواجه هذه التحديات يومياً؟
        </h2>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {problems.map((problem, index) => {
            const Icon = problem.icon
            return (
              <div key={problem.title}
                className={`bg-white rounded-xl p-8 border-t-4 ${problem.borderColor} shadow-lg transition-all duration-700 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: isInView ? `${index * 150}ms` : '0ms' }}
              >
                <div className="w-14 h-14 rounded-full bg-l-gold/10 flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-l-gold" />
                </div>
                <h3 className="text-xl font-bold text-l-navy mb-3">{problem.title}</h3>
                <p className="text-l-muted leading-relaxed">{problem.description}</p>
              </div>
            )
          })}
        </div>

        {/* Transition text */}
        <div className={`text-center transition-all duration-700 delay-500 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-l-gold text-lg font-medium flex items-center justify-center gap-2">
            ميزان يحل هذا كله
            <span>&#8595;</span>
          </p>
        </div>
      </div>
    </section>
  )
}
