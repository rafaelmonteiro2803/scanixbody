/**
 * GET  /api/v1/admin/users  – list all users (admin only, paginated)
 * POST /api/v1/admin/users  – create a new user (admin only)
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import {
  withRole,
  createApiResponse,
  createErrorResponse,
  parseBody,
  validateParams,
  formatZodError,
} from '@/lib/api-helpers'
import {
  createUserSchema,
  listUsersQuerySchema,
} from '@/validators/admin.validator'
import adminService from '@/services/admin.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/admin/users
// ---------------------------------------------------------------------------

export const GET = withRole(
  ['super_admin', 'admin'],
  async (request: NextRequest, _ctx: AuthContext) => {
    const { searchParams } = new URL(request.url)

    const queryInput = {
      role: searchParams.get('role') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      perPage: searchParams.get('perPage') ?? undefined,
    }

    const { data: query, error: queryError } = validateParams(
      listUsersQuerySchema,
      queryInput,
    )
    if (queryError) {
      return createErrorResponse(
        'Invalid query parameters',
        400,
        'VALIDATION_ERROR',
        formatZodError(queryError),
      )
    }

    try {
      const users = await adminService.getUsers({
        role: query?.role,
        status: query?.status,
        search: query?.search,
        page: query?.page,
        perPage: query?.perPage,
      })

      return createApiResponse({ users, total: users.length })
    } catch (err) {
      console.error('[GET /admin/users]', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch users'
      return createErrorResponse(message, 500)
    }
  },
)

// ---------------------------------------------------------------------------
// POST /api/v1/admin/users
// ---------------------------------------------------------------------------

export const POST = withRole(
  ['super_admin', 'admin'],
  async (request: NextRequest, _ctx: AuthContext) => {
    const { data: body, error: parseError } = await parseBody(request)
    if (parseError) {
      return createErrorResponse(parseError, 400)
    }

    const { data: input, error: validationError } = validateParams(
      createUserSchema,
      body,
    )
    if (validationError) {
      return createErrorResponse(
        'Invalid input',
        400,
        'VALIDATION_ERROR',
        formatZodError(validationError),
      )
    }

    try {
      const user = await adminService.createUser({
        email: input!.email,
        full_name: input!.fullName,
        role: input!.role,
        status: input!.status,
        password: input!.password,
      })

      return createApiResponse(user, 201)
    } catch (err) {
      console.error('[POST /admin/users]', err)
      const message = err instanceof Error ? err.message : 'Failed to create user'

      if (message.includes('already been registered') || message.includes('duplicate')) {
        return createErrorResponse('Email already in use', 409, 'EMAIL_ALREADY_EXISTS')
      }

      return createErrorResponse(message, 500)
    }
  },
)
