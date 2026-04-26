'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientDialog } from '../ClientDialog'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

export function AddClientButton({ clients, allClients }: { clients: Client[], allClients: Client[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#C9A84C] hover:bg-[#b89a42] text-[#1A2744] font-semibold gap-2 shadow-sm"
      >
        <Plus className="h-4 w-4" /> إضافة عميل
      </Button>
      <ClientDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
