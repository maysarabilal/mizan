'use client'

import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import arLocale from '@fullcalendar/core/locales/ar'
import { Database } from '@/types/database'
import { SessionDialog } from './SessionDialog'

type SessionRowExt = Database['public']['Tables']['sessions']['Row'] & { 
  cases: { title: string, clients: { name: string } | null } | null 
}
type CaseRow = Database['public']['Tables']['cases']['Row']

export function SessionCalendar({ sessions, cases }: { sessions: SessionRowExt[], cases: CaseRow[] }) {
  const [selectedSession, setSelectedSession] = useState<SessionRowExt | null>(null)
  
  const events = sessions.map(session => {
    // Merge date and time if available
    const startStr = session.session_time 
      ? `${session.session_date}T${session.session_time}`
      : session.session_date

    // Color based on outcome
    let backgroundColor = '#3b82f6' // default blue
    if (session.outcome === 'completed') backgroundColor = '#10b981' // green
    if (session.outcome === 'postponed') backgroundColor = '#f59e0b' // yellow
    if (session.outcome === 'cancelled') backgroundColor = '#ef4444' // red

    return {
      id: session.id,
      title: `${session.cases?.title} - ${session.session_type}`,
      start: startStr,
      backgroundColor,
      borderColor: backgroundColor,
      extendedProps: {
        session
      }
    }
  })

  return (
    <div className="bg-white dark:bg-zinc-950 p-4 border rounded-xl shadow-sm min-h-[600px]">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locales={[arLocale]}
        locale="ar"
        direction="rtl"
        events={events}
        eventClick={(info) => {
          setSelectedSession(info.event.extendedProps.session)
        }}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
          hour12: false
        }}
        buttonText={{
          today:    'اليوم',
          month:    'شهر',
          week:     'أسبوع',
          day:      'يوم',
          list:     'قائمة'
        }}
      />

      <SessionDialog 
        open={!!selectedSession} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSession(null)
          }
        }} 
        sessionItem={selectedSession}
        cases={cases}
      />
    </div>
  )
}
