'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  DollarSign, Plus, Trash2, Loader2, Edit, Receipt,
  Banknote, CreditCard, Landmark, Wallet,
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  getCaseFinancials,
  upsertCaseFeeAgreement,
  addPayment,
  deletePayment,
  addExpense,
  deleteExpense,
} from '@/lib/actions/fees'

interface CaseFinancialTabProps {
  caseId: string
  userRole: string
  canManageFees: boolean
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ₪'

const PAYMENT_METHODS = ['نقد', 'تحويل بنكي', 'شيك', 'بطاقة'] as const

function getMethodIcon(method: string) {
  switch (method) {
    case 'نقد': return <Banknote className="h-3.5 w-3.5" />
    case 'تحويل بنكي': return <Landmark className="h-3.5 w-3.5" />
    case 'شيك': return <Receipt className="h-3.5 w-3.5" />
    case 'بطاقة': return <CreditCard className="h-3.5 w-3.5" />
    default: return <Wallet className="h-3.5 w-3.5" />
  }
}

export function CaseFinancialTab({ caseId, userRole, canManageFees }: CaseFinancialTabProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [financials, setFinancials] = useState<{
    fee: { id: string; total_amount: number; notes: string | null } | null
    payments: { id: string; case_fee_id: string; amount: number; payment_date: string; payment_method: string; notes: string | null; created_at: string }[]
    expenses: { id: string; amount: number; expense_date: string; description: string; created_at: string }[]
    totalAmount: number; totalPaid: number; totalExpenses: number; remaining: number
  } | null>(null)

  // Dialog states
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string; type: 'payment' | 'expense' } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form states
  const [feeAmount, setFeeAmount] = useState('')
  const [feeNotes, setFeeNotes] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod] = useState<string>('نقد')
  const [payNotes, setPayNotes] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0])
  const [expDesc, setExpDesc] = useState('')

  const canManage = userRole === 'owner' || userRole === 'admin' || canManageFees
  const canDelete = userRole === 'owner' || userRole === 'admin'

  const loadFinancials = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await getCaseFinancials(caseId)
    if (error) toast.error(error)
    else setFinancials(data)
    setIsLoading(false)
  }, [caseId])

  useEffect(() => { loadFinancials() }, [loadFinancials])

  // ─── Handlers ───
  async function handleSaveFee() {
    const amount = parseFloat(feeAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return }
    setIsSaving(true)
    const { error } = await upsertCaseFeeAgreement(caseId, { total_amount: amount, notes: feeNotes || undefined })
    setIsSaving(false)
    if (error) { toast.error(error); return }
    toast.success('تم حفظ الأتعاب بنجاح')
    setFeeDialogOpen(false)
    await loadFinancials()
    router.refresh()
  }

  async function handleAddPayment() {
    if (!financials?.fee) return
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return }
    if (!payDate) { toast.error('يرجى اختيار التاريخ'); return }
    setIsSaving(true)
    const { error } = await addPayment(financials.fee.id, caseId, {
      amount, payment_date: payDate, payment_method: payMethod, notes: payNotes || undefined,
    })
    setIsSaving(false)
    if (error) { toast.error(error); return }
    toast.success('تم تسجيل الدفعة بنجاح')
    setPaymentDialogOpen(false)
    resetPaymentForm()
    await loadFinancials()
    router.refresh()
  }

  async function handleAddExpense() {
    const amount = parseFloat(expAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return }
    if (!expDesc.trim()) { toast.error('يرجى إدخال وصف المصروف'); return }
    setIsSaving(true)
    const { error } = await addExpense(caseId, { amount, expense_date: expDate, description: expDesc })
    setIsSaving(false)
    if (error) { toast.error(error); return }
    toast.success('تم إضافة المصروف بنجاح')
    setExpenseDialogOpen(false)
    resetExpenseForm()
    await loadFinancials()
    router.refresh()
  }

  async function handleDelete() {
    if (!confirmDeleteId) return
    setIsDeleting(true)
    const { error } = confirmDeleteId.type === 'payment'
      ? await deletePayment(confirmDeleteId.id, caseId)
      : await deleteExpense(confirmDeleteId.id, caseId)
    setIsDeleting(false)
    if (error) { toast.error(error); return }
    toast.success(confirmDeleteId.type === 'payment' ? 'تم حذف الدفعة' : 'تم حذف المصروف')
    setConfirmDeleteId(null)
    await loadFinancials()
    router.refresh()
  }

  function openFeeDialog() {
    setFeeAmount(financials?.fee ? String(financials.fee.total_amount) : '')
    setFeeNotes(financials?.fee?.notes || '')
    setFeeDialogOpen(true)
  }

  function resetPaymentForm() { setPayAmount(''); setPayDate(new Date().toISOString().split('T')[0]); setPayMethod('نقد'); setPayNotes('') }
  function resetExpenseForm() { setExpAmount(''); setExpDate(new Date().toISOString().split('T')[0]); setExpDesc('') }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  const progressPercent = financials && financials.totalAmount > 0
    ? Math.min(100, (financials.totalPaid / financials.totalAmount) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* ─── Summary Card ─── */}
      <div className="bg-gradient-to-br from-[#1A2744] to-[#243556] rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-40 h-40 bg-[#C9A84C]/10 rounded-full blur-3xl -ml-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#C9A84C]" />
              الملف المالي
            </h3>
            {canManage && (
              <Button
                size="sm"
                onClick={openFeeDialog}
                className="bg-[#C9A84C] hover:bg-[#B59640] text-[#1A2744] font-bold text-[12px] gap-1.5 h-8 px-4 border-none shadow-sm"
              >
                <Edit className="h-3 w-3" />
                {financials?.fee ? 'تعديل الأتعاب' : 'تحديد الأتعاب'}
              </Button>
            )}
          </div>

          {financials?.fee ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-white/50 text-[11px] mb-1">إجمالي الأتعاب</p>
                  <p className="text-[22px] font-bold">{formatCurrency(financials.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[11px] mb-1">المدفوع</p>
                  <p className="text-[22px] font-bold text-emerald-400">{formatCurrency(financials.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[11px] mb-1">المتبقي</p>
                  <p className="text-[22px] font-bold text-amber-400">{formatCurrency(financials.remaining)}</p>
                </div>
              </div>
              <div className="w-full bg-[#F0EAD6]/20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#F0EAD6] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-white/40 text-[11px] mt-2 text-end">{progressPercent.toFixed(0)}% محصّل</p>
              {financials.totalExpenses > 0 && (
                <p className="text-white/50 text-[12px] mt-2">المصاريف الإضافية: {formatCurrency(financials.totalExpenses)}</p>
              )}
              {financials.fee.notes && (
                <p className="text-white/40 text-[12px] mt-2 border-t border-white/10 pt-2">📝 {financials.fee.notes}</p>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/50 text-[14px]">لم يتم تحديد الأتعاب المتفق عليها بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Payments Section ─── */}
      <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-2">
            <Banknote className="h-[18px] w-[18px] text-[#9AA3B2]" />
            <span className="text-[15px] font-semibold text-[#0F1724]">الدفعات</span>
            <span className="bg-[#1A2744] text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {financials?.payments.length || 0}
            </span>
          </div>
          {canManage && financials?.fee && (
            <Button
              variant="outline" size="sm"
              onClick={() => { resetPaymentForm(); setPaymentDialogOpen(true) }}
              className="gap-2 border-black/10 text-[#0F1724] font-medium text-[13px]"
            >
              <Plus className="h-3.5 w-3.5" /> تسجيل دفعة
            </Button>
          )}
        </div>
        {!financials?.payments.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Banknote className="h-10 w-10 text-[#9AA3B2] opacity-30 mb-3" />
            <p className="font-medium text-[#0F1724] text-[15px]">لا توجد دفعات مسجلة بعد</p>
            {!financials?.fee && <p className="text-sm text-[#9AA3B2] mt-1">حدد الأتعاب أولاً لتسجيل الدفعات</p>}
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {financials.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFBFC] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    {getMethodIcon(p.payment_method)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[#0F1724]">{formatCurrency(Number(p.amount))}</span>
                    <div className="flex items-center gap-2 text-[12px] text-[#9AA3B2]">
                      <span>{format(new Date(p.payment_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      <span>•</span>
                      <span>{p.payment_method}</span>
                      {p.notes && <><span>•</span><span>{p.notes}</span></>}
                    </div>
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId({ id: p.id, type: 'payment' })}
                    className="shrink-0 p-2 rounded-md text-[#9AA3B2] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 max-md:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Expenses Section ─── */}
      <div className="bg-white border border-black/[0.08] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-2">
            <Receipt className="h-[18px] w-[18px] text-[#9AA3B2]" />
            <span className="text-[15px] font-semibold text-[#0F1724]">المصاريف والنفقات</span>
            <span className="bg-[#1A2744] text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {financials?.expenses.length || 0}
            </span>
          </div>
          {canManage && (
            <Button
              variant="outline" size="sm"
              onClick={() => { resetExpenseForm(); setExpenseDialogOpen(true) }}
              className="gap-2 border-black/10 text-[#0F1724] font-medium text-[13px]"
            >
              <Plus className="h-3.5 w-3.5" /> إضافة مصروف
            </Button>
          )}
        </div>
        
        <div className="mx-6 mt-4 mb-2 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="text-[16px] leading-none">ℹ️</span>
          <span className="leading-relaxed">
            الأتعاب المتفق عليها تشمل أتعاب المحامي والمصاريف معاً.
            هذا الجدول لتوثيق تفاصيل المصاريف فقط للرجوع إليها.
          </span>
        </div>

        {!financials?.expenses.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Receipt className="h-10 w-10 text-[#9AA3B2] opacity-30 mb-3" />
            <p className="font-medium text-[#0F1724] text-[15px]">لا توجد مصاريف مسجلة بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {financials.expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFBFC] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[#0F1724]">{formatCurrency(Number(e.amount))}</span>
                    <div className="flex items-center gap-2 text-[12px] text-[#9AA3B2]">
                      <span>{format(new Date(e.expense_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      <span>•</span>
                      <span>{e.description}</span>
                    </div>
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId({ id: e.id, type: 'expense' })}
                    className="shrink-0 p-2 rounded-md text-[#9AA3B2] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 max-md:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Fee Agreement Dialog ─── */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-[#0F1724]">
              {financials?.fee ? 'تعديل الأتعاب المتفق عليها' : 'تحديد الأتعاب المتفق عليها'}
            </DialogTitle>
            <DialogDescription>حدد إجمالي مبلغ الأتعاب المتفق عليه مع الموكل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-[13px]">المبلغ الإجمالي (₪)</Label>
              <Input type="number" min="0" step="0.01" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="مثال: 5000" className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-[13px]">ملاحظات (اختياري)</Label>
              <Input value={feeNotes} onChange={(e) => setFeeNotes(e.target.value)} placeholder="ملاحظات حول الاتفاق" className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" size="sm" onClick={() => setFeeDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleSaveFee} disabled={isSaving} className="bg-[#1A2744] hover:bg-[#243556]">
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Payment Dialog ─── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-[#0F1724]">تسجيل دفعة جديدة</DialogTitle>
            <DialogDescription>سجّل دفعة من الموكل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-[13px]">المبلغ (₪)</Label>
              <Input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="مثال: 1000" className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-[13px]">التاريخ</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-[13px]">طريقة الدفع</Label>
              <Select value={payMethod} onValueChange={(v) => v && setPayMethod(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px]">ملاحظات (اختياري)</Label>
              <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="ملاحظات" className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" size="sm" onClick={() => setPaymentDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleAddPayment} disabled={isSaving} className="bg-[#1A2744] hover:bg-[#243556]">
              {isSaving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Expense Dialog ─── */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-[#0F1724]">إضافة مصروف</DialogTitle>
            <DialogDescription>سجّل مصروفاً متعلقاً بالقضية</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-[13px]">المبلغ (₪)</Label>
              <Input type="number" min="0" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="مثال: 200" className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-[13px]">التاريخ</Label>
              <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-[13px]">الوصف</Label>
              <Input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="مثال: رسوم تسجيل محكمة" className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" size="sm" onClick={() => setExpenseDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleAddExpense} disabled={isSaving} className="bg-[#1A2744] hover:bg-[#243556]">
              {isSaving ? 'جاري الإضافة...' : 'إضافة المصروف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => !v && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-[16px]">
              <Trash2 className="h-5 w-5" /> تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا {confirmDeleteId?.type === 'payment' ? 'الدفعة' : 'المصروف'}؟ لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>تراجع</Button>
            <Button variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
