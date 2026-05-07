'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inviteSchema, updatePermissionsSchema, MEMBER_ROLES } from '@/lib/validations/team'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import { requireActiveSubscription } from '@/lib/actions/subscription'
import { sendEmailSafe } from '@/lib/resend'
import { TeamInvitationEmail } from '@/emails/TeamInvitationEmail'
import { render } from '@react-email/components'

export async function getTeamMembers() {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('office_members')
    .select(`
      *,
      profiles (full_name, phone, avatar_url)
    `)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching team members:', error)
    return { data: null, error: 'فشل في جلب أعضاء الفريق' }
  }

  return { data, error: null }
}

export async function getCurrentUserRole(): Promise<ActionResult<{ role: string; permissions: Record<string, boolean> }>> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'غير مصرح' }

  const { data, error } = await supabase
    .from('office_members')
    .select('role, permissions')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (error || !data) return { data: null, error: 'لم يتم العثور على بيانات العضوية' }

  return { 
    data: { 
      role: data.role, 
      permissions: (data.permissions as Record<string, boolean>) || {} 
    }, 
    error: null 
  }
}

export async function getInvitations() {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`*`)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    return { data: null, error: 'فشل في جلب الدعوات النشطة' }
  }

  return { data, error: null }
}

export async function generateInviteCodeAction(values: z.infer<typeof inviteSchema>): Promise<ActionResult<{ code: string }>> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const result = inviteSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()
  const { data: memberData, error: memberError } = await supabase.rpc('current_office_id').single()
  const { data: { user } } = await supabase.auth.getUser()

  if (memberError || !memberData || !user) {
    return { data: null, error: 'غير مصرح بتوليد الكود' }
  }

  // Only owner or admin can create invitations
  const { data: currentMember } = await supabase
    .from('office_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
    return { data: null, error: 'لا تملك صلاحية إنشاء دعوات الانضمام' }
  }

  // NEW: Check Subscription Plan Capacity before generating code
  const adminSupabase = createAdminClient()
  
  // Get Max Users and Current Count in one go (or two)
  const { data: subData } = await adminSupabase
    .from('office_subscriptions')
    .select(`
      plan_id,
      subscription_plans (max_users)
    `)
    .eq('office_id', memberData)
    .single()

  const maxUsers = (subData?.subscription_plans as unknown as { max_users: number } | null)?.max_users || 1
  
  const { count: currentMemberCount } = await adminSupabase
    .from('office_members')
    .select('*', { count: 'exact', head: true })
    .eq('office_id', memberData)
    .eq('is_active', true)

  if ((currentMemberCount || 0) >= maxUsers) {
    // 1. Fetch platform admins
    const { data: admins } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)

    // 2. Fetch office name for the message
    const { data: officeData } = await adminSupabase
      .from('offices')
      .select('name')
      .eq('id', memberData)
      .single()

    const officeName = officeData?.name || 'مجهول'

    // 3. Dispatch notifications
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        office_id: memberData,
        user_id: admin.id,
        type: 'system',
        title: 'تنبيه حدود الباقة',
        body: `مكتب ${officeName} وصل الحد الأقصى لعدد الأعضاء — قد يحتاج ترقية الترخيص. [عرض المكتب](/admin/offices)`
      }))
      await adminSupabase.from('notifications').insert(notifications)
    }

    return { 
      data: null, 
      error: 'MEMBER_LIMIT_REACHED'
    }
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await adminSupabase.from('invitations').insert({
    office_id: memberData,
    code,
    role: result.data.role,
    email: result.data.email || null,
    expires_at: expiresAt.toISOString(),
    created_by: user.id
  })

  if (error) {
    console.error('Error creating invitation:', error)
    return { data: null, error: 'حدث خطأ أثناء توليد الدعوة' }
  }

  // Send Email if provided
  if (result.data.email) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mizan-app.com'
      const inviteLink = `${baseUrl}/register?invite=${code}`

      const { data: officeData } = await supabase
        .from('offices')
        .select('name')
        .eq('id', memberData)
        .single()
      
      const officeName = officeData?.name || 'مكتب محاماة'
      
      const htmlBody = await render(TeamInvitationEmail({
        officeName: officeName,
        inviterName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'المدير',
        inviteLink,
        role: result.data.role
      }))

      sendEmailSafe({
        from: 'ميزان لدعم المحامين <onboarding@resend.dev>',
        to: [result.data.email],
        subject: `دعوة للانضمام إلى ${officeName} على منصة ميزان`,
        html: htmlBody,
      })
    } catch (err) {
      console.error('Failed to send invitation email:', err)
      // We don't return error here because the invitation was created in DB
    }
  }

  revalidatePath('/dashboard/team')
  return { data: { code }, error: null }
}

