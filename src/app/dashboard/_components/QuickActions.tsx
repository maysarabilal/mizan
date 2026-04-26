'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { CaseDialog } from '@/app/dashboard/cases/CaseDialog'
import { ClientDialog } from '@/app/dashboard/clients/ClientDialog'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

export function QuickActions() {
  const [caseOpen, setCaseOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [loadingCase, setLoadingCase] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const handleOpenCase = async () => {
    setLoadingCase(true)
    const supabase = createClient()
    const [clientsRes, teamRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('office_members').select('*, profiles(full_name)').eq('is_active', true)
    ])
    if (clientsRes.data) setClients(clientsRes.data)
    if (teamRes.data) setTeamMembers(teamRes.data)
    setLoadingCase(false)
    setCaseOpen(true)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eef0f4] p-6">
        <h3 className="text-[#1a2744] font-bold text-lg mb-4">إجراءات سريعة</h3>
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleOpenCase}
            disabled={loadingCase}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#eef0f4]/80 transition-colors group text-start w-full"
          >
            <div className="bg-[#c9a84c]/10 text-[#c9a84c] p-2 rounded-lg group-hover:bg-[#c9a84c] group-hover:text-white transition-colors shrink-0">
              <Plus size={18} />
            </div>
            <span className="text-[#1a2744] text-sm font-medium">{loadingCase ? 'جاري التحميل...' : 'قضية جديدة'}</span>
          </button>
          
          <button 
            onClick={() => setClientOpen(true)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#eef0f4]/80 transition-colors group text-start w-full"
          >
            <div className="bg-[#1a2744]/5 text-[#1a2744] p-2 rounded-lg group-hover:bg-[#1a2744] group-hover:text-white transition-colors shrink-0">
              <Users size={18} />
            </div>
            <span className="text-[#1a2744] text-sm font-medium">إضافة عميل</span>
          </button>
          
          <button className="flex items-center gap-3 p-3 rounded-lg transition-colors group opacity-60 cursor-not-allowed w-full text-start" title="إنشاء مستند (قريباً)" disabled>
            <div className="bg-slate-100 text-slate-400 p-2 rounded-lg shrink-0">
              <FileText size={18} />
            </div>
            <span className="text-slate-400 text-sm font-medium">إنشاء مستند</span>
          </button>
        </div>
      </div>

      {caseOpen && (
        <CaseDialog
          open={caseOpen}
          onOpenChange={setCaseOpen}
          clients={clients}
          teamMembers={teamMembers}
        />
      )}

      {clientOpen && (
        <ClientDialog
          open={clientOpen}
          onOpenChange={setClientOpen}
        />
      )}
    </>
  )
}
