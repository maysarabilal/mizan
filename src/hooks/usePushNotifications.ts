'use client'

import { useState, useEffect } from 'react'
import { savePushSubscription, removePushSubscription } from '@/lib/actions/notifications'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export type PushStatus = 'unsupported' | 'denied' | 'granted' | 'default' | 'loading'

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    setStatus(Notification.permission as PushStatus)

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [])

  const registerSW = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      return reg
    } catch (err) {
      console.error('SW registration failed:', err)
      return null
    }
  }

  const subscribe = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return false
      }
      setStatus('granted')

      const reg = await registerSW()
      if (!reg) return false

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
      })

      const subJSON = subscription.toJSON()
      const result = await savePushSubscription(subJSON)

      if (!result.error) {
        setIsSubscribed(true)
        return true
      }
      return false
    } catch (err) {
      console.error('Push subscribe error:', err)
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await removePushSubscription(subscription.endpoint)
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('Push unsubscribe error:', err)
      return false
    }
  }

  return { status, isSubscribed, subscribe, unsubscribe }
}
