'use client'

import { useState } from 'react'
import { useInView } from '@/hooks/useInView'

const tabs = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'cases', label: 'القضايا' },
  { id: 'sessions', label: 'الجلسات' },
  { id: 'tasks', label: 'المهام' },
  { id: 'fees', label: 'الأتعاب' },
]

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-l-mockup bg-l-navy border border-l-gold/10">
      {/* Browser Top Bar */}
      <div className="bg-l-charcoal px-4 py-3 flex items-center gap-3 border-b border-l-gold/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-l-crimson" />
          <div className="w-3 h-3 rounded-full bg-l-gold" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-l-navy rounded-md px-4 py-1.5 text-xs text-l-muted text-center">
            app.mizan.law/dashboard
          </div>
        </div>
      </div>
      <div className="bg-[#0A1118] p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">{children}</div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <MockupFrame>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'القضايا النشطة', value: '24', color: 'text-l-gold' },
          { label: 'الجلسات هذا الأسبوع', value: '7', color: 'text-l-gold-light' },
          { label: 'المهام المعلقة', value: '12', color: 'text-orange-400' },
          { label: 'الأتعاب المستحقة', value: '15,000 ₪', color: 'text-emerald-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-l-charcoal rounded-lg p-3 border border-l-gold/10">
            <p className="text-[10px] sm:text-xs text-l-gold-light/80 mb-1">{kpi.label}</p>
            <p className={`text-lg sm:text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-l-charcoal rounded-lg p-4 border border-l-gold/10 mb-6">
        <p className="text-xs text-l-gold-light/80 mb-4">القضايا بالشهر</p>
        <div className="flex items-end justify-between gap-2 h-24 sm:h-32">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-l-gold-dark to-l-gold rounded-t-sm transition-all hover:brightness-110" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-l-muted"><span>يناير</span><span>يونيو</span><span>ديسمبر</span></div>
      </div>
      <div className="bg-l-charcoal rounded-lg p-4 border border-l-gold/10">
        <p className="text-xs text-l-muted mb-3">الجلسات القادمة</p>
        {[
          { case: 'قضية أحمد محمد vs الشركة', date: '15 مايو 2026', court: 'محكمة نابلس' },
          { case: 'قضية إيجار سكني', date: '18 مايو 2026', court: 'محكمة رام الله' },
          { case: 'نزاع تجاري - شركه التقنية', date: '22 مايو 2026', court: 'محكمة القدس' },
        ].map((session, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-l-gold/5 last:border-0">
            <div>
              <p className="text-xs sm:text-sm text-l-text">{session.case}</p>
              <p className="text-[10px] text-l-gold-light/60">{session.court}</p>
            </div>
            <span className="text-[10px] sm:text-xs text-l-gold">{session.date}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function CasesMockup() {
  const casesData = [
    { id: '2026-42', client: 'أحمد محمد خالد', type: 'تجاري', court: 'نابلس', status: 'نشطة', statusColor: 'bg-emerald-500/20 text-emerald-400' },
    { id: '2026-38', client: 'سارة أحمد حسين', type: 'مدني', court: 'رام الله', status: 'معلقة', statusColor: 'bg-orange-500/20 text-orange-400' },
    { id: '2026-35', client: 'شركة الأمل للتجارة', type: 'تجاري', court: 'القدس', status: 'نشطة', statusColor: 'bg-emerald-500/20 text-emerald-400' },
    { id: '2026-31', client: 'محمد إبراهيم سمير', type: 'جنائي', court: 'نابلس', status: 'مغلقة', statusColor: 'bg-l-crimson/30 text-red-400' },
    { id: '2026-28', client: 'ليلى محمود عمر', type: 'مدني', court: 'رام الله', status: 'نشطة', statusColor: 'bg-emerald-500/20 text-emerald-400' },
  ]
  return (
    <MockupFrame>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-l-muted border-b border-l-gold/10">
              <th className="text-right py-2 px-2">رقم القضية</th>
              <th className="text-right py-2 px-2">الموكل</th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">النوع</th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">المحكمة</th>
              <th className="text-right py-2 px-2">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {casesData.map((c) => (
              <tr key={c.id} className="text-xs sm:text-sm border-b border-l-gold/5 hover:bg-l-gold/[0.03]">
                <td className="py-3 px-2 text-l-gold">{c.id}</td>
                <td className="py-3 px-2 text-l-text">{c.client}</td>
                <td className="py-3 px-2 text-l-muted hidden sm:table-cell">{c.type}</td>
                <td className="py-3 px-2 text-l-gold-light/70 hidden sm:table-cell">{c.court}</td>
                <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-[10px] ${c.statusColor}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockupFrame>
  )
}

function SessionsMockup() {
  const days = Array.from({ length: 35 }, (_, i) => i - 3)
  const sessionDays = [5, 12, 15, 18, 22, 25, 28]
  return (
    <MockupFrame>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-l-text">مايو 2026</p>
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded bg-l-gold/10 flex items-center justify-center text-[10px] text-l-muted">&#8592;</div>
          <div className="w-6 h-6 rounded bg-l-gold/10 flex items-center justify-center text-[10px] text-l-muted">&#8594;</div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map((d) => (
          <div key={d} className="text-center text-[10px] text-l-muted py-2">{d}</div>
        ))}
        {days.map((day, i) => {
          const dayNum = day > 0 && day <= 31 ? day : null
          const hasSession = dayNum && sessionDays.includes(dayNum)
          return (
            <div key={i} className={`relative aspect-square flex items-center justify-center rounded-lg text-xs ${hasSession ? 'bg-l-gold/15 text-l-gold cursor-pointer hover:bg-l-gold/25' : dayNum ? 'text-l-text hover:bg-l-gold/5' : ''
              }`}>
              {dayNum}
              {hasSession && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-l-gold" />}
            </div>
          )
        })}
      </div>
    </MockupFrame>
  )
}

function TasksMockup() {
  const columns = [
    { title: 'قيد الانتظار', color: 'border-t-orange-400', tasks: [{ title: 'مراجعة عقد إيجار', client: 'أحمد محمد' }, { title: 'تحضير مذكرة دفاع', client: 'شركة الأمل' }] },
    { title: 'جارية', color: 'border-t-l-gold', tasks: [{ title: 'جلسة استماع - قضية 42', client: 'أحمد محمد' }, { title: 'متابعة حكم - نزاع تجاري', client: 'شركة التقنية' }, { title: 'رفع طلب استئناف', client: 'سارة أحمد' }] },
    { title: 'مكتملة', color: 'border-t-emerald-400', tasks: [{ title: 'صياغة لائحة دعوى', client: 'محمد إبراهيم' }] },
  ]
  return (
    <MockupFrame>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {columns.map((col) => (
          <div key={col.title} className={`bg-l-charcoal rounded-lg border-t-2 ${col.color} p-3`}>
            <p className="text-xs text-l-text font-medium mb-3 text-center">{col.title}</p>
            {col.tasks.map((task, i) => (
              <div key={i} className="bg-[#0A1118] rounded p-2 mb-2 border border-l-gold/5">
                <p className="text-[10px] sm:text-xs text-l-text">{task.title}</p>
                <p className="text-[10px] text-l-muted">{task.client}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function FeesMockup() {
  const feesData = [
    { client: 'أحمد محمد خالد', total: '25,000', paid: '15,000', remaining: '10,000', status: 'جزئي', statusColor: 'bg-orange-500/20 text-orange-400' },
    { client: 'شركة الأمل', total: '45,000', paid: '45,000', remaining: '0', status: 'مدفوع', statusColor: 'bg-emerald-500/20 text-emerald-400' },
    { client: 'سارة أحمد حسين', total: '12,000', paid: '0', remaining: '12,000', status: 'معلق', statusColor: 'bg-l-crimson/30 text-red-400' },
    { client: 'محمد إبراهيم', total: '30,000', paid: '20,000', remaining: '10,000', status: 'جزئي', statusColor: 'bg-orange-500/20 text-orange-400' },
  ]
  return (
    <MockupFrame>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-l-muted border-b border-l-gold/10">
              <th className="text-right py-2 px-2">الموكل</th>
              <th className="text-right py-2 px-2">المبلغ</th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">المدفوع</th>
              <th className="text-right py-2 px-2">المتبقي</th>
              <th className="text-right py-2 px-2">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {feesData.map((f, i) => (
              <tr key={i} className="text-xs sm:text-sm border-b border-l-gold/5">
                <td className="py-3 px-2 text-l-text">{f.client}</td>
                <td className="py-3 px-2 text-l-gold">&#8362;{f.total}</td>
                <td className="py-3 px-2 text-emerald-400 hidden sm:table-cell">&#8362;{f.paid}</td>
                <td className="py-3 px-2 text-l-text">&#8362;{f.remaining}</td>
                <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-[10px] ${f.statusColor}`}>{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockupFrame>
  )
}

