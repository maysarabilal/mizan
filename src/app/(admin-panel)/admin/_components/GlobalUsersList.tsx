'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { User, Building2, Phone, Mail, ChevronUp, ChevronDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UserRow = any

export function GlobalUsersList({ users }: { users: UserRow[] }) {
  const [roleFilter, setRoleFilter] = useState('all')
  const [officeFilter, setOfficeFilter] = useState('all')
  const [expandedOffices, setExpandedOffices] = useState<Set<string>>(new Set())

  const toggleOffice = (officeName: string) => {
    const newSet = new Set(expandedOffices)
    if (newSet.has(officeName)) newSet.delete(officeName)
    else newSet.add(officeName)
    setExpandedOffices(newSet)
  }

  // Generate unique offices for the dropdown
  const uniqueOffices = useMemo(() => {
    const set = new Set<string>()
    users.forEach((u) => {
      if (u.offices?.name) set.add(u.offices.name)
    })
    return Array.from(set).sort()
  }, [users])

  // Filter and Group
  const groupedFilteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      const oName = u.offices?.name || 'بدون مكتب'
      if (officeFilter !== 'all' && oName !== officeFilter) return false
      return true
    })

    const groups: Record<string, UserRow[]> = {}
    filtered.forEach((u) => {
      const oName = u.offices?.name || 'بدون مكتب'
      if (!groups[oName]) groups[oName] = []
      groups[oName].push(u)
    })

    return groups
  }, [users, roleFilter, officeFilter])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <Badge className="bg-amber-900/30 text-amber-400 border-amber-800">مالك مكتب</Badge>
      case 'admin': return <Badge className="bg-orange-900/30 text-orange-400 border-orange-800">مدير</Badge>
      case 'lawyer': return <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">محامي</Badge>
      case 'secretary': return <Badge className="bg-blue-900/30 text-blue-400 border-blue-800">سكرتير</Badge>
      case 'trainee': return <Badge className="bg-purple-900/30 text-purple-400 border-purple-800">متدرب</Badge>
      default: return <Badge variant="outline" className="border-zinc-700 text-zinc-400">{role}</Badge>
    }
  }

  if (users.length === 0) {
    return <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">لا يوجد مستخدمين مسجلين في النظام.</div>
  }

  const officeNames = Object.keys(groupedFilteredUsers).sort()

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/80 w-fit">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-zinc-800 text-sm text-zinc-300 rounded-md border border-zinc-700 px-3 py-1.5 outline-none focus:border-zinc-500 min-w-[150px]"
        >
          <option value="all">كل الأدوار</option>
          <option value="owner">مالك مكتب</option>
          <option value="admin">مدير</option>
          <option value="lawyer">محامي</option>
          <option value="secretary">سكرتير</option>
          <option value="trainee">متدرب</option>
        </select>

        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="bg-zinc-800 text-sm text-zinc-300 rounded-md border border-zinc-700 px-3 py-1.5 outline-none focus:border-zinc-500 min-w-[180px]"
        >
          <option value="all">كل المكاتب</option>
          {uniqueOffices.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
          <option value="بدون مكتب">بدون مكتب</option>
        </select>
      </div>

      <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-800/50 border-zinc-800">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-right text-zinc-400">الاسم</TableHead>
              <TableHead className="text-right text-zinc-400">البريد الإلكتروني</TableHead>
              <TableHead className="text-right text-zinc-400">رقم التواصل</TableHead>
              <TableHead className="text-right text-zinc-400">الدور</TableHead>
              <TableHead className="text-right text-zinc-400">حالة الحساب</TableHead>
              <TableHead className="text-right text-zinc-400">تاريخ الانضمام</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {officeNames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                  لا توجد نتائج تطابق الفلتر المحدد.
                </TableCell>
              </TableRow>
            ) : (
              officeNames.map((officeName) => {
                const members = groupedFilteredUsers[officeName]
                const isExpanded = expandedOffices.has(officeName)

                return (
                  <span key={officeName} className="contents">
                    {/* Office Group Header */}
                    <TableRow 
                      className="border-zinc-800 bg-zinc-800/20 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      onClick={() => toggleOffice(officeName)}
                    >
                      <TableCell className="p-3 text-zinc-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                      </TableCell>
                      <TableCell colSpan={6} className="font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-500" />
                          <span>{officeName}</span>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 ms-2">
                            {members.length} {members.length === 1 ? 'عضو' : 'أعضاء'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Members Rows */}
                    {isExpanded && members.map((member) => (
                      <TableRow key={member.id} className="border-zinc-800 hover:bg-zinc-800/60 bg-zinc-950/30">
                        <TableCell></TableCell>
                        <TableCell className="font-medium text-zinc-200 flex items-center gap-2 border-b-0">
                          <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          {member.profiles?.full_name || 'مستخدم غير معروف'}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-300" dir="ltr">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-600" />
                            {member.email || 'غير محدد'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-300" dir="ltr">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-600" />
                            {member.profiles?.phone || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>
                          {member.is_active ?
                            <Badge variant="outline" className="text-emerald-400 border-emerald-800 bg-emerald-950/20">نشط</Badge> :
                            <Badge variant="destructive" className="bg-red-950/50 text-red-400 border-red-900 border">موقوف</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500" dir="ltr">
                          {format(new Date(member.created_at), 'yyyy/MM/dd')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </span>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
