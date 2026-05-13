'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionDialog } from '../SessionDialog'
import { Database } from '@/types/database'

type CaseRow = Database['public']['Tables']['cases']['Row']

interface AddSessionButtonProps {
  cases: CaseRow[]
  workingDays: string[]
}

export function AddSessionButton({ cases, workingDays }: AddSessionButtonProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsAddOpen(true)}
        className="bg-[#C9A84C] hover:bg-[#b89a42] text-[#1A2744] font-semibold shadow-sm rounded-md h-[38px] px-4 gap-2"
      >
        <Plus className="h-[18px] w-[18px]" />
        جلسة جديدة
      </Button>

      <SessionDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddOpen(false)
        }}
        sessionItem={null}
        cases={cases}
        workingDays={workingDays}
      />
    </>
  )
}
