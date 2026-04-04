'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  CheckSquare,
  UsersRound,
  Bell,
  Settings,
  CreditCard,
  ScrollText,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type UserRole = 'owner' | 'admin' | 'lawyer' | 'secretary' | 'trainee' | null

// Route visibility mapping to specific permission keys
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard/cases': 'view_cases',
  '/dashboard/clients': 'view_clients',
  '/dashboard/sessions': 'view_sessions',
  '/dashboard/tasks': 'view_tasks',
  '/dashboard/team': 'view_team',
  '/dashboard/subscription': 'view_billing',
  '/dashboard/logs': 'view_audit_logs',
  '/dashboard/settings': 'manage_team',
}

const ALL_ROUTES = [
  { label: 'لوحة التحكم', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'العملاء', icon: Users, href: '/dashboard/clients' },
  { label: 'القضايا', icon: Briefcase, href: '/dashboard/cases' },
  { label: 'الجلسات', icon: CalendarDays, href: '/dashboard/sessions' },
  { label: 'المهام', icon: CheckSquare, href: '/dashboard/tasks' },
  { label: 'الفريق', icon: UsersRound, href: '/dashboard/team' },
  { label: 'الإشعارات', icon: Bell, href: '/dashboard/notifications' },
  { label: 'الاشتراك والباقات', icon: CreditCard, href: '/dashboard/subscription' },
  { label: 'سجلات الرقابة', icon: ScrollText, href: '/dashboard/logs' },
  { label: 'الإعدادات', icon: Settings, href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userPerms, setUserPerms] = useState<Record<string, boolean>>({})
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, memberRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('office_members').select('role, permissions').eq('user_id', user.id).eq('is_active', true).single(),
      ])

      if (profileRes.data?.full_name) setUserName(profileRes.data.full_name)
      
      if (memberRes.data) {
        setUserRole(memberRes.data.role as UserRole)
        setUserPerms((memberRes.data.permissions as Record<string, boolean>) || {})
      }
    }
    fetchUserData()
  }, [])

  const visibleRoutes = ALL_ROUTES.filter((route) => {
    // Owner sees everything
    if (userRole === 'owner') return true

    // Check specific permission for the route
    const requiredPerm = ROUTE_PERMISSIONS[route.href]
    if (!requiredPerm) return true
    
    return userPerms[requiredPerm] === true
  })

  const ROLE_LABELS: Record<string, string> = {
    owner: 'مالك',
    admin: 'مدير',
    lawyer: 'محامي',
    secretary: 'سكرتارية',
    trainee: 'متدرب'
  }

  return (
    <div className="flex flex-col h-full w-64 bg-slate-950 text-white border-l dark:border-zinc-800">
      <Link href="/dashboard" className="flex h-16 items-center px-6 font-bold text-xl border-b border-slate-900 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10 hover:bg-slate-900/50 transition-colors">
        <Image src="/logo.svg" alt="Mizan Logo" width={32} height={32} className="h-8 w-8 me-3 object-contain" />
        ميزان
      </Link>
      
      <div className="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        <nav className="flex flex-col gap-1.5 px-3">
          {visibleRoutes.map((route) => {
            const isActive = pathname === route.href || (pathname.startsWith(`${route.href}/`) && route.href !== '/dashboard')
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/40 font-medium" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                )}
              >
                <route.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-primary"
                )} />
                {route.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile Section with Role Badge & Logout */}
      <div className="p-4 bg-slate-950 border-t border-slate-900">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/profile" 
            className="flex-1 flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-900/60 hover:bg-slate-900 hover:border-primary/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
              {userName ? userName.charAt(0).toUpperCase() : <UsersRound className="h-4 w-4" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-slate-100">
                {userName || 'جاري التحميل...'}
              </span>
              <div className="flex items-center mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  userRole === 'owner' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  userRole === 'admin' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  userRole === 'lawyer' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}>
                  {userRole ? ROLE_LABELS[userRole] : '---'}
                </span>
              </div>
            </div>
          </Link>
          
          <button 
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
            title="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
