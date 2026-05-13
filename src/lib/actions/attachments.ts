'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'
import type { Database } from '@/types/database'

type CaseAttachment = Database['public']['Tables']['case_attachments']['Row']
type SessionAttachment = Database['public']['Tables']['session_attachments']['Row']

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

// ─── Case Attachments ───

export async function getCaseAttachments(caseId: string): Promise<ActionResult<(CaseAttachment & { uploader_name: string | null })[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('case_attachments')
    .select('*, profiles:uploaded_by(full_name)')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching case attachments:', error)
    return { data: null, error: 'فشل في جلب المرفقات' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (data || []).map((row: any) => ({
    ...row,
    uploader_name: row.profiles?.full_name || null,
    profiles: undefined,
  }))

  return { data: mapped, error: null }
}

export async function saveAttachmentRecord(params: {
  entityType: 'case' | 'session'
  entityId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  storagePath: string
}): Promise<ActionResult<CaseAttachment | SessionAttachment>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'غير مصرح' }

  const { data: officeId } = await supabase.rpc('current_office_id').single()
  if (!officeId) return { data: null, error: 'لم يتم تحديد المكتب' }

  if (params.entityType === 'case') {
    const { data: attachment, error: insertError } = await supabase
      .from('case_attachments')
      .insert({
        case_id: params.entityId,
        office_id: officeId,
        uploaded_by: user.id,
        file_name: params.fileName,
        file_url: params.fileUrl,
        file_type: params.fileType,
        file_size: params.fileSize,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert case attachment error:', insertError)
      return { data: null, error: 'فشل في حفظ بيانات المرفق' }
    }

    revalidatePath(`/dashboard/cases/${params.entityId}`)
    return { data: attachment, error: null }
  } else {
    const { data: attachment, error: insertError } = await supabase
      .from('session_attachments')
      .insert({
        session_id: params.entityId,
        office_id: officeId,
        uploaded_by: user.id,
        file_name: params.fileName,
        file_url: params.fileUrl,
        file_type: params.fileType,
        file_size: params.fileSize,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert session attachment error:', insertError)
      return { data: null, error: 'فشل في حفظ بيانات المرفق' }
    }

    revalidatePath(`/dashboard/sessions/${params.entityId}`)
    return { data: attachment, error: null }
  }
}

export async function deleteCaseAttachment(attachmentId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'غير مصرح' }

  // Fetch attachment (RLS will verify office membership)
  const { data: attachment, error: fetchError } = await supabase
    .from('case_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single()

  if (fetchError || !attachment) {
    return { data: null, error: 'المرفق غير موجود' }
  }

  // Permission check: uploader OR admin/owner
  if (attachment.uploaded_by !== user.id) {
    const { data: member } = await supabase
      .from('office_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('office_id', attachment.office_id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return { data: null, error: 'ليس لديك صلاحية حذف هذا المرفق' }
    }
  }

  // Extract storage path from URL
  const urlParts = attachment.file_url.split('/storage/v1/object/public/uploads/')
  if (urlParts[1]) {
    await supabase.storage.from('uploads').remove([urlParts[1]])
  }

  const { error: deleteError } = await supabase
    .from('case_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    console.error('Delete case attachment error:', deleteError)
    return { data: null, error: 'فشل في حذف المرفق' }
  }

  revalidatePath(`/dashboard/cases/${attachment.case_id}`)
  return { data: null, error: null }
}

// ─── Session Attachments ───

export async function getSessionAttachments(sessionId: string): Promise<ActionResult<(SessionAttachment & { uploader_name: string | null })[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_attachments')
    .select('*, profiles:uploaded_by(full_name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching session attachments:', error)
    return { data: null, error: 'فشل في جلب المرفقات' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (data || []).map((row: any) => ({
    ...row,
    uploader_name: row.profiles?.full_name || null,
    profiles: undefined,
  }))

  return { data: mapped, error: null }
}



export async function deleteSessionAttachment(attachmentId: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'غير مصرح' }

  const { data: attachment, error: fetchError } = await supabase
    .from('session_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single()

  if (fetchError || !attachment) {
    return { data: null, error: 'المرفق غير موجود' }
  }

  if (attachment.uploaded_by !== user.id) {
    const { data: member } = await supabase
      .from('office_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('office_id', attachment.office_id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return { data: null, error: 'ليس لديك صلاحية حذف هذا المرفق' }
    }
  }

  const urlParts = attachment.file_url.split('/storage/v1/object/public/uploads/')
  if (urlParts[1]) {
    await supabase.storage.from('uploads').remove([urlParts[1]])
  }

  const { error: deleteError } = await supabase
    .from('session_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    console.error('Delete session attachment error:', deleteError)
    return { data: null, error: 'فشل في حذف المرفق' }
  }

  revalidatePath(`/dashboard/sessions/${attachment.session_id}`)
  return { data: null, error: null }
}
