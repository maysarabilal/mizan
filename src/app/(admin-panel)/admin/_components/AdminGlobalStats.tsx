'use client'

import { Briefcase, CalendarDays, UserCheck, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GlobalStats {
  cases: number
  clients: number
  sessions: number
  members: number
  revenue: number
}

export function AdminGlobalStats({ stats }: { stats: GlobalStats }) {
  const items = [
    { label: 'الإيرادات المؤكدة', value: `₪${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'إجمالي المستخدمين', value: stats.members.toLocaleString(), icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'إجمالي القضايا', value: stats.cases.toLocaleString(), icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'إجمالي الجلسات', value: stats.sessions.toLocaleString(), icon: CalendarDays, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="border-zinc-800 shadow-sm bg-zinc-900 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">{item.label}</CardTitle>
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
