'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const ADMIN_ROUTES = [
  { label: 'نظرة عامة', icon: LayoutDashboard, href: '/admin' },
  { label: 'المكاتب', icon: Building2, href: '/admin/offices' },
  { label: 'المستخدمين', icon: Users, href: '/admin/users' },
  { label: 'إدارة الاشتراكات', icon: CreditCard, href: '/admin/subscriptions' },
  { label: 'إعدادات النظام', icon: Settings, href: '/admin/settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [adminName, setAdminName] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) setAdminName(profile.full_name)
    }
    fetch()
  }, [])

  return (
    <div className={cn("flex flex-col h-full bg-zinc-950 text-white border-l border-zinc-800 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
      {/* Header */}
      <div className={cn("flex h-16 items-center border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10 transition-colors", isCollapsed ? "justify-center" : "justify-between px-6")}>
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="text-base font-bold">ميزان</span>
              <span className="text-[10px] text-amber-400 font-normal tracking-widest uppercase">Admin Console</span>
            </div>
          </Link>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className={cn("text-zinc-400 hover:text-white transition-colors shrink-0", isCollapsed ? "p-2 hover:bg-zinc-800 rounded-lg" : "")}
          title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <nav className="flex flex-col gap-1.5 px-3">
          {ADMIN_ROUTES.map((route) => {
            const isActive = pathname === route.href || (pathname.startsWith(`${route.href}/`) && route.href !== '/admin')
            return (
              <Link
                key={route.href}
                href={route.href}
                title={isCollapsed ? route.label : undefined}
                className={cn(
                  "flex items-center rounded-xl py-3 transition-all duration-200 group",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-4 text-sm",
                  isActive
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-medium"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                )}
              >
                <route.icon className={cn(
                  "shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isCollapsed ? "h-6 w-6" : "h-5 w-5",
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-amber-400"
                )} />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Admin Profile */}
      <div className={cn("p-4 bg-zinc-950 border-t border-zinc-800 flex", isCollapsed ? "flex-col items-center gap-4 py-6" : "items-center gap-3")}>
        <div className={cn("flex items-center bg-zinc-900/40 border border-zinc-800/60 shrink-0", isCollapsed ? "p-1 rounded-full justify-center w-12 h-12" : "flex-1 gap-3 p-2 rounded-xl")}>
          <div className={cn("rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0", isCollapsed ? "h-10 w-10" : "h-10 w-10")}>
            {adminName ? adminName.charAt(0).toUpperCase() : <ShieldCheck className="h-4 w-4" />}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-zinc-100">
                {adminName || 'مدير النظام'}
              </span>
              <span className="px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20 w-fit">
                PLATFORM ADMIN
              </span>
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className={cn("flex items-center justify-center rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20 shrink-0", isCollapsed ? "h-10 w-10" : "h-10 w-10")}
          title="تسجيل الخروج"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
