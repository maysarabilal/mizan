'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { 
  ChevronRight, Mail, Phone, Calendar, Shield, 
  Settings2, Activity, UserCircle, CheckCircle2, XCircle,
  Briefcase, Scale
} from 'lucide-react'
import { Database } from '@/types/database'
import { PERMISSION_LABELS, type PermissionKey } from '@/lib/validations/team'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type MemberRowExt = Database['public']['Tables']['office_members']['Row'] & {
  profiles: { full_name: string, phone: string | null } | null
  stats?: { 
    casesCount: number; 
    sessionsCount: number;
    recentCases?: any[];
    recentSessions?: any[];
  }
}

// ── Role badge config ─────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  owner:     { label: 'المالك',    bg: '#FEF9EC', text: '#92650A', border: '#F6D860' },
  admin:     { label: 'مدير',      bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  lawyer:    { label: 'محامي',     bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  secretary: { label: 'سكرتارية', bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  trainee:   { label: 'متدرب',    bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
}

// ── Permissions Dialog Wrapper (Local for now to avoid circular deps) ──────────
import { updateMemberPermissionsAction } from '@/lib/actions/team'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export function MemberDetailClient({ member }: { member: MemberRowExt }) {
  const router = useRouter()
  const [isEditPermOpen, setIsEditPermOpen] = useState(false)
  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.trainee
  const permissions = (member.permissions as Record<string, boolean>) || {}
  
  const initials = (member.profiles?.full_name || '؟؟')
    .split(' ').slice(0, 2).map(n => n[0]).join('')

  // ── Permissions Edit Logic ──
  const [perms, setPerms] = useState<Record<string, boolean>>(permissions)
  const [isSaving, setIsSaving] = useState(false)

  const handleSavePerms = async () => {
    setIsSaving(true)
    const { error } = await updateMemberPermissionsAction({ memberId: member.id, permissions: perms })
    setIsSaving(false)
    if (error) { toast.error(error); return }
    toast.success('تم تحديث الصلاحيات بنجاح')
    router.refresh()
    setIsEditPermOpen(false)
  }

  const toggleGroup = (keys: string[], value: boolean) => {
    setPerms(prev => {
      const next = { ...prev }
      keys.forEach(k => { next[k] = value })
      return next
    })
  }

  const categories = [
    { id: 'view', label: 'الاطلاع', keys: ['view_cases', 'view_sessions', 'view_clients', 'view_tasks', 'view_team'] },
    { id: 'manage', label: 'التنفيذ', keys: ['add_cases', 'edit_cases', 'add_sessions', 'edit_sessions', 'add_clients', 'edit_clients', 'add_tasks', 'edit_tasks'] },
    { id: 'sovereign', label: 'السيادة', keys: ['delete_cases', 'delete_sessions', 'delete_clients', 'delete_tasks', 'manage_team', 'manage_permissions', 'view_audit_logs', 'view_billing', 'manage_invitations'] }
  ]

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermOpen} onOpenChange={setIsEditPermOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#C9A84C] via-[#e8c96a] to-[#C9A84C] shrink-0" />
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="text-[17px] font-bold text-[#0F1724]">تعديل صلاحيات العضو</DialogTitle>
            <DialogDescription className="text-[13px]">تخصيص صلاحيات {member.profiles?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="px-6 flex-1 overflow-hidden min-h-0">
            <Tabs defaultValue="view">
              <TabsList className="grid w-full grid-cols-3 bg-[#F8F9FB] p-1 rounded-lg">
                <TabsTrigger value="view">الاطلاع</TabsTrigger>
                <TabsTrigger value="manage">التنفيذ</TabsTrigger>
                <TabsTrigger value="sovereign">السيادة</TabsTrigger>
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.id} value={cat.id} className="mt-4 flex flex-col h-[300px]">
                   <div className="flex justify-end gap-2 mb-3">
                     <button onClick={() => toggleGroup(cat.keys, true)} className="text-[11px] text-[#C9A84C]">تفعيل الكل</button>
                     <button onClick={() => toggleGroup(cat.keys, false)} className="text-[11px] text-red-500">إلغاء الكل</button>
                   </div>
                   <ScrollArea className="flex-1 pr-2">
                     <div className="grid gap-2">
                       {cat.keys.map(key => (
                         <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#FAFBFC]">
                           <Label className="text-[13px]">{PERMISSION_LABELS[key as PermissionKey]}</Label>
                           <Switch 
                              checked={perms[key] ?? false} 
                              onCheckedChange={(v) => setPerms(prev => ({ ...prev, [key]: v }))} 
                           />
                         </div>
                       ))}
                     </div>
                   </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="flex gap-3 justify-end px-6 py-4 border-t bg-[#F8F9FB]">
             <Button variant="outline" onClick={() => setIsEditPermOpen(false)}>إلغاء</Button>
             <Button className="bg-[#C9A84C]" onClick={handleSavePerms} disabled={isSaving}>حفظ التغييرات</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#8B939A] hover:text-[#0F1724] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-black/[0.08] flex items-center justify-center group-hover:border-[#C9A84C]/30 group-hover:bg-[#C9A84C]/5">
            <ChevronRight className="h-4 w-4" />
          </div>
          <span className="text-[14px] font-medium">العودة لقائمة الفريق</span>
        </button>

        <div className="flex gap-2">
           {member.role !== 'owner' && (
             <Button 
              variant="outline" 
              className="border-black/[0.10] text-[#0F1724] hover:bg-[#F8F9FB] h-10 px-4 text-[13px] font-semibold"
              onClick={() => setIsEditPermOpen(true)}
             >
               <Settings2 className="me-2 h-4 w-4 text-[#C9A84C]" />
               تعديل الصلاحيات
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-black/[0.08] shadow-sm overflow-hidden">
             {/* Header Background */}
            <div className="h-20 bg-gradient-to-r from-[#C9A84C]/20 via-[#F0EAD6] to-[#C9A84C]/20" />
            
            <CardContent className="relative px-6 pb-6 text-center">
              {/* Avatar */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-full bg-[#F0EAD6] border-4 border-white flex items-center justify-center shadow-md">
                  <span className="text-[24px] font-bold text-[#3B3A33]">{initials}</span>
                </div>
              </div>

              <div className="mt-12 flex flex-col items-center gap-2">
                <h2 className="text-[20px] font-bold text-[#0F1724]">
                  {member.profiles?.full_name || 'عضو غير مسمى'}
                </h2>
                <div className="flex gap-2">
                  <Badge 
                    style={{ background: roleConfig.bg, color: roleConfig.text, borderColor: roleConfig.border }}
                    className="px-3 py-0.5 text-[12px] font-semibold border"
                  >
                    {roleConfig.label}
                  </Badge>
                  <Badge 
                    className={`px-3 py-0.5 text-[12px] font-semibold border ${
                      member.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {member.is_active ? 'نشط' : 'معطّل'}
                  </Badge>
                </div>
              </div>

              <div className="mt-8 grid gap-4 text-right">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F9FB] border border-black/[0.04]">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#C9A84C]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#9AA3B2]">رقم الهاتف</span>
                    <span className="text-[13px] font-semibold text-[#0F1724]" dir="ltr">
                      {member.profiles?.phone || 'غير متوفر'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F9FB] border border-black/[0.04]">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#C9A84C]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#9AA3B2]">تاريخ الانضمام</span>
                    <span className="text-[13px] font-semibold text-[#0F1724]">
                      {format(new Date(member.created_at), 'd MMMM yyyy', { locale: ar })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats or Bio */}
          <Card className="border-black/[0.08] shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-[15px] font-bold text-[#0F1724] mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#C9A84C]" />
                ملخص النشاط
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[13px]">
                   <span className="text-[#8B939A]">القضايا المسندة</span>
                   <span className="font-bold text-[#0F1724]">{member.stats?.casesCount || 0}</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px]">
                   <span className="text-[#8B939A]">الجلسات الموكلة</span>
                   <span className="font-bold text-[#0F1724]">{member.stats?.sessionsCount || 0}</span>
                 </div>
                 <div className="w-full h-1 bg-[#F8F9FB] rounded-full overflow-hidden mt-2">
                   <div 
                    className="h-full bg-[#C9A84C] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((member.stats?.casesCount || 0) + (member.stats?.sessionsCount || 0)) * 5)}%` }}
                   />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Permissions & Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-black/[0.08] shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F8F9FB] flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-[#0F1724] flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#C9A84C]" />
                  صلاحيات الوصول
                </h3>
                <span className="text-[12px] text-[#9AA3B2]">
                  {Object.values(permissions).filter(v => v).length} صلاحية مفعّلة
                </span>
             </div>
             
             <CardContent className="p-6">
               {member.role === 'owner' ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-[#FEF9EC] flex items-center justify-center">
                     <Shield className="h-6 w-6 text-[#92650A]" />
                   </div>
                   <h4 className="text-[15px] font-bold text-[#0F1724]">صلاحية المالك المطلقة</h4>
                   <p className="text-[13px] text-[#8B939A] max-w-[300px]">
                     بصفتك مالك المكتب، تمتلك كافة الصلاحيات بشكل افتراضي ولا يمكن تقييدها.
                   </p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                      const isActive = permissions[key] ?? false
                      return (
                        <div 
                          key={key}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isActive 
                              ? 'bg-emerald-50/30 border-emerald-100' 
                              : 'bg-[#F9FAFB] border-black/[0.05] opacity-60'
                          }`}
                        >
                          <span className={`text-[13px] font-medium ${isActive ? 'text-[#0F1724]' : 'text-[#9AA3B2]'}`}>
                            {label}
                          </span>
                          {isActive ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[#D1D5DB]" />
                          )}
                        </div>
                      )
                    })}
                 </div>
               )}
             </CardContent>
          </Card>

          {/* Account Security Info */}
          <Card className="border-black/[0.08] shadow-sm">
             <CardContent className="p-6">
                <h3 className="text-[15px] font-bold text-[#0F1724] mb-4 flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-[#C9A84C]" />
                  معلومات الحساب والأمان
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-1">
                      <span className="text-[12px] text-[#9AA3B2]">المعرف الفريد (ID)</span>
                      <code className="text-[12px] bg-[#F8F9FB] p-2 rounded border border-black/[0.04] text-[#6B7280]">
                        {member.user_id}
                      </code>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[12px] text-[#9AA3B2]">حالة التوثيق</span>
                      <div className="flex items-center gap-2 text-[13px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        موثق (عبر البريد)
                      </div>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Cases & Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Cases */}
        <Card className="border-black/[0.08] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F8F9FB]">
            <h3 className="text-[15px] font-bold text-[#0F1724] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#C9A84C]" />
              أحدث القضايا المسندة
            </h3>
          </div>
          <CardContent className="p-0">
            {(!member.stats?.recentCases || member.stats.recentCases.length === 0) ? (
              <div className="text-center py-8 text-[#8B939A] text-[13px]">
                لا توجد قضايا مسندة حالياً
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06]">
                {member.stats.recentCases.map((c: any) => (
                  <div key={c.id} className="p-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/cases/${c.id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[14px] text-[#0F1724]">{c.title}</span>
                        <span className="text-[12px] text-[#8B939A]">الموكل: {c.clients?.name || 'غير محدد'}</span>
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2 py-0.5 text-[11px]">
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="border-black/[0.08] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F8F9FB]">
            <h3 className="text-[15px] font-bold text-[#0F1724] flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#C9A84C]" />
              الجلسات القادمة والسابقة
            </h3>
          </div>
          <CardContent className="p-0">
            {(!member.stats?.recentSessions || member.stats.recentSessions.length === 0) ? (
              <div className="text-center py-8 text-[#8B939A] text-[13px]">
                لا توجد جلسات مرتبطة حالياً
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06]">
                {member.stats.recentSessions.map((s: any) => (
                  <div key={s.id} className="p-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/sessions/${s.id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[14px] text-[#0F1724]">
                          {s.cases?.title || 'قضية غير محددة'}
                        </span>
                        <div className="flex items-center gap-2 text-[12px] text-[#8B939A]">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(s.session_date), 'd MMMM yyyy', { locale: ar })}</span>
                          {s.session_time && (
                            <>
                              <span>•</span>
                              <span>{s.session_time.slice(0, 5)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