export async function deleteInvitationAction(id: string): Promise<ActionResult> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  if (error) return { data: null, error: 'فشل حذف الدعوة' }
  revalidatePath('/dashboard/team')
  return { data: null, error: null }
}

export async function updateMemberRoleAction(id: string, role: string): Promise<ActionResult> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  if (!MEMBER_ROLES.includes(role as typeof MEMBER_ROLES[number])) {
    return { data: null, error: `الدور "${role}" غير مسموح به` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data: targetMember } = await supabase
    .from('office_members')
    .select('user_id, role, office_id')
    .eq('id', id)
    .single()
    
  if (!targetMember) return { data: null, error: 'عضو الفريق غير موجود' }
  if (targetMember.user_id === user.id) return { data: null, error: 'لا يمكنك تغيير دورك الخاص' }

  if (role !== 'owner' && targetMember.role === 'owner') {
    const { count } = await supabase
      .from('office_members')
      .select('*', { count: 'exact', head: true })
      .eq('office_id', targetMember.office_id)
      .eq('role', 'owner')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      return { data: null, error: 'يجب أن يبقى مالك واحد على الأقل في المكتب.' }
    }
  }

  const { error } = await supabase
    .from('office_members')
    .update({ 
      role: role as 'owner' | 'admin' | 'lawyer' | 'secretary' | 'trainee', 
      permissions: {}, // Reset permissions on role change
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) return { data: null, error: 'فشل تحديث الصلاحية' }
  revalidatePath('/dashboard/team')
  return { data: null, error: null }
}

