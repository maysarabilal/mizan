import { z } from 'zod'

export const MEMBER_ROLES = ['owner', 'admin', 'lawyer', 'secretary', 'trainee'] as const
export const INVITE_ROLES = ['admin', 'lawyer', 'secretary', 'trainee'] as const

export type MemberRole = typeof MEMBER_ROLES[number]
export type InviteRole = typeof INVITE_ROLES[number]

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'مالك المكتب',
  admin: 'مدير',
  lawyer: 'محامي',
  secretary: 'سكرتارية',
  trainee: 'متدرب',
}

export const PERMISSION_KEYS = [
  // الأساسيات (العرض)
  'view_cases',
  'view_sessions',
  'view_clients',
  'view_tasks',
  'view_team',
  
  // العمليات (إضافة وتعديل)
  'add_cases',
  'edit_cases',
  'add_sessions',
  'edit_sessions',
  'add_clients',
  'edit_clients',
  'add_tasks',
  'edit_tasks',

  // الإدارة والحذف
  'delete_cases',
  'delete_sessions',
  'delete_clients',
  'delete_tasks',
  'manage_team',
  'manage_permissions',
  'view_audit_logs',
  'view_billing',
  'manage_invitations',
] as const

export type PermissionKey = typeof PERMISSION_KEYS[number]

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view_cases: 'عرض القضايا',
  view_sessions: 'عرض الجلسات',
  view_clients: 'عرض العملاء',
  view_tasks: 'عرض المهام',
  view_team: 'عرض الفريق',
  
  add_cases: 'إضافة قضية جديدة',
  edit_cases: 'تعديل بيانات القضايا',
  add_sessions: 'إضافة جلسة جديدة',
  edit_sessions: 'تعديل بيانات الجلسات',
  add_clients: 'إضافة عميل جديد',
  edit_clients: 'تعديل بيانات العملاء',
  add_tasks: 'إضافة مهمة جديدة',
  edit_tasks: 'تعديل بيانات المهام',

  delete_cases: 'حذف القضايا',
  delete_sessions: 'حذف الجلسات',
  delete_clients: 'حذف العملاء',
  delete_tasks: 'حذف المهام',
  
  manage_team: 'إدارة أعضاء الفريق',
  manage_permissions: 'تعديل صلاحيات الموظفين',
  view_audit_logs: 'رؤية سجلات الرقابة (Logs)',
  view_billing: 'إدارة الفواتير والاشتراكات',
  manage_invitations: 'إرسال دعوات الانضمام',
}

export const inviteSchema = z.object({
  role: z.enum(INVITE_ROLES),
})

export const updateRoleSchema = z.object({
  role: z.enum(MEMBER_ROLES),
})

export const updatePermissionsSchema = z.object({
  memberId: z.string().uuid(),
  permissions: z.record(z.string(), z.boolean()),
})
