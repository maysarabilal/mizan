'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/actions'

export async function getNotifications(limit = 50) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, office_id, type, title, body, is_read, related_entity_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching notifications:', error)
    return { data: null, error: 'فشل جلب الإشعارات' }
  }

  return { data, error: null }
}

export async function getUnreadCount() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: 0, error: null }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { data: count || 0, error: error ? 'Error fetching count' : null }
}

export async function markAsReadAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { data: null, error: 'فشل تحديد الإشعار كمقروء' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notifications')
  return { data: null, error: null }
}

export async function markAllAsReadAction(): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { data: null, error: 'فشل تحديث الإشعارات' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notifications')
  return { data: null, error: null }
}

export async function savePushSubscription(subscription: any): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  // Get current office
  const { data: officeData } = await supabase.rpc('current_office_id').single()
  const office_id = officeData || null

  if (!office_id) return { data: null, error: 'Office not found' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      office_id: office_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }, { onConflict: 'user_id, endpoint' })

  if (error) {
    console.error('Error saving push subscription:', error)
    return { data: null, error: 'فشل حفظ إعدادات الإشعارات' }
  }

  return { data: null, error: null }
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('Error removing push subscription:', error)
    return { data: null, error: 'فشل إزالة إعدادات الإشعارات' }
  }

  return { data: null, error: null }
}
