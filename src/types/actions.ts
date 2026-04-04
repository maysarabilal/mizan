/**
 * Standard return type for all server actions.
 * Every action file imports this instead of redeclaring locally.
 */
export type ActionResult<T = null> = { data: T | null; error: string | null }
