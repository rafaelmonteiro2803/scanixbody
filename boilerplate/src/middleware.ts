/**
 * MY APP – Next.js Edge Middleware
 *
 * Responsibilities:
 *   1. Refresh the Supabase session on every request.
 *   2. Protect /(app) routes – redirect to /login when there is no session.
 *   3. Redirect already-authenticated users away from /login.
 *   4. Redirect users whose status is 'first_access' to /primeiro-acesso.
 *   5. Guard /admin routes – only 'super_admin' and 'admin' roles may enter.
 *
 * TODO: Adjust PUBLIC_ROUTES, PROTECTED_PREFIXES, and ADMIN_PREFIXES to
 *       match your application's route structure.
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
  '/recuperar-senha',
  '/redefinir-senha',
  '/primeiro-acesso',
  // TODO: add other public paths (e.g. /register, /pricing, /about)
]

/** Auth-protected route prefixes. */
const PROTECTED_PREFIXES = ['/dashboard', '/products', '/orders', '/admin', '/configuracoes']

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

  let response: NextResponse
  let user: Awaited<ReturnType<typeof updateSession>>['user']

  try {
    ;({ response, user } = await updateSession(request))
  } catch (err) {
    console.error('[middleware] updateSession failed – check env vars:', err)
    return NextResponse.next()
  }

  // Authenticated users hitting /login → redirect to /dashboard.
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Unauthenticated users hitting a protected route → /login.
  if (!user && isProtected(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Additional profile-level checks (role + status).
  if (user && isProtected(pathname)) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // Read-only: cookies already set by updateSession above.
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
        // First-access users must complete onboarding.
        if (
          profile.status === 'first_access' &&
          pathname !== '/primeiro-acesso'
        ) {
          return NextResponse.redirect(
            new URL('/primeiro-acesso', request.url),
          )
        }

        // If the user has already completed first access, redirect away.
        if (
          profile.status !== 'first_access' &&
          pathname === '/primeiro-acesso'
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Non-admin roles trying to reach /admin → /dashboard.
        if (isAdminRoute(pathname) && !ADMIN_ROLES.has(profile.role)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Blocked / inactive users → /login.
        if (profile.status === 'blocked' || profile.status === 'inactive') {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('error', 'account_disabled')
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
      // If the profile query fails, allow the request through.
      // Page-level auth guards will handle it.
    }
  }

  return response
}

// ---------------------------------------------------------------------------
// Matcher – run middleware on all routes except static assets
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
