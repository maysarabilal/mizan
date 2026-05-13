'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { toast } from 'sonner'
import { Bell, Calendar, CheckSquare, CreditCard, Info, Check, CheckCircle2 } from 'lucide-react'

import { Database } from '@/types/database'
import { markAsReadAction, markAllAsReadAction } from '@/lib/actions/notifications'
import { createClient } from '@/lib/supabase/browser'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

const ICON_MAP: Record<string, React.ElementType> = {
  'session': Calendar,
  'task': CheckSquare,
  'payment': CreditCard,
  'system': Info
}

const COLOR_MAP: Record<string, string> = {
  'session': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'task': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'payment': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  'system': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
}

export function NotificationsList({
  initialData,
  userId,
}: {
  initialData: NotificationRow[]
  userId: string
}) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialData)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Real-time: prepend new notifications instantly without page refresh
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel('notifications-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow
          // Prepend to top — no page refresh needed
          setNotifications((prev) => [newNotification, ...prev])
          // Also show an in-app toast
          toast(newNotification.title, {
            description: newNotification.body,
            duration: 5000,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const displayedNotifications = notifications.filter(n => filter === 'all' ? true : !n.is_read)

  const handleMarkAsRead = async (id: string) => {
    setIsProcessing(true)
    const { error } = await markAsReadAction(id)
    setIsProcessing(false)
    
    if (error) {
      toast.error(error)
      return
    }

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleMarkAll = async () => {
    setIsProcessing(true)
    const { error } = await markAllAsReadAction()
    setIsProcessing(false)
    
    if (error) {
      toast.error(error)
      return
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('تم تحديد الكل كمقروء')
  }

  if (notifications.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
        <Bell className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">لا توجد إشعارات</h3>
        <p className="text-sm text-muted-foreground mt-1">أنت على اطلاع دائم بكل شيء!</p>
      </Card>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border">
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            الكل
          </Button>
          <Button 
            variant={filter === 'unread' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('unread')}
          >
            غير مقروءة {unreadCount > 0 && <Badge variant="secondary" className="ms-2 rounded-full px-1.5 py-0">{unreadCount}</Badge>}
          </Button>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={isProcessing} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <CheckCircle2 className="me-2 h-4 w-4" /> تحديد الكل كمقروء
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            لا توجد إشعارات ضمن هذا الفلتر.
          </div>
        ) : (
          displayedNotifications.map((notification) => {
            const Icon = ICON_MAP[notification.type] || Info
            const colorClass = COLOR_MAP[notification.type] || COLOR_MAP['system']

            return (
              <div 
                key={notification.id} 
                className={`flex gap-4 p-4 rounded-xl border transition-all ${
                  notification.is_read 
                    ? 'bg-white dark:bg-zinc-950 opacity-70' 
                    : 'bg-primary/5 border-primary/20 shadow-sm'
                }`}
              >
                <div className={`mt-1 shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ms-4">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a', { locale: ar })}
                    </span>
                  </div>
                  <p className="text-sm text-balance text-muted-foreground break-words leading-relaxed">
                    {notification.body}
                  </p>
                </div>

                {!notification.is_read && (
                  <div className="shrink-0 flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={isProcessing}
                      title="تحديد كمقروء"
                      className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
