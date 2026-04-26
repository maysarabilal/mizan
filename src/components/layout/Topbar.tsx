'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Search, Bell, HelpCircle, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Sidebar } from './Sidebar'
import { NewCaseButton } from './NewCaseButton'

export function Topbar() {
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) setUserName(profile.full_name)
    }
    fetchUserData()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 bg-white dark:bg-zinc-950">
      
      {/* Right side (RTL Start): Mobile Menu, Avatar, Notifications, Help */}
      <div className="flex items-center gap-4 md:gap-6">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-10 w-10 md:hidden shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">فتح القائمة</span>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-64 border-l-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none shrink-0 group">
            <div className="h-10 w-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] font-bold text-sm group-hover:scale-105 transition-transform">
              {userName ? userName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" dir="rtl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName || 'جاري التحميل...'}</p>
                <p className="text-xs leading-none text-muted-foreground">الملف الشخصي</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard/profile'} className="cursor-pointer">
              <User className="mr-2 h-4 w-4 shrink-0" />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 shrink-0" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications and Help Buttons */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
          <Link href="/dashboard/notifications">
            <button className="relative text-slate-500 hover:text-[#1a2744] transition-colors p-2">
              <Bell className="h-5 w-5 shrink-0" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 border border-white"></span>
              <span className="sr-only">الإشعارات</span>
            </button>
          </Link>

          <button className="relative text-slate-500 transition-colors p-2 cursor-not-allowed opacity-60" disabled title="قريباً">
            <HelpCircle className="h-5 w-5 shrink-0" />
            <span className="sr-only">المساعدة</span>
          </button>
        </div>
      </div>

      {/* Left side (RTL End): New Case Button, Search Bar */}
      <div className="flex items-center gap-4">
        <NewCaseButton />

        <div className="hidden md:flex relative w-64 lg:w-96 items-center">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="بحث عن قضية أو عميل..."
            className="w-full bg-[#eef0f4] border-none rounded-lg pl-8 pr-10 rtl:pr-10 rtl:pl-4 focus-visible:ring-1 focus-visible:ring-[#c9a84c] transition-shadow"
          />
        </div>
      </div>

    </header>
  )
}
