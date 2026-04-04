'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { confirmRequestPaymentAction, rejectUpgradeRequestAction } from '@/lib/actions/admin'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PendingPayments({ payments }: { payments: any[] }) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleConfirm = async (id: string) => {
    setProcessing(id)
    const { error } = await confirmRequestPaymentAction(id)
    setProcessing(null)

    if (error) {
      toast.error(error)
      return
    }
    toast.success('تم تأكيد الفاتورة وتسجيل الدفعة وتفعيل الاشتراك تلقائياً.')
  }

  const handleReject = async (id: string) => {
    if (!confirm('هل أنت متأكد من رفض هذه المعاملة؟ سيتم إغلاق طلب الترقية للمكتب.')) return

    setProcessing(id)
    const { error } = await rejectUpgradeRequestAction(id)
    setProcessing(null)

    if (error) {
      toast.error(error)
      return
    }
    toast.success('تم رفض المعاملة وإلغاء الطلب.')
  }

  if (payments.length === 0) {
    return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">لا توجد دفعات أو حوالات بنكية بانتظار التأكيد.</div>
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50 border-zinc-800">
            <TableHead className="text-right text-zinc-400">المكتب</TableHead>
            <TableHead className="text-right text-zinc-400">المبلغ</TableHead>
            <TableHead className="text-right text-zinc-400">الطريقة</TableHead>
            <TableHead className="text-right text-zinc-400">تاريخ المعاملة</TableHead>
            <TableHead className="text-center text-zinc-400">الإجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((pay) => (
            <TableRow key={pay.id} className="border-zinc-800 hover:bg-zinc-800/50">
              <TableCell className="font-semibold text-white">{pay.offices?.name}</TableCell>
              <TableCell className="font-bold text-emerald-400" dir="ltr">{pay.amount} ₪</TableCell>
              <TableCell className="text-sm text-zinc-300">
                {pay.payment_method === 'bank_transfer' ? 'حوالة بنكية' : pay.payment_method}
              </TableCell>
              <TableCell className="text-sm text-zinc-500" dir="ltr">
                {format(new Date(pay.created_at), 'yyyy/MM/dd')}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleConfirm(pay.id)}
                    disabled={processing === pay.id}
                  >
                    <CheckCircle className="w-4 h-4 me-1" /> تأكيد
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(pay.id)}
                    disabled={processing === pay.id}
                  >
                    <XCircle className="w-4 h-4 me-1" /> رفض
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
