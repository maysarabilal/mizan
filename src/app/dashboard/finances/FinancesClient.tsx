'use client'

import { useRouter } from 'next/navigation'
import { DollarSign, AlertCircle, Banknote, Landmark, CreditCard, ChevronLeft } from 'lucide-react'
import type { OfficeFinancialSummary } from '@/lib/actions/fees'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ₪'

const getPaymentStatus = (totalAmount: number, totalPaid: number) => {
  if (totalPaid === 0) return { label: 'لم يُدفع', color: 'bg-red-100 text-red-700 border-red-200' }
  if (totalPaid >= totalAmount) return { label: 'مكتمل', color: 'bg-green-100 text-green-700 border-green-200' }
  return { label: 'جزئي', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
}

export function FinancesClient({ data }: { data: OfficeFinancialSummary }) {
  const router = useRouter()
  
  const overdueCases = data.cases_with_fees.filter(c => c.remaining > 0).sort((a, b) => b.remaining - a.remaining)
  const allCases = data.cases_with_fees

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0F1724]">التقرير المالي</h1>
        <p className="text-[#64748B] mt-1 text-sm">نظرة شاملة على الأتعاب والمدفوعات لجميع القضايا</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4] relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 opacity-[0.03]">
            <Banknote size={120} className="text-[#1a2744]" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
              <Banknote size={20} />
            </div>
            <h3 className="font-medium text-[#64748B] text-sm">إجمالي الأتعاب</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#0F1724]">{formatCurrency(data.total_fees)}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4] relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 opacity-[0.03]">
            <Landmark size={120} className="text-[#1a2744]" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
              <Landmark size={20} />
            </div>
            <h3 className="font-medium text-[#64748B] text-sm">المحصّل</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#0F1724]">{formatCurrency(data.total_paid)}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4] relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 opacity-[0.03]">
            <CreditCard size={120} className="text-[#1a2744]" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
              <DollarSign size={20} />
            </div>
            <h3 className="font-medium text-[#64748B] text-sm">المتبقي للتحصيل</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#0F1724]">{formatCurrency(data.total_remaining)}</p>
        </div>
      </div>

      {/* Overdue Cases */}
      <div className="bg-white border border-[#eef0f4] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eef0f4] flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-[#0F1724]">القضايا المتأخرة في الدفع</h2>
          </div>
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {overdueCases.length} قضية
          </span>
        </div>
        
        {overdueCases.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">لا توجد قضايا متأخرة في الدفع</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-[#64748B] uppercase bg-gray-50/50 border-b border-[#eef0f4]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">القضية</th>
                    <th className="px-6 py-4 font-semibold">العميل</th>
                    <th className="px-6 py-4 font-semibold">الأتعاب</th>
                    <th className="px-6 py-4 font-semibold">المتبقي</th>
                    <th className="px-6 py-4 font-semibold">حالة الدفع</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef0f4]">
                  {overdueCases.map((c) => {
                    const status = getPaymentStatus(c.total_amount, c.total_paid)
                    return (
                      <tr 
                        key={c.case_id} 
                        onClick={() => router.push(`/dashboard/cases/${c.case_id}`)}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#0F1724]">{c.case_title}</div>
                          {c.case_number && <div className="text-xs text-[#64748B] mt-0.5">{c.case_number}</div>}
                        </td>
                        <td className="px-6 py-4 text-[#64748B]">{c.client_name || '-'}</td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(c.total_amount)}</td>
                        <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(c.remaining)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#C9A84C] transition-colors" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block sm:hidden divide-y divide-[#eef0f4]">
              {overdueCases.map((c) => {
                const status = getPaymentStatus(c.total_amount, c.total_paid)
                return (
                  <div
                    key={c.case_id}
                    onClick={() => router.push(`/dashboard/cases/${c.case_id}`)}
                    className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#0F1724] text-sm">{c.case_title}</div>
                        {c.case_number && <div className="text-xs text-[#64748B] mt-0.5">{c.case_number}</div>}
                        {c.client_name && <div className="text-xs text-[#64748B]">{c.client_name}</div>}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748B]">الأتعاب: <span className="font-medium text-[#0F1724]">{formatCurrency(c.total_amount)}</span></span>
                      <span className="text-red-600 font-bold">متبقي: {formatCurrency(c.remaining)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* All Cases */}
      <div className="bg-white border border-[#eef0f4] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eef0f4] bg-gray-50/50">
          <h2 className="text-base font-bold text-[#0F1724]">جميع القضايا</h2>
        </div>
        
        {allCases.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">لا توجد قضايا لديها أتعاب مسجلة بعد</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-[#64748B] uppercase bg-gray-50/50 border-b border-[#eef0f4]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">القضية</th>
                    <th className="px-6 py-4 font-semibold">العميل</th>
                    <th className="px-6 py-4 font-semibold">الأتعاب</th>
                    <th className="px-6 py-4 font-semibold">المدفوع</th>
                    <th className="px-6 py-4 font-semibold">المتبقي</th>
                    <th className="px-6 py-4 font-semibold">حالة الدفع</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef0f4]">
                  {allCases.map((c) => {
                    const status = getPaymentStatus(c.total_amount, c.total_paid)
                    return (
                      <tr 
                        key={c.case_id} 
                        onClick={() => router.push(`/dashboard/cases/${c.case_id}`)}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#0F1724]">{c.case_title}</div>
                          {c.case_number && <div className="text-xs text-[#64748B] mt-0.5">{c.case_number}</div>}
                        </td>
                        <td className="px-6 py-4 text-[#64748B]">{c.client_name || '-'}</td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(c.total_amount)}</td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">{formatCurrency(c.total_paid)}</td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(c.remaining)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#C9A84C] transition-colors" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block sm:hidden divide-y divide-[#eef0f4]">
              {allCases.map((c) => {
                const status = getPaymentStatus(c.total_amount, c.total_paid)
                return (
                  <div
                    key={c.case_id}
                    onClick={() => router.push(`/dashboard/cases/${c.case_id}`)}
                    className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#0F1724] text-sm">{c.case_title}</div>
                        {c.case_number && <div className="text-xs text-[#64748B] mt-0.5">{c.case_number}</div>}
                        {c.client_name && <div className="text-xs text-[#64748B]">{c.client_name}</div>}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#64748B]">الأتعاب</span>
                        <span className="font-semibold text-[#0F1724]">{formatCurrency(c.total_amount)}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#64748B]">المدفوع</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(c.total_paid)}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#64748B]">المتبقي</span>
                        <span className={`font-semibold ${c.remaining > 0 ? 'text-red-600' : 'text-[#0F1724]'}`}>{formatCurrency(c.remaining)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
