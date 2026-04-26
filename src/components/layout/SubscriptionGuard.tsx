'use client'

import { type SubscriptionStatusData } from '@/lib/actions/subscription'
import { AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { signOutAction } from '@/lib/actions/auth'
import { LOCK_MESSAGES } from '@/lib/constants/messages'

import { usePathname } from 'next/navigation'

interface SubscriptionGuardProps {
  children: React.ReactNode
  data: SubscriptionStatusData
}

export function SubscriptionGuard({ children, data }: SubscriptionGuardProps) {
  const pathname = usePathname()
  
  const isOverageRemediationPath = pathname?.startsWith('/dashboard/team') || pathname?.startsWith('/dashboard/subscription')
  const isRemediationMode = !data.isValid && data.lockReason === 'MEMBER_OVERAGE_EXPIRED' && isOverageRemediationPath

  // Also apply remediation mode to EXPIRED trials/plans so they can access the billing page
  const isExpiredPlanRemediation = !data.isValid && data.lockReason === 'EXPIRED_PLAN' && pathname?.startsWith('/dashboard/subscription')

  // Plan is valid OR we are in remediation mode for specific routes
  if (data.isValid || isRemediationMode || isExpiredPlanRemediation) {
    return (
      <div className="relative flex flex-col min-h-screen">
        {data.status === 'past_due' && (
          <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 animate-in slide-in-from-top duration-300">
            <AlertTriangle className="w-4 h-4" />
            انتهى عرضك الحالي. لديك 3 أيام كفترة سماح لتجديد الاشتراك قبل توقف الخدمات.
            <Link href="/dashboard/subscription" className="underline ms-2 hover:opacity-80">تجديد الآن</Link>
          </div>
        )}
        {children}
      </div>
    )
  }

  // Account Locked (Expired or No Plan)
  // Account Locked (Expired, No Plan, Suspended, or Disabled)
  // Server-side blocking: we simply do NOT render children at all.
  
  let lockTitle = 'تم تجميد الحساب مؤقتاً'
  let lockMessage = ''
  
  switch (data.lockReason) {
    case 'EXPIRED_PLAN':
      lockMessage = LOCK_MESSAGES.EXPIRED_PLAN
      break
    case 'MEMBER_OVERAGE_EXPIRED':
      lockMessage = LOCK_MESSAGES.MEMBER_OVERAGE_EXPIRED
      break
    case 'OFFICE_SUSPENDED':
      lockTitle = 'تم تعليق حساب المكتب'
      lockMessage = LOCK_MESSAGES.OFFICE_SUSPENDED
      break
    case 'MEMBER_DISABLED':
      lockTitle = 'تم تعليق الحساب'
      lockMessage = LOCK_MESSAGES.MEMBER_DISABLED
      break
    default:
      lockMessage = 'الاشتراك غير فعال أو الحساب معلق.'
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
            <Lock className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{lockTitle}</h1>
          <p className="text-muted-foreground mb-8 text-balance">
            {lockMessage}
          </p>

          <div className="flex flex-col gap-3">
            {data.lockReason === 'EXPIRED_PLAN' && (
              <Link href="/dashboard/subscription" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-lg">
                  انتقل لصفحة التجديد
                </Button>
              </Link>
            )}

            {data.lockReason === 'MEMBER_OVERAGE_EXPIRED' && (
              <Link href="/dashboard/team" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-lg">
                  إدارة أعضاء الفريق
                </Button>
              </Link>
            )}
            
            <form action={signOutAction} className="w-full">
              <Button 
                type="submit"
                variant={data.lockReason === 'EXPIRED_PLAN' || data.lockReason === 'MEMBER_OVERAGE_EXPIRED' ? 'outline' : 'default'} 
                className={`w-full h-12 ${data.lockReason !== 'EXPIRED_PLAN' && data.lockReason !== 'MEMBER_OVERAGE_EXPIRED' ? 'bg-red-600 hover:bg-red-700 text-white text-lg' : ''}`}
              >
                تسجيل الخروج
              </Button>
            </form>
          </div>
          
          <p className="mt-6 text-xs text-muted-foreground">
            تواصل مع الدعم الفني إذا كنت تعتقد أن هناك خطأ.
          </p>
        </div>
      </div>
    </div>
  )
}
