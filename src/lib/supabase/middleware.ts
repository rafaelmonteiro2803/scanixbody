/**
 * SCANIX BODY – Middleware Supabase helper
 *
 * Provides `updateSession` which:
 *   1. Creates a temporary Supabase client that can read and write cookies on
 *      the NextResponse object (required by @supabase/ssr in middleware).
 *   2. Calls `getUser()` so the JWT is validated and the session token is
 *      silently refreshed when it is about to expire.
 *
 * Import and call this from `src/middleware.ts`.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
// updateSession
// ---------------------------------------------------------------------------

/**
 * Refreshes the Supabase session cookie (if needed) and returns an augmented
 * NextResponse together with the validated user object.
 *
 * @returns `{ response, user }` – always return `response` from middleware to
 *          propagate the updated Set-Cookie headers.
 */
export async function updateSession(request: NextRequest) {
  // Start with a pass-through response; headers are added below as needed.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write new cookie values onto both the request and the response so
          // that subsequent Server Components see the refreshed tokens.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not run any logic between createServerClient() and
  // getUser().  A middleware bug where getUser() is skipped causes the session
  // to go stale and users are logged out unexpectedly.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
