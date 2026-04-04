import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Note: This client uses the SERVICE ROLE key and bypasses RLS.
// It must NEVER be exported to or imported by client-side components.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
