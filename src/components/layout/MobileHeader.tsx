'use client'

import Link from 'next/link'
import { Scale, Bell, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { RealtimeChannel } from '@supabase/supabase-js'

export function MobileHeader() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let channelRef: RealtimeChannel | null = null

    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch initial unread count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (count !== null) setUnreadCount(count)

      // Subscribe to changes
      channelRef = supabase
        .channel('notifications-mobile-header')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          async () => {
            const { count: newCount } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('is_read', false)
            if (newCount !== null) setUnreadCount(newCount)
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channelRef) {
        const supabase = createClient()
        supabase.removeChannel(channelRef)
      }
    }
  }, [])

  return (
    <header className="flex md:hidden items-center justify-between px-4 h-[60px] bg-white border-b border-black/[0.08] sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-2">
        <Scale className="w-6 h-6 text-[#C9A84C]" />
        <span className="text-lg font-bold text-[#1A2744]">ميزان</span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/notifications" className="relative w-8 h-8 flex items-center justify-center border border-black/[0.08] rounded-md bg-white">
          <Bell className="w-4 h-4 text-[#9AA3B2]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-white" />
          )}
        </Link>
        <Link href="/dashboard/profile" className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center overflow-hidden shrink-0">
          <User className="h-4 w-4 text-[#c9a84c]" />
        </Link>
      </div>
    </header>
  )
}
