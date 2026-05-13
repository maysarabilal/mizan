'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Briefcase, Calendar, Users, Menu,
  UserPlus, ScrollText, DollarSign, CreditCard, Settings, HelpCircle 
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

export function MobileBottomNav() {
  const pathname = usePathname()

  const bottomNavItems = [
    { label: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard', activePath: '/dashboard', exact: true },
    { label: 'القضايا', icon: Briefcase, href: '/dashboard/cases', activePath: '/dashboard/cases' },
    { label: 'الجلسات', icon: Calendar, href: '/dashboard/sessions', activePath: '/dashboard/sessions' },
    { label: 'العملاء', icon: Users, href: '/dashboard/clients', activePath: '/dashboard/clients' },
  ]

  const menuItems = [
    { label: 'الفريق', icon: UserPlus, href: '/dashboard/team' },
    { label: 'سجلات الرقابة', icon: ScrollText, href: '/dashboard/logs' },
    { label: 'التقرير المالي', icon: DollarSign, href: '/dashboard/finances' },
    { label: 'الاشتراك والباقات', icon: CreditCard, href: '/dashboard/subscription' },
    { label: 'الإعدادات', icon: Settings, href: '/dashboard/settings' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-black/[0.08] flex items-center z-50 px-2 safe-area-pb">
      {bottomNavItems.map(item => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.activePath)
        return (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 transition-colors h-full rounded-lg">
            <item.icon className={`w-5 h-5 ${isActive ? 'text-[#1A2744]' : 'text-[#9AA3B2]'}`} />
            <span className={`text-[10px] font-medium ${isActive ? 'text-[#1A2744]' : 'text-[#9AA3B2]'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}

      <Sheet>
        <SheetTrigger className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 transition-colors h-full rounded-lg">
          <Menu className="w-5 h-5 text-[#9AA3B2]" />
          <span className="text-[10px] font-medium text-[#9AA3B2]">القائمة</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 min-h-[40vh] border-t-0" dir="rtl">
          <SheetTitle className="sr-only">القائمة الإضافية</SheetTitle>
          <div className="flex flex-col p-4">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            
            <div className="flex flex-col gap-2">
              {menuItems.map(item => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[#F0E9D6] text-[#1A2744]' : 'hover:bg-slate-50 text-[#0F1724]'}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[#1A2744]' : 'text-[#9AA3B2]'}`} />
                    <span className="text-[14px] font-semibold">{item.label}</span>
                  </Link>
                )
              })}

              <div className="h-px bg-slate-100 my-2" />

              <div className="bg-[#243356] rounded-xl flex items-center p-4 gap-3 cursor-pointer hover:bg-[#2d3f6b] transition-colors mt-2">
                <div className="bg-[#c9a84c]/20 rounded-lg p-2 shrink-0">
                  <HelpCircle size={18} className="text-[#c9a84c]" />
                </div>
                <div className="truncate">
                  <p className="text-white text-sm font-medium truncate">الدعم الفني</p>
                  <p className="text-white/50 text-xs truncate">تواصل معنا</p>
                </div>
              </div>

            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
