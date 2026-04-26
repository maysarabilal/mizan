'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CaseDialog } from '../CaseDialog'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

interface AddCaseButtonProps {
  children?: React.ReactNode
  clients: Client[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any[]
}

export function AddCaseButton({ clients, teamMembers }: AddCaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-[#C9A84C] hover:bg-[#b89a42] text-[#1A2744] font-semibold flex items-center gap-2 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        إضافة قضية
      </Button>

      <CaseDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        caseItem={null}
        clients={clients}
        teamMembers={teamMembers}
      />
    </>
  )
}
