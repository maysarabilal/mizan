'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { betaFeedbackSchema, type BetaFeedbackValues } from '@/lib/validations/landing'
import { submitBetaFeedback } from '@/lib/actions/landing'
import { useInView } from '@/hooks/useInView'
import {
  Star, Send, CheckCircle2, ChevronLeft, ChevronRight,
  User, Briefcase, Building2, FileSpreadsheet, FileText, Monitor,
  CalendarDays, Receipt, ListChecks, Users, Lightbulb, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

const OFFICE_SIZE_OPTIONS = [
  { value: 'solo', label: 'محامٍ مستقل', icon: User },
  { value: 'small', label: 'مكتب صغير (2-5)', icon: Briefcase },
  { value: 'enterprise', label: 'مؤسسة قانونية', icon: Building2 },
]

const CURRENT_TOOL_OPTIONS = [
  { value: 'paper', label: 'أوراق وملفات', icon: FileText },
  { value: 'excel', label: 'جداول إكسل', icon: FileSpreadsheet },
  { value: 'other_software', label: 'برنامج إدارة آخر', icon: Monitor },
]

const MOST_NEEDED_OPTIONS = [
  { value: 'sessions', label: 'تنظيم الجلسات', icon: CalendarDays },
  { value: 'fees', label: 'متابعة الأتعاب', icon: Receipt },
  { value: 'tasks', label: 'توزيع المهام', icon: ListChecks },
  { value: 'clients', label: 'إدارة الموكلين', icon: Users },
]

export default function FeedbackSurveySection() {
  const { ref, isInView } = useInView(0.15)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { register, handleSubmit, setValue, watch } = useForm<BetaFeedbackValues>({
    resolver: zodResolver(betaFeedbackSchema),
    defaultValues: {
      office_size: undefined,
      current_tool: undefined,
      ui_rating: 0,
      features_rating: 0,
      pricing_rating: 0,
      most_needed_feature: undefined,
      missing_feature: '',
      general_notes: '',
      contact_info: '',
    },
  })

  const ratings = {
    ui_rating: watch('ui_rating'),
    features_rating: watch('features_rating'),
    pricing_rating: watch('pricing_rating'),
  }
  const officeSize = watch('office_size')
  const currentTool = watch('current_tool')
  const mostNeeded = watch('most_needed_feature')

  const handleStarClick = (field: 'ui_rating' | 'features_rating' | 'pricing_rating', value: number) => {
    setValue(field, value)
  }

  const onSubmit = async (data: BetaFeedbackValues) => {
    setIsSubmitting(true)
    try {
      const result = await submitBetaFeedback(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsSubmitted(true)
        toast.success('تم إرسال ملاحظاتك بنجاح. شكراً لك!')
      }
    } catch {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (label: string, field: 'ui_rating' | 'features_rating' | 'pricing_rating') => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-l-navy rounded-xl border border-l-gold/10">
      <span className="text-l-text text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => handleStarClick(field, s)} className="focus:outline-none transition-transform hover:scale-110 cursor-pointer p-0.5">
            <Star size={22} className={`transition-colors duration-200 ${(ratings[field] || 0) >= s ? 'fill-l-gold text-l-gold' : 'text-l-gold/20 hover:text-l-gold/50'}`} />
          </button>
        ))}
      </div>
    </div>
  )

  const renderOptionCards = <T extends string>(
    options: { value: T; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[],
    selected: T | undefined,
    field: keyof BetaFeedbackValues,
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon
        const isSelected = selected === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue(field, opt.value as never)}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'border-l-gold bg-l-gold/10 shadow-md'
                : 'border-l-gold/10 bg-l-navy hover:border-l-gold/30 hover:bg-l-gold/5'
            }`}
          >
            <Icon size={28} className={isSelected ? 'text-l-gold' : 'text-l-gold/40'} />
            <span className={`text-sm font-medium ${isSelected ? 'text-l-gold' : 'text-l-text'}`}>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <section id="feedback" className="bg-l-parchment py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-l-charcoal/5 border border-l-gold/20 text-l-navy text-sm font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-l-gold animate-pulse" />
            شارك في التأسيس
          </div>
          <h2 className={`font-cormorant text-3xl sm:text-4xl text-l-navy text-center transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            رأيك يشكل مستقبل ميزان
          </h2>
          <p className={`text-l-muted text-base max-w-2xl mx-auto mt-4 transition-all duration-700 delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            نحن في مرحلة الإطلاق التجريبي. تقييمك وملاحظاتك هي حجر الأساس لتطوير النظام ليناسب احتياجاتك بدقة.
          </p>
        </div>

        {/* Card */}
        <div className={`bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl border border-l-gold/10 transition-all duration-700 delay-400 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {isSubmitted ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-l-navy mb-2">شكراً لمساهمتك!</h3>
              <p className="text-l-muted max-w-md">
                لقد استلمنا ملاحظاتك بنجاح. فريق ميزان سيقوم بدراستها بعناية لتطوير المنصة لتكون الخيار الأفضل لإدارة المكاتب القانونية.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* ── Progress Bar ── */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-l from-l-gold-dark to-l-gold rounded-full transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                </div>
                <span className="text-xs text-l-muted font-medium whitespace-nowrap">الخطوة {step} من 2</span>
              </div>

              {step === 1 && (
                /* ══════════════════════════════════════════════
                   STEP 1: User Persona + Quick Ratings
                   ══════════════════════════════════════════════ */
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Office size */}
                  <div>
                    <h3 className="text-lg font-bold text-l-navy mb-1 flex items-center gap-2">
                      <Building2 className="text-l-gold" size={20} />
                      ما حجم مكتبك؟
                    </h3>
                    <p className="text-xs text-l-muted mb-4">اختر الخيار الأقرب لطبيعة عملك الحالية</p>
                    {renderOptionCards(OFFICE_SIZE_OPTIONS, officeSize, 'office_size')}
                  </div>

                  {/* Current tool */}
                  <div>
                    <h3 className="text-lg font-bold text-l-navy mb-1 flex items-center gap-2">
                      <Monitor className="text-l-gold" size={20} />
                      كيف تدير مكتبك حالياً؟
                    </h3>
                    <p className="text-xs text-l-muted mb-4">ما الأداة أو الطريقة التي تعتمدها اليوم؟</p>
                    {renderOptionCards(CURRENT_TOOL_OPTIONS, currentTool, 'current_tool')}
                  </div>

                  {/* Star ratings */}
                  <div>
                    <h3 className="text-lg font-bold text-l-navy mb-1 flex items-center gap-2">
                      <Star className="text-l-gold" size={20} />
                      التقييم السريع
                    </h3>
                    <p className="text-xs text-l-muted mb-4">قيّم تجربتك الأولية مع ميزان (اختياري)</p>
                    <div className="space-y-3">
                      {renderStars('واجهة المستخدم وسهولة الاستخدام', 'ui_rating')}
                      {renderStars('المميزات وتلبيتها لاحتياجاتك', 'features_rating')}
                      {renderStars('باقات الأسعار المقترحة', 'pricing_rating')}
                    </div>
                  </div>

                  {/* Next button */}
                  <div className="flex justify-start pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-8 py-3.5 bg-gradient-l-gold text-l-navy font-bold rounded-xl hover:scale-105 hover:shadow-l-gold-lg transition-all duration-300 flex items-center gap-2 cursor-pointer"
                    >
                      التالي
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                /* ══════════════════════════════════════════════
                   STEP 2: Value Discovery + Dealbreakers
                   ══════════════════════════════════════════════ */
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Most needed feature */}
                  <div>
                    <h3 className="text-lg font-bold text-l-navy mb-1 flex items-center gap-2">
                      <Lightbulb className="text-l-gold" size={20} />
                      أكثر قسم لفت انتباهك أو تحتاجه بشدة
                    </h3>
                    <p className="text-xs text-l-muted mb-4">ما الذي يُهمّك أكثر في نظام إدارة المكتب؟</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {MOST_NEEDED_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        const isSelected = mostNeeded === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setValue('most_needed_feature', opt.value as 'sessions' | 'fees' | 'tasks' | 'clients')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? 'border-l-gold bg-l-gold/10 shadow-md'
                                : 'border-l-gold/10 bg-l-navy hover:border-l-gold/30 hover:bg-l-gold/5'
                            }`}
                          >
                            <Icon size={24} className={isSelected ? 'text-l-gold' : 'text-l-gold/40'} />
                            <span className={`text-xs font-medium ${isSelected ? 'text-l-gold' : 'text-l-text'}`}>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Missing feature */}
                  <div>
                    <h3 className="text-lg font-bold text-l-navy mb-1 flex items-center gap-2">
                      <Lightbulb className="text-l-gold" size={20} />
                      الميزة الحاسمة
                    </h3>
                    <label className="block text-xs text-l-muted mb-3">
                      ما هي الميزة الناقصة التي إذا أضفناها، ستجعلك تعتمد على ميزان بشكل يومي؟
                    </label>
                    <input
                      type="text"
                      {...register('missing_feature')}
                      className="w-full bg-l-navy/5 border border-l-gold/20 rounded-xl p-4 text-l-navy focus:outline-none focus:border-l-gold focus:ring-1 focus:ring-l-gold transition-all"
                      placeholder="مثال: ربط مع تقويم جوجل، تقارير PDF، إشعارات واتساب..."
                    />
                  </div>

                  {/* General notes */}
                  <div>
                    <h3 className="text-lg font-bold text-l-navy mb-1 flex items-center gap-2">
                      <MessageSquare className="text-l-gold" size={20} />
                      ملاحظات إضافية
                    </h3>
                    <label className="block text-xs text-l-muted mb-3">أي ملاحظات أو اقتراحات أخرى تود مشاركتها (اختياري)</label>
                    <textarea
                      {...register('general_notes')}
                      rows={3}
                      className="w-full bg-l-navy/5 border border-l-gold/20 rounded-xl p-4 text-l-navy focus:outline-none focus:border-l-gold focus:ring-1 focus:ring-l-gold transition-all resize-none"
                      placeholder="اكتب أي ملاحظات إضافية..."
                    />
                  </div>

                  {/* Contact info */}
                  <div>
                    <label className="block text-sm font-medium text-l-navy mb-2">كيف يمكننا التواصل معك؟ (اختياري)</label>
                    <input
                      type="text"
                      {...register('contact_info')}
                      className="w-full bg-l-navy/5 border border-l-gold/20 rounded-xl p-4 text-l-navy focus:outline-none focus:border-l-gold focus:ring-1 focus:ring-l-gold transition-all"
                      placeholder="البريد الإلكتروني أو رقم الهاتف"
                    />
                    <p className="text-xs text-l-muted mt-1.5">لن نستخدم هذه المعلومة إلا للتواصل بخصوص ملاحظاتك إذا لزم الأمر.</p>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 border-2 border-l-gold/30 text-l-navy font-bold rounded-xl hover:bg-l-gold/5 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                    >
                      <ChevronRight size={18} />
                      السابق
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3.5 bg-gradient-l-gold text-l-navy font-bold rounded-xl hover:scale-105 hover:shadow-l-gold-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-l-navy/20 border-t-l-navy rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          إرسال الملاحظات
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
