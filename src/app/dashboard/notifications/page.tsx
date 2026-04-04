import { getNotifications } from '@/lib/actions/notifications'
import { NotificationsList } from '@/components/notifications/NotificationsList'

export default async function NotificationsPage() {
  const { data: notifications } = await getNotifications(100)

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">الإشعارات والتنبيهات</h1>
        <p className="text-muted-foreground text-sm">متابعة التحديثات الهامة حول الجلسات، المهام والعملاء</p>
      </div>

      <NotificationsList initialData={notifications || []} />
    </div>
  )
}
