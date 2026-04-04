'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AdminSidebar } from './AdminSidebar'


export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800">
        <Menu className="h-5 w-5" />
        <span className="sr-only">فتح القائمة</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 p-0 bg-zinc-950 border-l border-zinc-800 text-white flex flex-col pt-10">
        <SheetTitle className="sr-only">قائمة الإدارة</SheetTitle>
        <SheetDescription className="sr-only">تنقل مدير المنصة</SheetDescription>
        <div className="flex-1 w-full" onClick={() => setOpen(false)}>
          <AdminSidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}
