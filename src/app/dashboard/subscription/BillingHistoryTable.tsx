import { format } from 'date-fns'
import { Database } from '@/types/database'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type PaymentRow = Database['public']['Tables']['payments']['Row']

export function BillingHistoryTable({ payments }: { payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return (
      <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
        لا يوجد سجل فواتير مسجل لهذا المكتب حتى الآن.
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 font-normal hover:bg-emerald-200">مؤكد</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 font-normal hover:bg-amber-200">معلق (قيد المراجعة)</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 font-normal hover:bg-red-200">فشل / متأخر</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="border rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold w-[200px]">المعرف (الفاتورة)</TableHead>
            <TableHead className="text-right font-bold">التاريخ</TableHead>
            <TableHead className="text-right font-bold">طريقة الدفع</TableHead>
            <TableHead className="text-right font-bold">الحالة</TableHead>
            <TableHead className="text-left font-bold">المبلغ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
              <TableCell>
                <code className="text-xs text-muted-foreground uppercase">{payment.id.split('-')[0]}</code>
              </TableCell>
              <TableCell className="text-sm">
                <span dir="ltr">{format(new Date(payment.created_at), 'yyyy/MM/dd HH:mm')}</span>
              </TableCell>
              <TableCell className="text-sm">
                {payment.payment_method === 'bank_transfer' ? 'حوالة بنكية' : 'بطاقة ائتمانية'}
              </TableCell>
              <TableCell>
                {getStatusBadge(payment.status)}
              </TableCell>
              <TableCell className="text-left font-bold" dir="ltr">
                ₪ {payment.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
