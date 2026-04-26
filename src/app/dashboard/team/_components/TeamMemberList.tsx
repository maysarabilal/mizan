'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  MoreHorizontal, KeyRound, UserMinus, ShieldCheck,
  Settings2, Clock, Mail
} from 'lucide-react'

import { Database } from '@/types/database'
import { updateMemberRoleAction, toggleMemberStatusAction, deleteInvitationAction, updateMemberPermissionsAction } from '@/lib/actions/team'
import { MEMBER_ROLES, ROLE_LABELS, PERMISSION_LABELS, type PermissionKey } from '@/lib/validations/team'
import { TEAM_ERRORS } from '@/lib/constants/messages'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

type MemberRowExt = Database['public']['Tables']['office_members']['Row'] & {
  profiles: { full_name: string, phone: string | null } | null
}
type InvitationRow = Database['public']['Tables']['invitations']['Row']

// ── Role badge config ─────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  owner:     { label: 'المالك',    bg: '#FEF9EC', text: '#92650A', border: '#F6D860' },
  admin:     { label: 'مدير',      bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  lawyer:    { label: 'محامي',     bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  secretary: { label: 'سكرتارية', bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  trainee:   { label: 'متدرب',    bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
}

// ── Permissions Dialog ─────────────────────────────────────────────────────────
interface PermissionsDialogProps {
  member: MemberRowExt
  onClose: () => void
}

function PermissionsDialog({ member, onClose }: PermissionsDialogProps) {
  const router = useRouter()
  const currentPerms = (member.permissions as Record<string, boolean>) || {}
  const [perms, setPerms] = useState<Record<string, boolean>>(currentPerms)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await updateMemberPermissionsAction({ memberId: member.id, permissions: perms })
    setIsSaving(false)
    if (error) { toast.error(error); return }
    toast.success('تم حفظ الصلاحيات بنجاح')
    router.refresh()
    onClose()
  }

  const toggleGroup = (keys: string[], value: boolean) => {
    setPerms(prev => {
      const next = { ...prev }
      keys.forEach(k => { next[k] = value })
      return next
    })
  }

  const categories = [
    {
      id: 'view',
      label: 'الاطلاع',
      description: 'الاطلاع على البيانات والبحث فقط',
      keys: ['view_cases', 'view_sessions', 'view_clients', 'view_tasks', 'view_team']
    },
    {
      id: 'manage',
      label: 'التنفيذ',
      description: 'إضافة وتعديل البيانات الأساسية',
      keys: ['add_cases', 'edit_cases', 'add_sessions', 'edit_sessions', 'add_clients', 'edit_clients', 'add_tasks', 'edit_tasks']
    },
    {
      id: 'sovereign',
      label: 'السيادة',
      description: 'صلاحيات الحذف والرقابة وإدارة الفريق',
      keys: ['delete_cases', 'delete_sessions', 'delete_clients', 'delete_tasks', 'manage_team', 'manage_permissions', 'view_audit_logs', 'view_billing', 'manage_invitations']
    }
  ]

  const initials = (member.profiles?.full_name || '؟؟')
    .split(' ').slice(0, 2).map(n => n[0]).join('')

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Gold accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#C9A84C] via-[#e8c96a] to-[#C9A84C] shrink-0" />

        <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-[17px] font-bold text-[#0F1724]">
            <div className="w-9 h-9 rounded-full bg-[#F0EAD6] flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold text-[#3B3A33]">{initials}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>تخصيص صلاحيات — {member.profiles?.full_name}</span>
              <span className="text-[12px] font-normal text-[#9AA3B2]">نظام الصلاحيات الصفرية</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#9AA3B2] mt-1">
            العضو لا يملك أي صلاحية افتراضية. قم باختيار الصلاحيات بعناية.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 flex-1 overflow-hidden min-h-0">
          <Tabs defaultValue="view" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-[#F8F9FB] p-1 rounded-lg shrink-0 border border-black/[0.06]">
              <TabsTrigger
                value="view"
                className="rounded-md text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F1724] text-[#9AA3B2]"
              >
                الاطلاع
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="rounded-md text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F1724] text-[#9AA3B2]"
              >
                التنفيذ
              </TabsTrigger>
              <TabsTrigger
                value="sovereign"
                className="rounded-md text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600 text-[#9AA3B2]"
              >
                السيادة
              </TabsTrigger>
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="flex-1 mt-4 data-[state=active]:flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <span className="text-[12px] text-[#9AA3B2]">{cat.description}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleGroup(cat.keys, true)}
                      className="text-[11px] px-2.5 py-1 rounded-md text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors border border-[#C9A84C]/30"
                    >
                      تفعيل الكل
                    </button>
                    <button
                      onClick={() => toggleGroup(cat.keys, false)}
                      className="text-[11px] px-2.5 py-1 rounded-md text-red-500 hover:bg-red-50 transition-colors border border-red-200"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="grid gap-2.5 pb-2">
                    {cat.keys.map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-black/[0.08] px-4 py-3 hover:bg-[#FAFBFC] transition-colors"
                      >
                        <Label htmlFor={key} className="text-[13px] font-medium text-[#0F1724] cursor-pointer">
                          {PERMISSION_LABELS[key as PermissionKey]}
                        </Label>
                        <Switch
                          id={key}
                          checked={perms[key] ?? false}
                          onCheckedChange={(checked) => setPerms(prev => ({ ...prev, [key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-black/[0.08] bg-[#F8F9FB] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#6B7280] bg-white border border-black/[0.10] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-[13px] font-semibold text-white bg-[#C9A84C] hover:bg-[#b8973e] rounded-lg transition-colors disabled:opacity-60"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main TeamMemberList ────────────────────────────────────────────────────────
export function TeamMemberList({
  members,
  invitations,
  currentUserId,
  isRemediationMode = false,
}: {
  members: MemberRowExt[]
  invitations: InvitationRow[]
  currentUserId: string
  isRemediationMode?: boolean
}) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [permissionTarget, setPermissionTarget] = useState<MemberRowExt | null>(null)

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('')

  const handleRoleChange = async (id: string, newRole: string) => {
    setIsUpdating(true)
    const { error } = await updateMemberRoleAction(id, newRole)
    setIsUpdating(false)
    if (error) { toast.error(error); return }
    toast.success('تم تحديث الدور بنجاح')
    router.refresh()
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (isRemediationMode && !currentStatus) {
      toast.error('لا يمكنك تفعيل الأعضاء في وضع تقييد التجاوز.')
      return
    }
    setIsUpdating(true)
    const { error } = await toggleMemberStatusAction(id, !currentStatus)
    setIsUpdating(false)
    if (error) {
      if (error === 'DISABLED_BY_ADMIN') toast.error(TEAM_ERRORS.DISABLED_BY_ADMIN)
      else if (error === 'MEMBER_LIMIT_REACHED') toast.error(TEAM_ERRORS.MEMBER_LIMIT_REACHED)
      else toast.error(error)
      return
    }
    toast.success(currentStatus ? 'تم إيقاف حساب العضو' : 'تم تفعيل حساب العضو')
    router.refresh()
  }

  const handleRevokeInvite = async (id: string) => {
    setIsUpdating(true)
    const { error } = await deleteInvitationAction(id)
    setIsUpdating(false)
    if (error) { toast.error(error); return }
    toast.success('تم إلغاء الدعوة بنجاح')
    router.refresh()
  }

  return (
    <>
      {permissionTarget && (
        <PermissionsDialog member={permissionTarget} onClose={() => setPermissionTarget(null)} />
      )}

      <div className="flex flex-col gap-6">
        {/* Members Table */}
        <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F9FB] hover:bg-[#F8F9FB] border-b border-black/[0.08]">
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5 w-[240px]">العضو</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">الدور</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">الحالة</TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">تاريخ الانضمام</TableHead>
                <TableHead className="text-center text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-3 w-[90px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-40 text-[#9AA3B2] text-[14px]">
                    لا يوجد أعضاء في الفريق بعد
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.trainee
                  const initials = getInitials(member.profiles?.full_name || '؟؟')
                  const isCurrentUser = member.user_id === currentUserId
                  const isOwner = member.role === 'owner'

                  return (
                    <TableRow
                      key={member.id}
                      className="border-b border-black/[0.06] hover:bg-[#FAFBFC] transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/team/${member.id}`)}
                    >
                      {/* Member Info */}
                      <TableCell className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#F0EAD6] flex items-center justify-center shrink-0 border border-[#C9A84C]/20">
                            <span className="text-[12px] font-bold text-[#3B3A33]">{initials}</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-[#0F1724]">
                                {member.profiles?.full_name || 'غير متوفر'}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-[#C9A84C]/10 text-[#C9A84C] px-1.5 py-0.5 rounded border border-[#C9A84C]/20 font-medium">
                                  أنت
                                </span>
                              )}
                            </div>
                            {member.profiles?.phone && (
                              <span className="text-[12px] text-[#9AA3B2]" dir="ltr">
                                {member.profiles.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell className="py-3 px-5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border"
                          style={{ background: roleConfig.bg, color: roleConfig.text, borderColor: roleConfig.border }}
                        >
                          {roleConfig.label}
                        </span>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="py-3 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border ${
                            member.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-[#F9FAFB] text-[#9AA3B2] border-[#E5E7EB]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full me-1.5 ${member.is_active ? 'bg-emerald-500' : 'bg-[#D1D5DB]'}`} />
                          {member.is_active ? 'نشط' : 'معطّل'}
                        </span>
                      </TableCell>

                      {/* Join Date */}
                      <TableCell className="py-3 px-5 text-[13px] text-[#6B7280]">
                        {format(new Date(member.created_at), 'd MMMM yyyy', { locale: ar })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        {!isCurrentUser && !isOwner ? (
                          <div className="flex items-center justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                disabled={isUpdating}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#9AA3B2] hover:bg-slate-100 hover:text-[#0F1724] transition-colors disabled:opacity-50 outline-none"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel className="text-[12px]">إجراءات العضو</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {!isRemediationMode && (
                                  <>
                                    <DropdownMenuLabel className="text-[11px] text-[#9AA3B2] font-normal">
                                      تغيير الدور إلى:
                                    </DropdownMenuLabel>
                                    {MEMBER_ROLES.filter(r => r !== 'owner' && r !== member.role).map(role => (
                                      <DropdownMenuItem key={role} onClick={() => handleRoleChange(member.id, role)}>
                                        <KeyRound className="me-2 h-4 w-4" />
                                        {ROLE_LABELS[role]}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPermissionTarget(member)}>
                                      <Settings2 className="me-2 h-4 w-4 text-[#C9A84C]" />
                                      <span className="text-[#C9A84C]">تخصيص الصلاحيات</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}

                                {(!isRemediationMode || member.is_active) && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(member.id, member.is_active)}
                                    className={member.is_active ? 'text-destructive focus:text-destructive' : 'text-emerald-600'}
                                  >
                                    {member.is_active
                                      ? <><UserMinus className="me-2 h-4 w-4" /> تعليق الحساب</>
                                      : <><ShieldCheck className="me-2 h-4 w-4" /> إعادة تفعيل</>
                                    }
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <div className="h-8 w-8" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pending Invitations */}
        {!isRemediationMode && invitations.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#C9A84C]" />
              <h3 className="text-[15px] font-semibold text-[#0F1724]">الدعوات المعلقة</h3>
              <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#C9A84C]/20">
                {invitations.length}
              </span>
            </div>

            <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F9FB] hover:bg-[#F8F9FB] border-b border-black/[0.08]">
                    <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">كود الانضمام</TableHead>
                    <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">الدور</TableHead>
                    <TableHead className="text-right text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-5">صالحة حتى</TableHead>
                    <TableHead className="text-center text-[13px] font-semibold text-[#9AA3B2] py-3.5 px-3 w-[90px]">إلغاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const roleConfig = ROLE_CONFIG[inv.role] || ROLE_CONFIG.trainee
                    return (
                      <TableRow key={inv.id} className="border-b border-black/[0.06] hover:bg-[#FAFBFC] transition-colors">
                        <TableCell className="py-3 px-5">
                          <span className="font-mono font-bold text-[#C9A84C] tracking-widest text-[15px]">
                            {inv.code}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-5">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border"
                            style={{ background: roleConfig.bg, color: roleConfig.text, borderColor: roleConfig.border }}
                          >
                            {roleConfig.label}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-5 text-[13px] text-[#6B7280]">
                          {format(new Date(inv.expires_at), 'd MMMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              disabled={isUpdating}
                              className="text-[12px] text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors border border-red-200 hover:border-red-300 disabled:opacity-50"
                            >
                              إلغاء
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
