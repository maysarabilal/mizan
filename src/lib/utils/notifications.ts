import { createClient } from '@/lib/supabase/server'

/**
 * Notification preference types matching the keys in offices.settings JSONB.
 */
export type NotificationType = 'session_reminders' | 'task_completed' | 'subscription_updates'

/**
 * Checks whether the office has enabled a specific notification type
 * in its settings JSONB column.
 *
 * Defaults to `true` if the key is missing or the settings are unreadable,
 * to avoid silently swallowing notifications due to data gaps.
 *
 * @param officeId - The office UUID
 * @param type - One of the 3 notification preference keys
 * @returns true if the notification should be sent, false if disabled
 */
export async function shouldSendNotification(
  officeId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('offices')
      .select('settings')
      .eq('id', officeId)
      .single()

    if (error || !data?.settings) {
      // Default to true — if we can't read settings, don't suppress
      return true
    }

    const settings = data.settings as Record<string, unknown>
    const value = settings[type]

    // If the key doesn't exist, default to true (send notification)
    if (value === undefined || value === null) return true

    return Boolean(value)
  } catch {
    // On any unexpected error, default to sending the notification
    console.error(`shouldSendNotification error for office ${officeId}, type ${type}`)
    return true
  }
}
