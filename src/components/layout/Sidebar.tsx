'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  CheckSquare,
  UserPlus,
  Bell,
  Settings,
  CreditCard,
  ScrollText,
  Menu,
  HelpCircle,
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
  { label: 'القضايا', icon: FolderOpen, href: '/dashboard/cases' },
  { label: 'الجلسات', icon: Calendar, href: '/dashboard/sessions' },
  { label: 'العملاء', icon: Users, href: '/dashboard/clients' },
  { label: 'المهام', icon: CheckSquare, href: '/dashboard/tasks' },
  { label: 'الفريق', icon: UserPlus, href: '/dashboard/team' },
  { label: 'الإشعارات', icon: Bell, href: '/dashboard/notifications' },
  { label: 'سجلات الرقابة', icon: ScrollText, href: '/dashboard/logs' },
  { label: 'الاشتراك والباقات', icon: CreditCard, href: '/dashboard/subscription', isBottom: true },
  { label: 'الإعدادات', icon: Settings, href: '/dashboard/settings', isBottom: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userPerms, setUserPerms] = useState<Record<string, boolean>>({})
  const [userName, setUserName] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  const topRoutes = visibleRoutes.filter(r => !r.isBottom)
  const bottomRoutes = visibleRoutes.filter(r => r.isBottom)

  const ROLE_LABELS: Record<string, string> = {
    owner: 'مالك',
    admin: 'مدير',
    lawyer: 'محامي',
    secretary: 'سكرتارية',
    trainee: 'متدرب'
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#1a2744] text-white/80 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
      <div className={cn("flex h-16 items-center bg-[#1a2744]/90 backdrop-blur-sm sticky top-0 z-10 transition-colors", isCollapsed ? "justify-center" : "justify-between px-6")}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Mizan Logo" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
            <span className="font-bold text-xl shrink-0 text-white">ميزان</span>
          </Link>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className={cn("text-white/60 hover:text-white transition-colors shrink-0", isCollapsed ? "p-2 hover:bg-[#243356] rounded-lg" : "")}
          title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 py-6 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-[#243356]">
        <nav className="flex flex-col gap-1.5 px-3">
          {topRoutes.map((route) => {
            const isActive = pathname === route.href || (pathname.startsWith(`${route.href}/`) && route.href !== '/dashboard')
            return (
              <Link
                key={route.href}
                href={route.href}
                title={isCollapsed ? route.label : undefined}
                className={cn(
                  "flex items-center rounded-xl py-3 transition-all duration-200 group",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-4 text-sm",
                  isActive 
                    ? "bg-[#243356] text-white border-l-2 border-[#c9a84c] rounded-none rounded-r-xl font-medium" 
                    : "text-white/80 hover:bg-[#243356]/50 hover:text-white"
                )}
              >
                <route.icon className={cn(
                  "shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isCollapsed ? "h-6 w-6" : "h-5 w-5",
                  isActive ? "text-white" : "text-white/60 group-hover:text-white"
                )} />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </Link>
            )
          })}
        </nav>

        <nav className="flex flex-col gap-1.5 px-3 mt-auto pt-6">
          {bottomRoutes.map((route) => {
            const isActive = pathname === route.href || (pathname.startsWith(`${route.href}/`) && route.href !== '/dashboard')
            return (
              <Link
                key={route.href}
                href={route.href}
                title={isCollapsed ? route.label : undefined}
                className={cn(
                  "flex items-center rounded-xl py-3 transition-all duration-200 group",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-4 text-sm",
                  isActive 
                    ? "bg-[#243356] text-white border-l-2 border-[#c9a84c] rounded-none rounded-r-xl font-medium" 
                    : "text-white/80 hover:bg-[#243356]/50 hover:text-white"
                )}
              >
                <route.icon className={cn(
                  "shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isCollapsed ? "h-6 w-6" : "h-5 w-5",
                  isActive ? "text-white" : "text-white/60 group-hover:text-white"
                )} />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </Link>
            )
          })}
          
          <div className={cn("mb-4 mt-2", isCollapsed ? "mx-auto" : "mx-3")}>
            <div className={cn("bg-[#243356] rounded-xl flex items-center cursor-pointer hover:bg-[#2d3f6b] transition-colors", isCollapsed ? "p-2 justify-center" : "p-4 gap-3")}>
              <div className="bg-[#c9a84c]/20 rounded-lg p-2 shrink-0">
                <HelpCircle size={18} className="text-[#c9a84c]" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-white text-sm font-medium truncate">الدعم الفني</p>
                  <p className="text-white/50 text-xs truncate">تواصل معنا</p>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
