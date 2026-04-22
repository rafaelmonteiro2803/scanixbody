/**
 * MY APP – API Route Helpers
 *
 * Shared utilities for Next.js 14 App Router Route Handlers:
 *   - withAuth          – wraps a handler with Supabase session check
 *   - withRole          – wraps a handler with role-based access check
 *   - createApiResponse – builds a standard ApiResponse<T> NextResponse
 *   - createErrorResponse – builds a structured error NextResponse
 *   - parseBody         – safely parses + validates the request JSON body
 *   - validateParams    – validates arbitrary data with a Zod schema
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ApiResponse, ApiError } from '@/types/domain.types'
import type { UserRole } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** The augmented request context available inside protected handlers */
export interface AuthContext {
  userId: string
  email: string
  role: UserRole
}

/** Handler signature used with withAuth / withRole */
export type AuthedHandler = (
  request: NextRequest,
  context: AuthContext,
  routeContext?: { params: Record<string, string> },
) => Promise<NextResponse>

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

/**
 * Creates a standard JSON `ApiResponse<T>` NextResponse.
 *
 * @param data   - The response payload.
 * @param status - HTTP status code (default 200).
 */
export function createApiResponse<T>(
  data: T,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data, error: null, status } satisfies ApiResponse<T>,
    { status },
  )
}

/**
 * Creates a structured error `ApiResponse` NextResponse.
 *
 * @param message - Human-readable error message.
 * @param status  - HTTP status code.
 * @param code    - Machine-readable error code (defaults to derived string).
 * @param details - Optional extra detail object.
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: Record<string, unknown>,
): NextResponse<ApiResponse<null>> {
  const defaultCode = codeFromStatus(status)
  const error: ApiError = {
    code: code ?? defaultCode,
    message,
    ...(details ? { details } : {}),
  }

  return NextResponse.json(
    { data: null, error, status } satisfies ApiResponse<null>,
    { status },
  )
}

function codeFromStatus(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
  }
  return map[status] ?? 'ERROR'
}

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

/**
 * Safely parses the request body as JSON.
 *
 * Returns `{ data, error }`.  When parsing fails the error message is
 * human-readable; `data` is `null` in that case.
 */
export async function parseBody<T = unknown>(
  request: NextRequest,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const text = await request.text()
    if (!text || text.trim() === '') {
      return { data: null, error: 'Request body is empty' }
    }
    const parsed = JSON.parse(text) as T
    return { data: parsed, error: null }
  } catch {
    return { data: null, error: 'Request body is not valid JSON' }
  }
}

// ---------------------------------------------------------------------------
// Zod validation
// ---------------------------------------------------------------------------

/**
 * Validates `data` against a Zod schema and returns the typed result.
 */
export function validateParams<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
): { data: z.infer<TSchema> | null; error: z.ZodError | null } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return { data: null, error: result.error }
  }
  return { data: result.data as z.infer<TSchema>, error: null }
}

/**
 * Formats a ZodError into a client-friendly details object.
 */
export function formatZodError(
  err: z.ZodError,
): Record<string, string[]> {
  const flattened = err.flatten()
  return {
    ...flattened.fieldErrors,
    ...(flattened.formErrors.length > 0
      ? { _form: flattened.formErrors }
      : {}),
  } as Record<string, string[]>
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function getAuthContext(
  _request: NextRequest,
): Promise<{ context: AuthContext | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { context: null, error: 'Unauthenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return { context: null, error: 'Profile not found' }
    }

    return {
      context: {
        userId: user.id,
        email: user.email ?? '',
        role: profile.role,
      },
      error: null,
    }
  } catch (err) {
    console.error('[api-helpers] getAuthContext error:', err)
    return { context: null, error: 'Internal authentication error' }
  }
}

// ---------------------------------------------------------------------------
// withAuth HOC
// ---------------------------------------------------------------------------

/**
 * Wraps a Route Handler with Supabase session authentication.
 *
 * If the session is missing or invalid the handler is short-circuited with a
 * 401 response.  Otherwise `handler` is called with the augmented
 * `AuthContext`.
 *
 * @example
 * export const GET = withAuth(async (request, ctx) => {
 *   return createApiResponse({ userId: ctx.userId })
 * })
 */
export function withAuth(handler: AuthedHandler) {
  return async (
    request: NextRequest,
    routeContext?: { params: Record<string, string> },
  ): Promise<NextResponse> => {
    const { context, error } = await getAuthContext(request)

    if (!context) {
      return createErrorResponse(error ?? 'Unauthenticated', 401)
    }

    try {
      return await handler(request, context, routeContext)
    } catch (err) {
      console.error('[withAuth] Unhandled handler error:', err)
      const message =
        err instanceof Error ? err.message : 'Internal server error'
      return createErrorResponse(message, 500)
    }
  }
}

// ---------------------------------------------------------------------------
// withRole HOC
// ---------------------------------------------------------------------------

/**
 * Wraps a Route Handler with authentication AND role-based access control.
 *
 * Responds with 401 when unauthenticated, 403 when the user's role is not in
 * the `allowedRoles` list.
 *
 * @example
 * export const GET = withRole(['super_admin', 'admin'], async (req, ctx) => {
 *   return createApiResponse({ users: [] })
 * })
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: AuthedHandler,
) {
  return async (
    request: NextRequest,
    routeContext?: { params: Record<string, string> },
  ): Promise<NextResponse> => {
    const { context, error } = await getAuthContext(request)

    if (!context) {
      return createErrorResponse(error ?? 'Unauthenticated', 401)
    }

    if (!allowedRoles.includes(context.role)) {
      return createErrorResponse(
        'Access denied. Insufficient permissions.',
        403,
        'FORBIDDEN',
      )
    }

    try {
      return await handler(request, context, routeContext)
    } catch (err) {
      console.error('[withRole] Unhandled handler error:', err)
      const message =
        err instanceof Error ? err.message : 'Internal server error'
      return createErrorResponse(message, 500)
    }
  }
}
