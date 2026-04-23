'use client'

/**
 * Supabase browser client.
 *
 * Use this client from Client Components (files with `'use client'`).
 * For Server Components and Route Handlers use `@/lib/supabase/server`.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