export default function ScreenshotsSection() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { ref, isInView } = useInView(0.15)

  const renderMockup = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardMockup />
      case 'cases': return <CasesMockup />
      case 'sessions': return <SessionsMockup />
      case 'tasks': return <TasksMockup />
      case 'fees': return <FeesMockup />
      default: return <DashboardMockup />
    }
  }

  return (
    <section id="screenshots" className="bg-l-parchment py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`font-cormorant text-3xl sm:text-4xl text-l-navy mb-5 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
            شاهد ميزان بنفسك
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-l-gold to-transparent mx-auto mb-5 opacity-70" />
          <p className={`text-l-muted text-base transition-all duration-700 delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
            واجهة مصممة بعناية لتمنحك السيطرة الكاملة على مكتبك
          </p>
        </div>

        {/* Desktop Tabs */}
        <div className={`hidden md:flex justify-center gap-2 mb-10 transition-all duration-700 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-l-gold text-l-navy' : 'border border-l-gold/30 text-l-gold hover:bg-l-gold/10'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile Select */}
        <div className="md:hidden mb-6">
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 rounded-lg bg-white border border-l-gold/30 text-l-navy text-right"
          >
            {tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
          </select>
        </div>
        <p className="md:hidden text-center text-l-muted text-xs mb-4">لتجربة كاملة استخدم جهاز كمبيوتر</p>

        <div className={`transition-all duration-700 delay-400 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="max-w-[900px] mx-auto">{renderMockup()}</div>
        </div>
      </div>
    </section>
  )
}
