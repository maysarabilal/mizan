'use client'

import { useEffect, useState, useRef, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Search, Bell, HelpCircle, User, LogOut, Briefcase, Users, Calendar, ListTodo, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { globalSearchAction, type SearchResult } from '@/lib/actions/search'

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

const TYPE_CONFIG = {
  case: { label: 'قضايا', icon: Briefcase, href: (id: string) => `/dashboard/cases/${id}` },
  client: { label: 'عملاء', icon: Users, href: (id: string) => `/dashboard/clients/${id}` },
  session: { label: 'جلسات', icon: Calendar, href: (id: string) => `/dashboard/sessions/${id}` },
  task: { label: 'مهام', icon: ListTodo, href: () => '/dashboard/tasks' },
} as const

export function Topbar() {
  const [userName, setUserName] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

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

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const { data } = await globalSearchAction(value)
        setResults(data ?? [])
        setShowDropdown(true)
      })
    }, 300)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      setSearchQuery('')
    }
  }

  const handleResultClick = (result: SearchResult) => {
    const config = TYPE_CONFIG[result.type]
    setShowDropdown(false)
    setSearchQuery('')
    router.push(config.href(result.id))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

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

        <div ref={containerRef} className="hidden md:block relative w-64 lg:w-96">
          <div className="relative flex items-center">
            {isPending ? (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-[#c9a84c] animate-spin" />
            ) : (
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            )}
            <Input
              type="search"
              placeholder="بحث عن قضية أو عميل..."
              className="w-full bg-[#eef0f4] border-none rounded-lg pl-8 pr-10 rtl:pr-10 rtl:pl-4 focus-visible:ring-1 focus-visible:ring-[#c9a84c] transition-shadow"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
            />
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto" dir="rtl">
              {results.length === 0 && !isPending ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  لا توجد نتائج
                </div>
              ) : (
                Object.entries(grouped).map(([type, items]) => {
                  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]
                  if (!config) return null
                  return (
                    <div key={type}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="w-full text-right px-3 py-2.5 hover:bg-[#c9a84c]/10 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-b-0"
                        >
                          <config.icon className="h-4 w-4 text-[#c9a84c] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

    </header>
  )
}
