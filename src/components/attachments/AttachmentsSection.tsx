'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Paperclip, Plus, Trash2, FileText, Image as ImageIcon, FileSpreadsheet, File,
  Loader2, Upload,
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploader_name: string | null
  created_at: string
}

interface AttachmentsSectionProps {
  entityId: string
  entityType: 'case' | 'session'
  currentUserId: string
  userRole: string
  fetchAttachments: (entityId: string) => Promise<{ data: Attachment[] | null; error: string | null }>
  uploadAttachment: (entityId: string, formData: FormData) => Promise<{ data: unknown | null; error: string | null }>
  deleteAttachment: (attachmentId: string) => Promise<{ data: unknown | null; error: string | null }>
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-[#3B82F6]" />
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-[#EF4444]" />
  if (fileType.includes('word') || fileType.includes('document')) return <FileSpreadsheet className="h-5 w-5 text-[#2563EB]" />
  return <File className="h-5 w-5 text-[#9AA3B2]" />
}

function getFileEmoji(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  return '📎'
}

export function AttachmentsSection({
  entityId,
  entityType,
  currentUserId,
  userRole,
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
}: AttachmentsSectionProps) {
  const router = useRouter()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canDelete = (attachment: Attachment) =>
    attachment.uploaded_by === currentUserId || ['owner', 'admin'].includes(userRole)

  useEffect(() => {
    loadAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId])

  async function loadAttachments() {
    setIsLoading(true)
    const { data, error } = await fetchAttachments(entityId)
    if (error) {
      toast.error(error)
    } else {
      setAttachments(data || [])
    }
    setIsLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ''

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const { error } = await uploadAttachment(entityId, formData)
    setIsUploading(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم رفع المرفق بنجاح')
    await loadAttachments()
    router.refresh()
  }

  async function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId)
    const { error } = await deleteAttachment(attachmentId)
    setDeletingId(null)
    setConfirmDeleteId(null)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('تم حذف المرفق')
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    router.refresh()
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-black/[0.08] dark:border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08]">
        <div className="flex items-center gap-2.5">
          <Paperclip className="h-[18px] w-[18px] text-[#9AA3B2]" />
          <span className="text-[15px] font-semibold text-[#0F1724] dark:text-zinc-100">المرفقات</span>
          <span className="bg-[#1A2744] text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {attachments.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2 border-black/10 text-[#0F1724] font-medium text-[13px]"
        >
          {isUploading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الرفع...</>
          ) : (
            <><Plus className="h-3.5 w-3.5" /> إضافة مرفق</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 text-[#C9A84C] animate-spin" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Upload className="h-10 w-10 text-[#9AA3B2] opacity-30 mb-3" />
          <p className="font-medium text-[#0F1724] dark:text-zinc-100 text-[15px]">لا توجد مرفقات بعد</p>
          <p className="text-sm text-[#9AA3B2] mt-1">
            ارفع ملفاً (PDF, Word, صورة) بحد أقصى 15 ميغابايت
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 gap-2 border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/5"
          >
            <Plus className="h-3.5 w-3.5" /> رفع مرفق
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.06]">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFBFC] dark:hover:bg-zinc-900/30 transition-colors group"
            >
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  {getFileIcon(att.file_type)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium text-[#0F1724] dark:text-zinc-100 truncate hover:text-[#C9A84C] transition-colors">
                    {getFileEmoji(att.file_type)} {att.file_name}
                  </span>
                  <div className="flex items-center gap-2 text-[12px] text-[#9AA3B2]">
                    <span>{formatFileSize(att.file_size)}</span>
                    <span>•</span>
                    <span>{format(new Date(att.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
                    {att.uploader_name && (
                      <>
                        <span>•</span>
                        <span>{att.uploader_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </a>

              {canDelete(att) && (
                <button
                  onClick={() => setConfirmDeleteId(att.id)}
                  disabled={deletingId === att.id}
                  className="shrink-0 p-2 rounded-md text-[#9AA3B2] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100"
                >
                  {deletingId === att.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => !v && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-[16px]">
              <Trash2 className="h-5 w-5" /> تأكيد حذف المرفق
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المرفق؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>تراجع</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!!deletingId}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              {deletingId ? 'جاري الحذف...' : 'حذف المرفق'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
