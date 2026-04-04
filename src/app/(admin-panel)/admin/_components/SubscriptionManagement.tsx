'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Check, X, FileCheck, CreditCard, History, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

import { approveUpgradeRequestAction, rejectUpgradeRequestAction, confirmRequestPaymentAction } from '@/lib/actions/admin'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Tab = 'pending' | 'awaiting' | 'history'

const TABS: { key: Tab; label: string; icon: typeof FileCheck }[] = [
  { key: 'pending', label: 'بانتظار المراجعة', icon: FileCheck },
  { key: 'awaiting', label: 'بانتظار الدفع', icon: CreditCard },
  { key: 'history', label: 'السجل الكامل', icon: History },
]

function getRequestStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-900/30 text-amber-400 border-amber-800">معلق</Badge>
    case 'awaiting_payment':
      return <Badge className="bg-orange-900/30 text-orange-400 border-orange-800">بانتظار الدفع</Badge>
    case 'completed':
      return <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">مكتمل</Badge>
    case 'rejected':
      return <Badge className="bg-red-900/30 text-red-400 border-red-800">مرفوض</Badge>
    default:
      return <Badge variant="outline" className="border-zinc-700 text-zinc-400">{status}</Badge>
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SubscriptionManagement({ requests, totalRevenue }: { requests: any[]; totalRevenue: number }) {
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const pending = requests.filter(r => r.status === 'pending')
  const awaiting = requests.filter(r => r.status === 'awaiting_payment')
  const history = requests.filter(r => ['completed', 'rejected', 'cancelled'].includes(r.status))

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId)
    const { error } = await approveUpgradeRequestAction(requestId)
    setProcessing(null)
    if (error) { toast.error(error); return }
    toast.success('تم قبول الطلب — بانتظار تأكيد الدفع.')
  }

  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    const { error } = await rejectUpgradeRequestAction(requestId)
    setProcessing(null)
    if (error) { toast.error(error); return }
    toast.success('تم رفض الطلب.')
  }

  const handleConfirmPayment = async (requestId: string) => {
    setProcessing(requestId)
    const { error } = await confirmRequestPaymentAction(requestId)
    setProcessing(null)
    if (error) { toast.error(error); return }
    toast.success('تم تأكيد الدفع وتفعيل الاشتراك بنجاح.')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
        {TABS.map(tab => {
          const count = tab.key === 'pending' ? pending.length
            : tab.key === 'awaiting' ? awaiting.length
            : history.length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center',
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <PendingTab requests={pending} processing={processing} onApprove={handleApprove} onReject={handleReject} />
      )}
      {activeTab === 'awaiting' && (
        <AwaitingTab requests={awaiting} processing={processing} onConfirm={handleConfirmPayment} onReject={handleReject} />
      )}
      {activeTab === 'history' && (
        <HistoryTab requests={history} totalRevenue={totalRevenue} />
      )}
    </div>
  )
}

// ────────────────────────────────────────────
//   TAB 1: Pending Review
// ────────────────────────────────────────────

