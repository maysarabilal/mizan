import { getSessions } from '@/lib/actions/sessions'
import { getCases } from '@/lib/actions/cases'
import { SessionTable } from './SessionTable'
import { SessionCalendar } from './SessionCalendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { List, Calendar as CalendarIcon } from 'lucide-react'

export default async function SessionsPage() {
  const [{ data: sessions }, { data: cases }] = await Promise.all([
    getSessions(),
    getCases()
  ])

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">الجلسات والمواعيد</h1>
        <p className="text-muted-foreground text-sm">جدولة الجلسات، مواعيد المحاكم، وتتبع مسارات القضايا بشكل يومي أو شهري</p>
      </div>

      <Tabs defaultValue="list" className="w-full space-y-4" >
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" /> العرض كقائمة
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> التقويم
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="m-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <SessionTable initialSessions={sessions as any || []} cases={cases || []} />
        </TabsContent>
        <TabsContent value="calendar" className="m-0 border-none p-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <SessionCalendar sessions={sessions as any || []} cases={cases || []} />
        </TabsContent>
      </Tabs>
      
    </div>
  )
}