export async function updateMemberPermissionsAction(values: z.infer<typeof updatePermissionsSchema>): Promise<ActionResult> {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const result = updatePermissionsSchema.safeParse(values)
  if (!result.success) return { data: null, error: 'بيانات غير صالحة' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data: hasManagePerm, error: permError } = await supabase.rpc('has_permission', { p_perm: 'manage_permissions' }).single()

  if (permError || !hasManagePerm) {
    return { data: null, error: 'لا تملك صلاحية تعديل صلاحيات الموظفين' }
  }

  const { data: targetMember } = await supabase
    .from('office_members')
    .select('role, user_id')
    .eq('id', result.data.memberId)
    .single()

  if (!targetMember) return { data: null, error: 'العضو غير موجود' }
  if (targetMember.role === 'owner') return { data: null, error: 'لا يمكن تعديل صلاحيات المالك' }
  if (targetMember.user_id === user.id) return { data: null, error: 'لا يمكنك تعديل صلاحياتك الخاصة' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('office_members')
    .update({ permissions: result.data.permissions, updated_at: new Date().toISOString() })
    .eq('id', result.data.memberId)

  if (error) {
    console.error('Error updating permissions:', error)
    return { data: null, error: 'فشل تحديث الصلاحيات' }
  }

  revalidatePath('/dashboard/team')
  return { data: null, error: null }
}

export async function toggleMemberStatusAction(id: string, isActive: boolean): Promise<ActionResult> {
  const guardError = await requireActiveSubscription({ allowOverageRemediation: true })
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data: targetMember } = await supabase
    .from('office_members')
    .select('user_id, role, office_id, disabled_by_admin')
    .eq('id', id)
    .single()
    
  if (!targetMember) return { data: null, error: 'عضو الفريق غير موجود' }
  if (targetMember.user_id === user.id) return { data: null, error: 'لا يمكنك تغيير حالتك الخاصة' }

  // Protect last owner from deactivation
  if (!isActive && targetMember.role === 'owner') {
    const { count } = await supabase
      .from('office_members')
      .select('*', { count: 'exact', head: true })
      .eq('office_id', targetMember.office_id)
      .eq('role', 'owner')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      return { data: null, error: 'يجب أن يبقى مالك واحد على الأقل في المكتب.' }
    }
  }

  // On reactivation, check member limit and disabled_by_admin
  if (isActive) {
    if (targetMember.disabled_by_admin) {
      return { data: null, error: 'DISABLED_BY_ADMIN' }
    }

    const adminDb = createAdminClient()
    const { data: subData } = await adminDb
      .from('office_subscriptions')
      .select('subscription_plans (max_users)')
      .eq('office_id', targetMember.office_id)
      .single()

    const maxUsers = (subData?.subscription_plans as unknown as { max_users: number } | null)?.max_users || 1

    const { count: activeCount } = await adminDb
      .from('office_members')
      .select('*', { count: 'exact', head: true })
      .eq('office_id', targetMember.office_id)
      .eq('is_active', true)

    if ((activeCount || 0) >= maxUsers) {
      // Audit the failed reactivation attempt for compliance tracking
      await adminDb.from('audit_logs').insert({
        office_id: targetMember.office_id,
        user_id: user.id,
        action: 'attempt_reactivation_during_overage',
        entity_type: 'office_members',
        entity_id: targetMember.user_id,
        details: {
          member_id: targetMember.user_id,
          attempted_by: user.id,
          office_id: targetMember.office_id,
          active_count: activeCount,
          max_users: maxUsers,
          reason: 'MEMBER_LIMIT_REACHED'
        }
      })
      return { data: null, error: 'MEMBER_LIMIT_REACHED' }
    }
  }

  const { error } = await supabase
    .from('office_members')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { data: null, error: 'فشل تغيير حالة العضو' }

  // Audit log
  const adminDb = createAdminClient()
  await adminDb.from('audit_logs').insert({
    office_id: targetMember.office_id,
    user_id: user.id,
    action: isActive ? 'member_reactivated' : 'member_deactivated',
    entity_type: 'office_members',
    entity_id: targetMember.user_id,
    details: {
      member_id: targetMember.user_id,
      performed_by: user.id,
      office_id: targetMember.office_id
    }
  })

  // Auto-resolve overage logic on deactivation
  if (!isActive) {
    const overageDb = adminDb

    const { data: overageData } = await overageDb
      .from('office_member_overage')
      .select('id, max_users')
      .eq('office_id', targetMember.office_id)
      .eq('resolved', false)
      .maybeSingle()

    if (overageData) {
      const { count: cCount } = await overageDb
        .from('office_members')
        .select('*', { count: 'exact', head: true })
        .eq('office_id', targetMember.office_id)
        .eq('is_active', true)

      if (cCount !== null && cCount <= overageData.max_users) {
        await overageDb
          .from('office_member_overage')
          .update({ resolved: true, updated_at: new Date().toISOString() })
          .eq('id', overageData.id)

        const { data: owner } = await overageDb
          .from('office_members')
          .select('user_id')
          .eq('office_id', targetMember.office_id)
          .eq('role', 'owner')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (owner) {
          await overageDb.from('notifications').insert({
            office_id: targetMember.office_id,
            user_id: owner.user_id,
            type: 'system',
            title: 'تم حل مشكلة تجاوز الأعضاء',
            body: 'تم حل مشكلة تجاوز الأعضاء، مكتبك نشط الآن وتحت الحدود المسموحة.'
          })
        }
      }
    }
  }

  revalidatePath('/dashboard/team')
  return { data: null, error: null }
}
export async function getAuditLogs() {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()

  const { data: hasLogPerm, error: permError } = await supabase.rpc('has_permission', { p_perm: 'view_audit_logs' }).single()
  if (permError || !hasLogPerm) {
    return { data: null, error: 'غير مصرح لك بعرض سجلات الرقابة' }
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return { data: null, error: 'فشل في جلب سجلات الرقابة' }
  }

  return { data, error: null }
}

export async function getMemberById(memberId: string) {
  const guardError = await requireActiveSubscription()
  if (guardError) return { data: null, error: guardError }

  const supabase = await createClient()
  
  // 1. Fetch member basic data
  const { data: member, error } = await supabase
    .from('office_members')
    .select(`
      *,
      profiles (full_name, phone)
    `)
    .eq('id', memberId)
    .single()
  
  if (error || !member) {
    console.error('Error fetching team member:', error)
    return { data: null, error: 'عضو الفريق غير موجود' }
  }

  // 2. Fetch stats and lists (Cases where this user is assigned)
  const { data: recentCases, count: casesCount } = await supabase
    .from('cases')
    .select('*, clients:client_id(name)', { count: 'exact' })
    .eq('office_id', member.office_id)
    .eq('assigned_to', member.user_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentSessions, count: sessionsCount } = await supabase
    .from('sessions')
    .select('*, cases!inner(title, assigned_to)', { count: 'exact' })
    .eq('office_id', member.office_id)
    .eq('cases.assigned_to', member.user_id)
    .order('session_date', { ascending: false })
    .limit(10)

  return { 
    data: { 
      ...member, 
      stats: { 
        casesCount: casesCount || 0, 
        sessionsCount: sessionsCount || 0,
        recentCases: recentCases || [],
        recentSessions: recentSessions || []
      } 
    }, 
    error: null 
  }
}
