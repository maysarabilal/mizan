/**
 * Centralized application configuration.
 * Reads from environment variables and provides defaults.
 */

export const CONFIG = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://mizan-app.com',
  ADMIN_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL || 'jaafrehmaysara@gmail.com',
  SUPPORT_EMAIL: 'support@mizan-app.com',
  RESEND_FROM: 'ميزان لدعم المحامين <onboarding@resend.dev>',
} as const
