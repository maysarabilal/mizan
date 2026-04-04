import { format } from 'date-fns'
import { Crown, Users, Calendar, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface SubscriptionOverviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any
  memberCount: number
}

export function SubscriptionOverview({ subscription, memberCount }: SubscriptionOverviewProps) {
  if (!subscription) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">لا يوجد اشتراك مفعّل!</h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">تجاوز المكتب الفترة التجريبية أو انتهت صلاحية الاشتراك. يرجى الترقية لتتمكن من إضافة مستخدمين أو الاستفادة من كافة خصائص النظام.</p>
        </CardContent>
      </Card>
    )
  }

  const { status, current_period_end, subscription_plans: plan } = subscription

  // Normally we would count ACTUAL users vs MAX users, but here we just show the limits
  const usersLimit = plan.max_users
  const isInfinite = usersLimit > 1000

  const statusMap: Record<string, { label: string, color: string }> = {
    'active': { label: 'فعال', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' },
    'trialing': { label: 'تجريبي', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' },
    'past_due': { label: 'متأخر الدفع', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' },
    'expired': { label: 'منتهي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
    'cancelled': { label: 'ملغى', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
    'pending': { label: 'معلق', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30' },
    'awaiting_payment': { label: 'بانتظار الدفع', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
  }

  const statusInfo = statusMap[status] || { label: status, color: 'bg-muted text-muted-foreground' }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-none">
        <CardHeader className="pb-2">
          <CardDescription className="text-primary font-medium flex justify-between items-center">
            الباقة الحالية

            <Badge variant="outline" className={`${statusInfo.color} font-normal border-transparent pointer-events-none`}>{statusInfo.label}</Badge>
          </CardDescription>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            {plan.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mt-2">
            تدفع بناءً على المفوترة المختارة. يتم تجديد الاشتراك تلقائياً ما لم يتم الإلغاء.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" /> أعضاء المكتب المسموح
          </CardDescription>
          <CardTitle className="text-2xl">
             {isInfinite ? 'غير محدود' : `الحد الأقصى: ${usersLimit} مستخدمين`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mt-2 mb-2">
            <span className="text-sm font-medium">{memberCount} مستخدم حالي</span>
            {!isInfinite && <span className="text-sm text-muted-foreground">{Math.round((memberCount / usersLimit) * 100)}%</span>}
          </div>
          {!isInfinite && <Progress value={Math.min(100, (memberCount / usersLimit) * 100)} className="h-2" />}
          <p className="text-xs text-muted-foreground mt-4">
             يمكنك ترقية الباقة لزيادة عدد المستفيدين من الحساب.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> الدورة المفوترة القادمة
          </CardDescription>
          <CardTitle className="text-2xl" dir="ltr">
             {format(new Date(current_period_end), 'MMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground mt-2">
              ستصلك فاتورة التجديد قبل موعد الاستحقاق بـ 3 أيام كحد أدنى.
           </p>
        </CardContent>
      </Card>
    </div>
  )
}
