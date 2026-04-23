/**
 * Supabase server clients.
 *
 * Use `createClient()` in Server Components, Route Handlers, and Server Actions.
 * Use `createAdminClient()` only in trusted server-side code that needs to
 * bypass Row Level Security (e.g. admin operations, background jobs).
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Standard server client (RLS is enforced)
// ---------------------------------------------------------------------------

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Ignore if called from a Server Component (read-only).
          }
        },
      },
    },
  )
}

// ---------------------------------------------------------------------------
// Admin client (bypasses RLS — server-side only)
// ---------------------------------------------------------------------------

export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Ignore if called from a Server Component.
          }
        },
      },
    },
  )
}
