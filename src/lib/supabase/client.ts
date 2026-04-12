/**
 * SCANIX BODY – Browser-side Supabase client
 *
 * Uses @supabase/ssr's createBrowserClient so that auth cookies are handled
 * automatically in Client Components.  The singleton pattern prevents multiple
 * GoTrueClient instances from being created during hot-module-replacement in
 * development or re-renders in production.
 */

import { createBrowserClient } from '@supabase/ssr'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createBrowserClient>
let client: SupabaseClient | undefined

/**
 * Returns (or lazily creates) the browser-side Supabase client.
 *
 * Call this inside Client Components and browser-only utilities.
 * Never call it in Server Components, Server Actions, or middleware –
 * use `@/lib/supabase/server` instead.
 */
export function createClient() {
  if (client) return client

  // Next.js only inlines NEXT_PUBLIC_ vars when accessed via static dot
  // notation at build time. Dynamic bracket notation (process.env[key])
  // resolves to undefined in the browser bundle.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[SCANIX BODY] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}
