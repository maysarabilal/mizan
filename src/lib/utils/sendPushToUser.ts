import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

// Initialize VAPID once at module level
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

/**
 * Sends a Web Push notification to ALL subscribed devices/browsers for a given user.
 *
 * Architecture: Calls web-push directly (NO internal HTTP fetch).
 * Previous approach used fetch() to /api/push/send which is an anti-pattern in Next.js
 * Server Actions and causes silent failures in development.
 *
 * Rules:
 * - NEVER throws — push is best-effort, failures are logged only.
 * - Should be called WITHOUT await (fire-and-forget) from Server Actions.
 * - Removes expired subscriptions (410/404) automatically.
 */
export async function sendPushToUser(
  userId: string,
  payload: {
    title: string
    body: string
    url?: string
    notificationId?: string
  }
): Promise<void> {
  try {
    // Use admin client — we're reading another user's subscriptions (cross-user read)
    const supabase = createAdminClient()

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) return

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
            { urgency: 'normal' }
          )
        } catch (err: unknown) {
          const pushErr = err as { statusCode?: number }
          // Clean up expired/invalid subscriptions
          if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
            console.log('[sendPushToUser] Removed expired subscription for user:', userId)
          } else {
            console.error('[sendPushToUser] Failed for user:', userId, '— error:', pushErr?.statusCode)
          }
        }
      })
    )
  } catch {
    // Push is best-effort — never break the calling Server Action
    console.error('[sendPushToUser] Outer failure for user:', userId)
  }
}
