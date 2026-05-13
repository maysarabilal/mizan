import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/utils/sendPushToUser'

/**
 * GET /api/push/test?userId=xxx
 *
 * Sends a test push notification to all subscriptions of the given user.
 * ⚠️ DEV ONLY — blocked in production. DELETE THIS FILE after testing.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
  }

  await sendPushToUser(userId, {
    title: '🧪 اختبار الإشعارات — ميزان',
    body: 'إذا ظهر هذا الإشعار على سطح المكتب فالنظام يعمل بشكل كامل ✅',
    url: '/dashboard',
  })

  return NextResponse.json({ success: true, message: `Push sent to user ${userId}` })
}
