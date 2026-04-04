'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Building2, Users, Power, PowerOff, UserCog, Mail, Phone, ChevronDown, ChevronUp, AlertTriangle, UserX, UserCheck, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { toggleOfficeActiveAction, adminToggleMemberStatusAction } from '@/lib/actions/admin'
import { cn } from '@/lib/utils'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'


import { ManualOverrideModal } from './ManualOverrideModal'

type FilterOption = 'all' | 'active' | 'suspended' | 'expired' | 'overage'

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالك',
  admin: 'مدير',
  lawyer: 'محامي',
  secretary: 'سكرتارية',
  trainee: 'متدرب'
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OfficesDirectory({ offices }: { offices: any[] }) {
  const [processing, setProcessing] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingOffice, setEditingOffice] = useState<any | null>(null)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const newSet = new Set(expandedRows)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedRows(newSet)
  }

  const handleToggleActive = async (officeId: string, currentStatus: boolean) => {
    setProcessing(officeId)
    const { error } = await toggleOfficeActiveAction(officeId, !currentStatus)
    setProcessing(null)
    if (error) { toast.error(error); return }
    toast.success(currentStatus ? 'تم تعطيل المكتب بنجاح.' : 'تم تفعيل المكتب بنجاح.')
  }

  const handleToggleMember = async (memberId: string, isActive: boolean) => {
    setProcessing(memberId)
    const { error } = await adminToggleMemberStatusAction(memberId, isActive)
    setProcessing(null)
    if (error) { toast.error(error); return }
    toast.success(isActive ? 'تم تفعيل العضو.' : 'تم تعطيل العضو.')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">فعال</Badge>
      case 'trialing': return <Badge className="bg-blue-900/30 text-blue-400 border-blue-800">تجريبي</Badge>
      case 'past_due': return <Badge className="bg-amber-900/30 text-amber-400 border-amber-800">متأخر الدفع</Badge>
      case 'expired': return <Badge className="bg-red-900/30 text-red-400 border-red-800">منتهي</Badge>
      case 'cancelled': return <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">ملغى</Badge>
      case 'pending': return <Badge className="bg-sky-900/30 text-sky-400 border-sky-800">معلق</Badge>
      case 'awaiting_payment': return <Badge className="bg-orange-900/30 text-orange-400 border-orange-800">بانتظار الدفع</Badge>
      default: return <Badge variant="outline" className="border-zinc-700 text-zinc-400">غير محدد</Badge>
    }
  }

  const filteredOffices = useMemo(() => {
    return offices.filter((o) => {
      const sub = Array.isArray(o.office_subscriptions) ? o.office_subscriptions[0] : o.office_subscriptions
      const status = sub?.status
      if (filter === 'all') return true
      if (filter === 'active') return o.is_active === true && ['trialing', 'active', 'past_due'].includes(status)
      if (filter === 'suspended') return o.is_active === false
      if (filter === 'expired') return ['expired', 'cancelled'].includes(status)
      if (filter === 'overage') return !!o.overage
      return true
    })
  }, [offices, filter])

  if (offices.length === 0) {
    return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">لا توجد مكاتب مسجلة في النظام.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800/80 w-fit">
        {(['all', 'active', 'suspended', 'expired', 'overage'] as FilterOption[]).map((f) => {
          const labels: Record<FilterOption, string> = { all: 'الكل', active: 'نشط', suspended: 'موقوف', expired: 'منتهي الاشتراك', overage: 'تجاوز الحد' }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                filter === f ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                f === 'overage' && 'text-red-400'
              )}
            >
              {labels[f]}
            </button>
          )
        })}
      </div>

      <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-800/50 border-zinc-800">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-right text-zinc-400">اسم المكتب</TableHead>
              <TableHead className="text-right text-zinc-400">تاريخ الإنشاء</TableHead>
              <TableHead className="text-right text-zinc-400">الباقة الحالية</TableHead>
              <TableHead className="text-right text-zinc-400">الاستخدام</TableHead>
              <TableHead className="text-right text-zinc-400">حالة الاشتراك</TableHead>
              <TableHead className="text-right text-zinc-400">انتهاء الصلاحية</TableHead>
              <TableHead className="text-center text-zinc-400">إجراءات الإدارة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffices.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                   لا توجد نتائج تطابق الفلتر المحدد.
                 </TableCell>
               </TableRow>
            ) : filteredOffices.map((office) => {
              const sub = Array.isArray(office.office_subscriptions) ? office.office_subscriptions[0] : office.office_subscriptions
              const plan = sub?.subscription_plans
              const isExpanded = expandedRows.has(office.id)
              const hasOverage = !!office.overage

              return (
                <span key={office.id} className="contents">
                  <TableRow 
                    className={cn("border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors", !office.is_active && 'bg-red-950/10')}
                    onClick={(e) => toggleRow(office.id, e)}
                  >
                    <TableCell className="p-3">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 pointer-events-none">
                         {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </Button>
                    </TableCell>
                    <TableCell className="font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-500" />
                        {office.name}
                        {!office.is_active && <Badge variant="destructive" className="ms-2">موقوف</Badge>}
                        {hasOverage && <Badge className="ms-1 bg-red-900/40 text-red-400 border-red-800 text-[10px]"><AlertTriangle className="w-3 h-3 me-1" />تجاوز الحد</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400" dir="ltr">
                      {format(new Date(office.created_at), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {plan ? (
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit border-zinc-700 text-zinc-300">{plan.name}</Badge>
                          <span className="text-[10px] text-zinc-500 mt-1">{plan.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</span>
                        </div>
                      ) : <span className="text-zinc-500 text-sm italic">بدون باقة</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span className={cn("font-medium", hasOverage ? 'text-red-400' : 'text-white')}>{office.memberCount ?? 0}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-400">{plan?.max_users || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub ? getStatusBadge(sub.status) : '-'}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-zinc-300" dir="ltr">
                      {sub?.current_period_end ? format(new Date(sub.current_period_end), 'yyyy/MM/dd') : '-'}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 rounded-lg border",
                            office.is_active
                              ? "text-red-400 hover:text-red-300 hover:bg-red-900/30 border-red-900"
                              : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 border-emerald-900"
                          )}
                          title={office.is_active ? 'تعطيل المكتب بالكامل' : 'تفعيل المكتب'}
                          disabled={processing === office.id}
                          onClick={() => handleToggleActive(office.id, office.is_active)}
                        >
                          {office.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 border border-zinc-700"
                          title="تعديل الاشتراك يدوياً"
                          onClick={() => setEditingOffice(office)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <TableRow className={cn("bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/40", !office.is_active && 'bg-red-950/5 hover:bg-red-950/10')}>
                      <TableCell colSpan={8} className="p-0 border-b-0">
                         <div className="p-4 px-12 animate-in slide-in-from-top-1 fade-in-20 duration-200 space-y-5">
                           {/* Owner Info */}
                           <div>
                             <div className="flex items-center gap-2 mb-3">
                               <UserCog className="w-4 h-4 text-emerald-500" />
                               <h4 className="font-medium text-sm text-zinc-300">بيانات مسؤول المكتب</h4>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-zinc-800 bg-zinc-950/50 p-4 rounded-lg">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] text-zinc-500 uppercase tracking-wider">الاسم بالكامل</span>
                                 <div className="flex items-center gap-2 text-sm text-zinc-300">
                                   {office.owner?.full_name || 'غير محدد'}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] text-zinc-500 uppercase tracking-wider">البريد الإلكتروني</span>
                                 <div className="flex items-center gap-2 text-sm text-zinc-300" dir="ltr">
                                   <Mail className="w-3.5 h-3.5 text-zinc-600" />
                                   {office.owner?.email || 'غير محدد'}
                                 </div>
                               </div>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] text-zinc-500 uppercase tracking-wider">رقم الهاتف</span>
                                 <div className="flex items-center gap-2 text-sm text-zinc-300" dir="ltr">
                                   <Phone className="w-3.5 h-3.5 text-zinc-600" />
                                   {office.owner?.phone || 'غير محدد'}
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Overage Warning */}
                           {hasOverage && (
                             <div className="border border-red-800/50 bg-red-950/20 rounded-lg p-4">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <AlertTriangle className="w-4 h-4 text-red-400" />
                                   <h4 className="font-medium text-sm text-red-400">تجاوز حدود الخطة</h4>
                                 </div>
                               </div>
                               <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                                 <div className="bg-zinc-950/50 p-2 rounded text-center">
                                   <div className="text-red-400 font-bold">{office.overage.current_count}</div>
                                   <div className="text-[10px] text-zinc-500">الأعضاء الحاليون</div>
                                 </div>
                                 <div className="bg-zinc-950/50 p-2 rounded text-center">
                                   <div className="text-amber-400 font-bold">{office.overage.max_users}</div>
                                   <div className="text-[10px] text-zinc-500">الحد المسموح</div>
                                 </div>
                                 <div className="bg-zinc-950/50 p-2 rounded text-center">
                                   <div className="text-zinc-300 font-bold text-xs">{format(new Date(office.overage.grace_deadline), 'dd/MM/yyyy', { locale: ar })}</div>
                                   <div className="text-[10px] text-zinc-500">انتهاء المهلة</div>
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Members Table */}
                           <div>
                             <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                 <Users className="w-4 h-4 text-blue-400" />
                                 <h4 className="font-medium text-sm text-zinc-300">أعضاء المكتب ({office.members?.length || 0})</h4>
                               </div>
                             </div>
                             <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/50">
                               <Table>
                                 <TableHeader>
                                   <TableRow className="bg-zinc-800/30 border-zinc-800">
                                     <TableHead className="text-right text-zinc-500 text-xs">الاسم</TableHead>
                                     <TableHead className="text-right text-zinc-500 text-xs">الدور</TableHead>
                                     <TableHead className="text-right text-zinc-500 text-xs">البريد</TableHead>
                                     <TableHead className="text-right text-zinc-500 text-xs">الحالة</TableHead>
                                     <TableHead className="text-center text-zinc-500 text-xs">إجراء</TableHead>
                                   </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                   {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                   {(office.members || []).map((m: any) => (
                                     <TableRow key={m.id} className="border-zinc-800/50">
                                       <TableCell className="text-sm text-zinc-300">{m.full_name}</TableCell>
                                       <TableCell>
                                         <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
                                           <Shield className="w-3 h-3 me-1" />
                                           {ROLE_LABELS[m.role] || m.role}
                                         </Badge>
                                       </TableCell>
                                       <TableCell className="text-xs text-zinc-500" dir="ltr">{m.email}</TableCell>
                                       <TableCell>
                                         {m.is_active ? (
                                           <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800 text-[10px]">نشط</Badge>
                                         ) : (
                                           <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]">معطل</Badge>
                                         )}
                                       </TableCell>
                                       <TableCell className="text-center">
                                         <Button
                                           size="icon"
                                           variant="ghost"
                                           className={cn(
                                             "h-7 w-7 rounded border",
                                             m.is_active
                                               ? "text-red-400 hover:bg-red-900/30 border-red-900/50"
                                               : "text-emerald-400 hover:bg-emerald-900/30 border-emerald-900/50"
                                           )}
                                           title={m.is_active ? 'تعطيل العضو' : 'تفعيل العضو'}
                                           disabled={processing === m.id}
                                           onClick={() => handleToggleMember(m.id, !m.is_active)}
                                         >
                                           {m.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                                         </Button>
                                       </TableCell>
                                     </TableRow>
                                   ))}
                                 </TableBody>
                               </Table>
                             </div>
                           </div>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </span>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ManualOverrideModal
        open={!!editingOffice}
        office={editingOffice}
        onClose={() => setEditingOffice(null)}
      />
    </div>
  )
}
