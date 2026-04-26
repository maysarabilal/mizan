'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { CaseDialog } from '@/app/dashboard/cases/CaseDialog'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

export function NewCaseButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const handleOpen = async () => {
    setLoading(true)
    const supabase = createClient()
    const [clientsRes, teamRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('office_members').select('*, profiles(full_name)').eq('is_active', true)
    ])
    if (clientsRes.data) setClients(clientsRes.data)
    if (teamRes.data) setTeamMembers(teamRes.data)
    setLoading(false)
    setOpen(true)
  }

  return (
    <>
      <button 
        onClick={handleOpen}
        disabled={loading}
        className="bg-gradient-to-r from-[#1a2744] to-[#243356] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        <Plus className="h-4 w-4" />
        {loading ? 'جاري التحميل...' : 'قضية جديدة'}
      </button>
      
      {open && (
        <CaseDialog
          open={open}
          onOpenChange={setOpen}
          clients={clients}
          teamMembers={teamMembers}
        />
      )}
    </>
  )
}
