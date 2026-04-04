'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database } from '@/types/database'
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  UserCircle2, 
  Clock, 
  FileJson,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AuditLog = Database['public']['Tables']['audit_logs']['Row'] & {
  profiles: { full_name: string } | null
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACTION_ICONS: Record<string, any> = {
  INSERT: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'إضافة',
  UPDATE: 'تعديل',
  DELETE: 'حذف',
}

const ENTITY_LABELS: Record<string, string> = {
  cases: 'قضية',
  clients: 'عميل',
  sessions: 'جلسة',
  tasks: 'مهمة',
  office_members: 'عضو فريق',
}

export function LogsTable({ logs }: { logs: AuditLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
        <Clock className="h-10 w-10 opacity-20" />
        <p>لا توجد سجلات حالياً. ابدأ بإضافة بيانات لمشاهدة المراقبة.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50/50">
            <TableHead className="text-right font-bold w-[180px]">الوقت</TableHead>
            <TableHead className="text-right font-bold w-[180px]">المستخدم</TableHead>
            <TableHead className="text-right font-bold w-[120px]">الإجراء</TableHead>
            <TableHead className="text-right font-bold w-[150px]">النوع</TableHead>
            <TableHead className="text-right font-bold">التفاصيل</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const Icon = ACTION_ICONS[log.action] || FileJson
            const isExpanded = expandedId === log.id
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const details = log.details as any

            return (
              <>
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-xs truncate max-w-[140px]">
                        {log.profiles?.full_name || 'برمجياً'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("text-[10px] font-bold px-2 py-0.5", ACTION_COLORS[log.action])}>
                      <Icon className="h-3 w-3 me-1 shrink-0" />
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {ENTITY_LABELS[log.entity_type] || log.entity_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                      {log.action === 'INSERT' ? 'تم إنشاء مادة جديدة' : 
                       log.action === 'UPDATE' ? `تعديل ${Object.keys(details?.new || {}).join(', ')}` : 
                       'تم حذف المادة نهائياً'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow className="bg-slate-100/30 dark:bg-zinc-900/30">
                    <TableCell colSpan={6} className="p-4 border-t-0 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        {details?.old && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider px-2">قبل التعديل</h4>
                            <ScrollArea className="h-32 w-full rounded-xl border bg-white dark:bg-zinc-950 p-3">
                              <pre className="text-[10px] font-mono leading-relaxed text-red-500">
                                {JSON.stringify(details.old, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}
                        {details?.new && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider px-2">
                              {log.action === 'INSERT' ? 'البيانات المنشأة' : 'بعد التعديل'}
                            </h4>
                            <ScrollArea className="h-32 w-full rounded-xl border bg-white dark:bg-zinc-950 p-3">
                              <pre className="text-[10px] font-mono leading-relaxed text-emerald-600">
                                {JSON.stringify(details.new, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}
                        {!details?.old && !details?.new && (
                          <div className="col-span-2 text-center text-xs text-muted-foreground py-4 italic">
                            (تم حذف المادة ID: {log.entity_id})
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
