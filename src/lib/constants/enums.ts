/**
 * Centralized constants for task status and priority mappings.
 * These maps ensure type safety and prevent hardcoded Arabic strings throughout the codebase.
 */

// ============================================================================
// TASK STATUS MAPPINGS
// ============================================================================

/** Application-level status values (English, used in forms and UI logic) */
export const APP_STATUS_VALUES = ['todo', 'in_progress', 'done'] as const

/** Database-level status values (Arabic, stored in Supabase) */
export const DB_STATUS_VALUES = ['معلقة', 'قيد التنفيذ', 'مكتملة'] as const

/** Maps application status to database status */
export const STATUS_TO_DB = {
  todo: 'معلقة',
  in_progress: 'قيد التنفيذ',
  done: 'مكتملة',
} as const

/** Maps database status back to application status */
export const DB_TO_STATUS = {
  'معلقة': 'todo',
  'قيد التنفيذ': 'in_progress',
  'مكتملة': 'done',
} as const

/** Display labels for each status (Arabic) */
export const STATUS_LABELS = {
  todo: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  done: 'مكتملة',
} as const

// ============================================================================
// TASK PRIORITY MAPPINGS
// ============================================================================

/** Application-level priority values (English, used in forms and UI logic) */
export const APP_PRIORITY_VALUES = ['low', 'medium', 'high'] as const

/** Database-level priority values (Arabic, stored in Supabase) */
export const DB_PRIORITY_VALUES = ['منخفضة', 'متوسطة', 'عالية'] as const

/** Maps application priority to database priority */
export const PRIORITY_TO_DB = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
} as const

/** Maps database priority back to application priority */
export const DB_TO_PRIORITY = {
  'منخفضة': 'low',
  'متوسطة': 'medium',
  'عالية': 'high',
} as const

/** Display labels for each priority (Arabic) */
export const PRIORITY_LABELS = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
} as const

// ============================================================================
// TYPES DERIVED FROM CONSTANTS
// ============================================================================

/** Type for application-level status (union of string literals) */
export type AppStatus = typeof APP_STATUS_VALUES[number]

/** Type for database-level status (union of string literals) */
export type DbStatus = typeof DB_STATUS_VALUES[number]

/** Type for application-level priority (union of string literals) */
export type AppPriority = typeof APP_PRIORITY_VALUES[number]

/** Type for database-level priority (union of string literals) */
export type DbPriority = typeof DB_PRIORITY_VALUES[number]

// ============================================================================
// SUBSCRIPTION PLAN SLUGS
// ============================================================================

/** Subscription plan slugs for stable database queries */
export const PLAN_SLUGS = {
  INDIVIDUAL:          'individual',
  OFFICE:              'office',
  INSTITUTION:         'institution',
  INDIVIDUAL_YEARLY:   'individual_yearly',
  OFFICE_YEARLY:       'office_yearly',
  INSTITUTION_YEARLY:  'institution_yearly',
  ENTERPRISE:          'enterprise',
} as const

/** Type for plan slugs */
export type PlanSlug = typeof PLAN_SLUGS[keyof typeof PLAN_SLUGS]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts an application status to database status.
 * Falls back to the input if no mapping exists (for safety).
 */
export function toDbStatus(status: string): DbStatus {
  return (STATUS_TO_DB as Record<string, DbStatus>)[status] ?? status as DbStatus
}

/**
 * Converts a database status to application status.
 * Falls back to 'todo' if no mapping exists (for safety).
 */
export function toAppStatus(dbStatus: string): AppStatus {
  return (DB_TO_STATUS as Record<string, AppStatus>)[dbStatus] ?? 'todo'
}

/**
 * Converts an application priority to database priority.
 * Falls back to the input if no mapping exists (for safety).
 */
export function toDbPriority(priority: string): DbPriority {
  return (PRIORITY_TO_DB as Record<string, DbPriority>)[priority] ?? priority as DbPriority
}

/**
 * Converts a database priority to application priority.
 * Falls back to 'medium' if no mapping exists (for safety).
 */
export function toAppPriority(dbPriority: string): AppPriority {
  return (DB_TO_PRIORITY as Record<string, AppPriority>)[dbPriority] ?? 'medium'
}
