'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { MoreHorizontal, KeyRound, UserMinus, ShieldCheck, Settings2 } from 'lucide-react'

import { Database } from '@/types/database'
import { updateMemberRoleAction, toggleMemberStatusAction, deleteInvitationAction, updateMemberPermissionsAction } from '@/lib/actions/team'
import { MEMBER_ROLES, ROLE_LABELS, PERMISSION_LABELS, type PermissionKey } from '@/lib/validations/team'
import { TEAM_ERRORS } from '@/lib/constants/messages'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type MemberRowExt = Database['public']['Tables']['office_members']['Row'] & { 
  profiles: { full_name: string, phone: string | null } | null 
}
type InvitationRow = Database['public']['Tables']['invitations']['Row']

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner:     'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  admin:     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  lawyer:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  secretary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  trainee:   'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

interface PermissionsDialogProps {
  member: MemberRowExt
  onClose: () => void
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

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
      label: 'صلاحيات العرض',
      description: 'الاطلاع على البيانات والبحث فقط',
      keys: ['view_cases', 'view_sessions', 'view_clients', 'view_tasks', 'view_team']
    },
    {
      id: 'manage',
      label: 'صلاحيات التنفيذ',
      description: 'إضافة وتعديل البيانات الأساسية',
      keys: ['add_cases', 'edit_cases', 'add_sessions', 'edit_sessions', 'add_clients', 'edit_clients', 'add_tasks', 'edit_tasks']
    },
    {
      id: 'sovereign',
      label: 'الإدارة والسيادة',
      description: 'صلاحيات الحذف والرقابة وإدارة الفريق',
      keys: ['delete_cases', 'delete_sessions', 'delete_clients', 'delete_tasks', 'manage_team', 'manage_permissions', 'view_audit_logs', 'view_billing', 'manage_invitations']
    }
  ]

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden" >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Settings2 className="h-6 w-6 text-primary" />
            تخصيص سيادة العضو — {member.profiles?.full_name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            نظام الصلاحيات الصفرية: العضو لا يملك أي صلاحية افتراضية. قم باختيار الصلاحيات بعناية.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 flex-1 overflow-hidden">
          <Tabs defaultValue="view" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="view" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 border-none shadow-none">الاطلاع</TabsTrigger>
              <TabsTrigger value="manage" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 border-none shadow-none">التنفيذ</TabsTrigger>
              <TabsTrigger value="sovereign" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 border-none shadow-none text-red-600 dark:text-red-400">السيادة</TabsTrigger>
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="flex-1 mt-4 data-[state=active]:flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => toggleGroup(cat.keys, true)}>تفعيل الكل</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-destructive" onClick={() => toggleGroup(cat.keys, false)}>إلغاء الكل</Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="grid gap-3">
                    {cat.keys.map((key) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex flex-col">
                          <Label htmlFor={key} className="text-sm font-semibold cursor-pointer group-hover:text-primary transition-colors">
                            {PERMISSION_LABELS[key as PermissionKey]}
                          </Label>
                        </div>
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

        <div className="flex gap-3 justify-end p-6 bg-muted/20 border-t">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-8 shadow-lg shadow-primary/20">
            {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات السيادية'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TeamTable({ members, invitations, currentUserId, isRemediationMode = false }: { members: MemberRowExt[], invitations: InvitationRow[], currentUserId: string, isRemediationMode?: boolean }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [permissionTarget, setPermissionTarget] = useState<MemberRowExt | null>(null)

  const handleRoleChange = async (id: string, newRole: string) => {
    setIsUpdating(true)
    const { error } = await updateMemberRoleAction(id, newRole)
    setIsUpdating(false)
    if (error) { toast.error(error); return; }
    toast.success('تم تحديث الصلاحية بنجاح')
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
      if (error === 'DISABLED_BY_ADMIN') {
        toast.error(TEAM_ERRORS.DISABLED_BY_ADMIN)
      } else if (error === 'MEMBER_LIMIT_REACHED') {
        toast.error(TEAM_ERRORS.MEMBER_LIMIT_REACHED)
      } else {
        toast.error(error) 
      }
      return
    }
    toast.success(currentStatus ? 'تم إيقاف حساب الموظف' : 'تم تفعيل حساب الموظف')
    router.refresh()
  }

  const handleRevokeInvite = async (id: string) => {
    setIsUpdating(true)
    const { error } = await deleteInvitationAction(id)
    setIsUpdating(false)
    if (error) { toast.error(error); return; }
    toast.success('تم إلغاء الدعوة بنجاح')
    router.refresh()
  }

  return (
    <>
      {permissionTarget && (
        <PermissionsDialog member={permissionTarget} onClose={() => setPermissionTarget(null)} />
      )}

      <div className="flex flex-col gap-6">
        <div className="border rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold w-[280px]">المستخدم</TableHead>
                <TableHead className="text-right font-bold">الدور</TableHead>
                <TableHead className="text-right font-bold">حالة الحساب</TableHead>
                <TableHead className="text-right font-bold">تاريخ الانضمام</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{member.profiles?.full_name || 'غير متوفر'}</span>
                      <span className="text-xs text-muted-foreground mt-0.5" dir="ltr">{member.profiles?.phone || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_COLORS[member.role] || 'bg-zinc-100'}`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? 'default' : 'secondary'} className={member.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : ''}>
                      {member.is_active ? 'نشط' : 'معطّل'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(member.created_at), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell>
                    {member.user_id !== currentUserId && member.role !== 'owner' && (
                      <DropdownMenu>
                        {/* @ts-expect-error Radix asChild type mismatch */}
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdating}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" >
                          <DropdownMenuLabel>إجراءات العضو</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {!isRemediationMode && (
                            <>
                              {/* Change Role */}
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">تغيير الدور إلى:</DropdownMenuLabel>
                              {MEMBER_ROLES.filter(r => r !== 'owner' && r !== member.role).map(role => (
                                <DropdownMenuItem key={role} onClick={() => handleRoleChange(member.id, role)}>
                                  <KeyRound className="me-2 h-4 w-4" />
                                  {ROLE_LABELS[role]}
                                </DropdownMenuItem>
                              ))}

                              <DropdownMenuSeparator />

                              {/* Manage Permissions */}
                              <DropdownMenuItem onClick={() => setPermissionTarget(member)}>
                                <Settings2 className="me-2 h-4 w-4 text-blue-500" />
                                <span className="text-blue-600 dark:text-blue-400">تخصيص الصلاحيات</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuSeparator />

                          {/* Toggle Status */}
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
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pending Invitations */}
        {!isRemediationMode && invitations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">الدعوات المعلقة</h3>
            <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">الكود</TableHead>
                    <TableHead className="text-right font-bold">الدور</TableHead>
                    <TableHead className="text-right font-bold">صلاحية حتى</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-primary tracking-widest">{inv.code}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_COLORS[inv.role] || 'bg-zinc-100'}`}>
                          {ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS] || inv.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(inv.expires_at), 'yyyy/MM/dd')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRevokeInvite(inv.id)} disabled={isUpdating}>
                          إلغاء
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
