// Service Worker for Push Notifications — Mizan App

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'ميزان', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    dir: 'rtl',
    lang: 'ar',
    data: {
      url: data.url || '/dashboard',
      notificationId: data.notificationId || null,
    },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'ميزان', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app already open — focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
