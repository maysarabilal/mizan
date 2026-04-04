import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from './_components/AdminSidebar'
import { MobileNav } from './_components/MobileNav'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Strict admin check — this is the ONLY gate
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-[100dvh] w-full bg-zinc-950 font-sans" dir="rtl">
      {/* Admin Sidebar (always visible on desktop) */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen">
        <AdminSidebar />
      </aside>

      <div className="flex flex-col flex-1 w-full min-w-0">
        {/* Minimal admin topbar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-800 px-4 md:px-6 bg-zinc-900/50">
          <MobileNav />
          <div className="text-sm text-zinc-400 ms-auto md:ms-0">
            لوحة تحكم المنصة — <span className="text-amber-400 font-medium">وضع الإدارة</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  )
}
