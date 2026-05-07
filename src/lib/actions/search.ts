'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

export type SearchResult = {
  type: 'case' | 'client' | 'session' | 'task'
  id: string
  title: string
  subtitle: string | null
}

export async function globalSearchAction(query: string): Promise<ActionResult<SearchResult[]>> {
  if (!query || query.trim().length < 2) {
    return { data: [], error: null }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'يجب تسجيل الدخول' }

  const { data, error } = await supabase.rpc('global_search', {
    search_query: query.trim()
  })

  if (error) {
    console.error('Global search error:', error)
    return { data: null, error: 'فشل في البحث' }
  }

  return { data: (data as SearchResult[]) ?? [], error: null }
}