function PendingTab({ requests, processing, onApprove, onReject }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requests: any[]
  processing: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  if (requests.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
        <FileCheck className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
        <p>لا توجد طلبات ترقية معلقة حالياً.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50 border-zinc-800">
            <TableHead className="text-right text-zinc-400">المكتب</TableHead>
            <TableHead className="text-right text-zinc-400">الباقة المطلوبة</TableHead>
            <TableHead className="text-right text-zinc-400">المبلغ (₪)</TableHead>
            <TableHead className="text-right text-zinc-400">مقدم الطلب</TableHead>
            <TableHead className="text-right text-zinc-400">التاريخ</TableHead>
            <TableHead className="text-center text-zinc-400">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(req => (
            <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
              <TableCell className="font-semibold text-white">{req.offices?.name || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  {req.subscription_plans?.name || '-'}
                </Badge>
                <span className="text-[10px] text-zinc-500 ms-2">
                  {req.subscription_plans?.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}
                </span>
              </TableCell>
              <TableCell className="font-medium text-zinc-300" dir="ltr">
                ₪ {req.subscription_plans?.price_ils || 0}
              </TableCell>
              <TableCell className="text-sm text-zinc-300">{req.profiles?.full_name || '-'}</TableCell>
              <TableCell className="text-xs text-zinc-500" dir="ltr">
                {format(new Date(req.created_at), 'yyyy/MM/dd')}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1.5"
                    disabled={processing === req.id}
                    onClick={() => onApprove(req.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    قبول
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 gap-1.5"
                    disabled={processing === req.id}
                    onClick={() => onReject(req.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    رفض
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ────────────────────────────────────────────
//   TAB 2: Awaiting Payment
// ────────────────────────────────────────────

function AwaitingTab({ requests, processing, onConfirm, onReject }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requests: any[]
  processing: string | null
  onConfirm: (id: string) => void
  onReject: (id: string) => void
}) {
  if (requests.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
        <CreditCard className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
        <p>لا توجد طلبات بانتظار تأكيد الدفع.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50 border-zinc-800">
            <TableHead className="text-right text-zinc-400">المكتب</TableHead>
            <TableHead className="text-right text-zinc-400">الباقة المطلوبة</TableHead>
            <TableHead className="text-right text-zinc-400">المبلغ (₪)</TableHead>
            <TableHead className="text-right text-zinc-400">مقدم الطلب</TableHead>
            <TableHead className="text-right text-zinc-400">التاريخ</TableHead>
            <TableHead className="text-center text-zinc-400">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(req => (
            <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
              <TableCell className="font-semibold text-white">{req.offices?.name || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  {req.subscription_plans?.name || '-'}
                </Badge>
                <span className="text-[10px] text-zinc-500 ms-2">
                  {req.subscription_plans?.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}
                </span>
              </TableCell>
              <TableCell className="font-medium text-zinc-300" dir="ltr">
                ₪ {req.subscription_plans?.price_ils || 0}
              </TableCell>
              <TableCell className="text-sm text-zinc-300">{req.profiles?.full_name || '-'}</TableCell>
              <TableCell className="text-xs text-zinc-500" dir="ltr">
                {format(new Date(req.created_at), 'yyyy/MM/dd')}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white h-8 gap-1.5"
                    disabled={processing === req.id}
                    onClick={() => onConfirm(req.id)}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    تأكيد الدفع
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 gap-1.5"
                    disabled={processing === req.id}
                    onClick={() => onReject(req.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    رفض
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ────────────────────────────────────────────
//   TAB 3: Full History
// ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HistoryTab({ requests, totalRevenue }: { requests: any[]; totalRevenue: number }) {
  if (requests.length === 0 && totalRevenue === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
        <History className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
        <p>لا يوجد سجل طلبات سابقة.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-800/50 border-zinc-800">
              <TableHead className="text-right text-zinc-400">المكتب</TableHead>
              <TableHead className="text-right text-zinc-400">الباقة</TableHead>
              <TableHead className="text-right text-zinc-400">المبلغ (₪)</TableHead>
              <TableHead className="text-right text-zinc-400">الحالة</TableHead>
              <TableHead className="text-right text-zinc-400">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map(req => (
              <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-semibold text-white">{req.offices?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    {req.subscription_plans?.name || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-zinc-300" dir="ltr">
                  {req.status === 'completed' ? `₪ ${req.subscription_plans?.price_ils || 0}` : '-'}
                </TableCell>
                <TableCell>{getRequestStatusBadge(req.status)}</TableCell>
                <TableCell className="text-xs text-zinc-500" dir="ltr">
                  {format(new Date(req.updated_at || req.created_at), 'yyyy/MM/dd')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revenue Summary */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10">
            <Banknote className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">إجمالي الإيرادات المؤكدة</p>
            <p className="text-xs text-zinc-500">مجموع جميع الدفعات المؤكدة على المنصة</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-400" dir="ltr">
          ₪ {totalRevenue.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
