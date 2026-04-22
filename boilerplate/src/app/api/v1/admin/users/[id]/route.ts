/**
 * GET    /api/v1/admin/users/[id]  – get user by ID (admin only)
 * PATCH  /api/v1/admin/users/[id]  – update user profile (admin only)
 * DELETE /api/v1/admin/users/[id]  – block user (admin only)
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
import { updateUserProfileSchema } from '@/validators/admin.validator'
import adminService from '@/services/admin.service'
import type { AuthContext } from '@/lib/api-helpers'

type RouteContext = { params: { id: string } }

// ---------------------------------------------------------------------------
// GET /api/v1/admin/users/[id]
// ---------------------------------------------------------------------------

export const GET = withRole(
  ['super_admin', 'admin'],
  async (_request: NextRequest, _ctx: AuthContext, routeContext?: RouteContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('User ID is required', 400)
    }

    try {
      const user = await adminService.getUserById(id)

      if (!user) {
        return createErrorResponse('User not found', 404)
      }

      return createApiResponse(user)
    } catch (err) {
      console.error('[GET /admin/users/:id]', err)
      return createErrorResponse('Failed to fetch user', 500)
    }
  },
)

// ---------------------------------------------------------------------------
// PATCH /api/v1/admin/users/[id]
// ---------------------------------------------------------------------------

export const PATCH = withRole(
  ['super_admin', 'admin'],
  async (request: NextRequest, _ctx: AuthContext, routeContext?: RouteContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('User ID is required', 400)
    }

    const { data: body, error: parseError } = await parseBody(request)
    if (parseError) {
      return createErrorResponse(parseError, 400)
    }

    const { data: input, error: validationError } = validateParams(
      updateUserProfileSchema,
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
      const profile = await adminService.updateUserProfile(id, {
        full_name: input!.fullName ?? undefined,
        role: input!.role,
        status: input!.status,
        avatar_url: input!.avatarUrl ?? undefined,
      })

      return createApiResponse(profile)
    } catch (err) {
      console.error('[PATCH /admin/users/:id]', err)
      return createErrorResponse('Failed to update user', 500)
    }
  },
)

// ---------------------------------------------------------------------------
// DELETE /api/v1/admin/users/[id]  — blocks the user (soft action)
// ---------------------------------------------------------------------------

export const DELETE = withRole(
  ['super_admin', 'admin'],
  async (_request: NextRequest, _ctx: AuthContext, routeContext?: RouteContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('User ID is required', 400)
    }

    try {
      await adminService.blockUser(id)

      return createApiResponse({ blocked: true })
    } catch (err) {
      console.error('[DELETE /admin/users/:id]', err)
      return createErrorResponse('Failed to block user', 500)
    }
  },
)
