import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { subscription, payload } = await req.json()

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { urgency: 'normal' }
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    // Subscription expired or invalid
    const err = error as { statusCode?: number }
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      return NextResponse.json({ error: 'subscription_expired', statusCode: err.statusCode }, { status: 410 })
    }
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 })
  }
}
