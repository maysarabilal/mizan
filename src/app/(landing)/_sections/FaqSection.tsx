'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'هل ميزان مناسب للمحامي المستقل؟',
    answer: 'بالتأكيد. تم تصميم ميزان ليتناسب مع احتياجات المحامي الفردي والمكاتب الكبيرة على حد سواء. يمكنك إدارة قضاياك وجلساتك وعملائك بكل سهولة وبساطة.'
  },
  {
    question: 'هل يمكنني رفع المستندات والوثائق؟',
    answer: 'نعم، يمكنك إرفاق الملفات والمستندات الخاصة بكل قضية أو جلسة. نوفر مساحة تخزين سحابية آمنة تتيح لك الوصول لملفاتك من أي مكان وفي أي وقت.'
  },
  {
    question: 'كيف يتم تأمين وحماية البيانات؟',
    answer: 'نحن نأخذ الخصوصية والأمان على محمل الجد. نستخدم تقنيات تشفير متطورة وقواعد بيانات معزولة (Multi-tenancy) لضمان عدم وصول أي طرف غير مخول لبيانات مكتبك.'
  },
  {
    question: 'هل يوجد تطبيق للهاتف المحمول؟',
    answer: 'منصة ميزان مصممة لتكون متجاوبة بالكامل مع كافة الشاشات. يمكنك استخدامها من متصفح الهاتف بنفس كفاءة الحاسوب، ونحن نعمل حالياً على تطوير تطبيق مخصص للهواتف قريباً.'
  },
  {
    question: 'هل يمكنني تجربة المنصة قبل الاشتراك؟',
    answer: 'نعم، نحن حالياً في مرحلة الإطلاق التجريبي (Beta)، مما يتيح لك تجربة المنصة والمساهمة في تطويرها بملاحظاتك القيمة مجاناً لفترة محدودة.'
  }
]

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-l-navy relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-l-gold/5 blur-[120px] rounded-full" />
      
      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-l-gold/10 rounded-2xl text-l-gold">
              <HelpCircle size={32} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gradient-l-gold mb-4 font-cormorant">
            الأسئلة الشائعة
          </h2>
          <p className="text-l-muted text-lg">
            كل ما تحتاج معرفته عن منصة ميزان
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border border-l-gold/15 rounded-2xl overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'bg-l-navy-light/50 border-l-gold/30 shadow-lg' : 'hover:border-l-gold/25'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-right cursor-pointer"
              >
                <span className={`text-lg font-semibold transition-colors duration-300 ${
                  openIndex === index ? 'text-l-gold' : 'text-l-text'
                }`}>
                  {faq.question}
                </span>
                <ChevronDown 
                  size={20} 
                  className={`text-l-gold transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 pt-0 text-l-muted leading-relaxed border-t border-l-gold/5">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
