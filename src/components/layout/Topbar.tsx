'use client'

import Link from 'next/link'
import { Menu, Search, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { Sidebar } from './Sidebar'

export function Topbar() {


  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-10 w-10 md:hidden shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">فتح القائمة</span>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-64 border-l-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        {/* Global Search (UI Only for MVP) */}
        <div className="hidden md:flex relative w-96 max-w-sm items-center">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث عن قضية أو عميل..."
            className="w-full bg-muted/50 pl-8 pr-9 rtl:pr-8 rtl:pl-4 focus-visible:bg-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600"></span>
            <span className="sr-only">الإشعارات</span>
          </Button>
        </Link>

        {/* Notifications and Settings are now consolidated in Sidebar or linked via Bell */}
      </div>
    </header>
  )
}
