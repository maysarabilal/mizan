'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { approveUpgradeRequestAction, rejectUpgradeRequestAction } from '@/lib/actions/admin'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PendingRequests({ requests }: { requests: any[] }) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const pending = requests.filter(r => r.status === 'pending')
  const history = requests.filter(r => r.status !== 'pending')

  const displayRequests = showHistory ? history : pending
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApprove = async (req: any) => {
    setProcessing(req.id)
    const { error } = await approveUpgradeRequestAction(req.id)
    setProcessing(null)

    if (error) {
      toast.error(error)
      return
    }
    toast.success('تمت الموافقة وتفعيل الاشتراك للمكتب بنجاح.')
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    const { error } = await rejectUpgradeRequestAction(id)
    setProcessing(null)

    if (error) {
      toast.error(error)
      return
    }
    toast.success('تم رفض طلب الترقية.')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">مكتمل</Badge>
      case 'rejected': return <Badge className="bg-red-900/30 text-red-400 border-red-800">مرفوض</Badge>
      case 'awaiting_payment': return <Badge className="bg-amber-900/30 text-amber-400 border-amber-800">بانتظار الدفع</Badge>
      default: return <Badge variant="outline" className="border-zinc-700 text-zinc-400">معلق</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          {showHistory ? 'عرض الطلبات المعلقة' : 'عرض سجل الطلبات'}
        </Button>
      </div>

      <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-800/50 border-zinc-800">
              <TableHead className="text-right text-zinc-400">المكتب</TableHead>
              <TableHead className="text-right text-zinc-400">الباقة المطلوبة</TableHead>
              <TableHead className="text-right text-zinc-400">التكلفة / الدورة</TableHead>
              <TableHead className="text-right text-zinc-400">تاريخ الطلب</TableHead>
              <TableHead className="text-center text-zinc-400">{showHistory ? 'الحالة' : 'الإجراءات'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRequests.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={5} className="p-12 text-center text-zinc-500">
                  لا توجد طلبات في هذا القسم.
                </TableCell>
              </TableRow>
            ) : (
              displayRequests.map((req) => (
                <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-semibold text-white">{req.offices?.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200">{req.subscription_plans?.name}</span>
                      <span className="text-xs text-zinc-500">{req.subscription_plans?.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-zinc-200" dir="ltr">{req.subscription_plans?.price_ils} ₪</TableCell>
                  <TableCell className="text-sm text-zinc-500" dir="ltr">
                    {format(new Date(req.created_at), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell className="text-center">
                    {showHistory ? (
                      getStatusBadge(req.status)
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-400 border-emerald-800 hover:bg-emerald-900/30 hover:text-emerald-300 disabled:opacity-50 h-8"
                          disabled={processing === req.id}
                          onClick={() => handleApprove(req)}
                        >
                          <CheckCircle2 className="w-4 h-4 me-1" /> موافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 disabled:opacity-50 h-8"
                          disabled={processing === req.id}
                          onClick={() => handleReject(req.id)}
                        >
                          <XCircle className="w-4 h-4 me-1" /> رفض
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
