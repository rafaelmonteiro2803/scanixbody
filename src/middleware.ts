/**
 * SCANIX BODY – Next.js Edge Middleware
 *
 * Responsibilities:
 *   1. Refresh the Supabase session on every request.
 *   2. Protect /dashboard and all /(app) routes – redirect to /login when
 *      there is no active session.
 *   3. Redirect already-authenticated users away from /login.
 *   4. Redirect users whose status is 'first_access' to /primeiro-acesso
 *      (unless they are already on that route or on public routes).
 *   5. Guard /admin routes – only 'super_admin' and 'admin' roles may enter.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// ---------------------------------------------------------------------------
// Route classification helpers
// ---------------------------------------------------------------------------

/** Routes that are always publicly accessible (no auth check). */
const PUBLIC_ROUTES = [
  '/login',
  '/cadastro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/primeiro-acesso',
  // Static / Next.js internals are excluded by the matcher below.
]

/** Auth-protected route prefixes. */
const PROTECTED_PREFIXES = ['/dashboard', '/app', '/admin']

/** Admin-only route prefixes (subset of PROTECTED_PREFIXES). */
const ADMIN_PREFIXES = ['/admin']

/** Roles that may access /admin routes. */
const ADMIN_ROLES = new Set(['super_admin', 'admin'])

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Refresh the session and obtain the validated user.
  //    Guard against missing env vars or network errors during cold starts.
  let response: NextResponse
  let user: Awaited<ReturnType<typeof updateSession>>['user']

  try {
    ;({ response, user } = await updateSession(request))
  } catch (err) {
    console.error('[middleware] updateSession failed – check env vars:', err)
    return NextResponse.next()
  }

  // 2. Authenticated users hitting /login → redirect to /dashboard.
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Unauthenticated users hitting a protected route → /login.
  if (!user && isProtected(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 4 & 5. Additional checks that need the full profile (role + status).
  //        Only run when the user is logged in and the route is relevant.
  if (user && isProtected(pathname)) {
    try {
      // Re-use the same Supabase URL / key from env (middleware context has no
      // cookies() helper, so we build a minimal client directly).
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // Read-only here – the response cookies were already set by
              // updateSession above.
            },
          },
        },
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        // 4. First-access users must complete onboarding.
        if (
          profile.status === 'first_access' &&
          pathname !== '/primeiro-acesso'
        ) {
          return NextResponse.redirect(
            new URL('/primeiro-acesso', request.url),
          )
        }

        // If the user has already completed first access but is hitting
        // /primeiro-acesso, send them to the dashboard.
        if (
          profile.status !== 'first_access' &&
          pathname === '/primeiro-acesso'
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // 5. Non-admin roles trying to reach /admin → /dashboard.
        if (isAdminRoute(pathname) && !ADMIN_ROLES.has(profile.role)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Blocked / inactive users → /login.
        if (
          profile.status === 'blocked' ||
          profile.status === 'inactive'
        ) {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('error', 'account_disabled')
          // Clear the session so the user is truly logged out.
          const redirectResponse = NextResponse.redirect(loginUrl)
          response.cookies.getAll().forEach((cookie) => {
            if (cookie.name.startsWith('sb-')) {
              redirectResponse.cookies.delete(cookie.name)
            }
          })
          return redirectResponse
        }
      }
    } catch {
      // If the profile query fails (network, cold start, etc.) allow the
      // request through rather than locking everyone out.  The page-level
      // auth guards will handle it.
    }
  }

  return response
}

// ---------------------------------------------------------------------------
// Matcher – run middleware on all routes except static assets and API routes
// that do not need session context.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico, sitemap.xml, robots.txt
     *   - Public image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
