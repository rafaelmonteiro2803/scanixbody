/**
 * SCANIX BODY - Server-side Supabase client
 *
 * Creates a per-request Supabase client that reads/writes auth cookies through
 * Next.js 14's `next/headers` API.  Must only be called in:
 *   - Server Components
 *   - Server Actions  (`'use server'` files)
 *   - Route Handlers  (app/api/route.ts)
 *
 * For middleware use `@/lib/supabase/middleware` instead.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a server-side Supabase client bound to the current request's cookie
 * store.  Call once per request – do **not** hoist to module-level.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // `setAll` is called from a Server Component where cookies cannot
            // be mutated.  Ignored because the middleware handles refresh.
          }
        },
      },
    },
  )
}

// ---------------------------------------------------------------------------
// Service-role client (admin operations only – never expose to the browser)
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase client that bypasses Row Level Security.
 * Only use inside trusted server-side code (admin service, seed scripts, etc.).
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      '[SCANIX BODY] Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Same as above – ignored in Server Components.
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
