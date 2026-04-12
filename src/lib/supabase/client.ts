/**
 * SCANIX BODY – Browser-side Supabase client
 *
 * Uses @supabase/ssr's createBrowserClient so that auth cookies are handled
 * automatically in Client Components.  The singleton pattern prevents multiple
 * GoTrueClient instances from being created during hot-module-replacement in
 * development or re-renders in production.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Environment guards
// ---------------------------------------------------------------------------

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[SCANIX BODY] Missing required environment variable: ${key}`,
    )
  }
  return value
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Returns (or lazily creates) the browser-side Supabase client.
 *
 * Call this inside Client Components and browser-only utilities.
 * Never call it in Server Components, Server Actions, or middleware –
 * use `@/lib/supabase/server` instead.
 */
export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )

  return client
}
