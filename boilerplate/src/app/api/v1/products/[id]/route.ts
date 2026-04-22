/**
 * GET    /api/v1/products/[id]  – get product by ID
 * PATCH  /api/v1/products/[id]  – update product
 * DELETE /api/v1/products/[id]  – soft-delete product
 *
 * TODO: Duplicate this file for each of your domain entities.
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
  parseBody,
  validateParams,
  formatZodError,
} from '@/lib/api-helpers'
import { updateProductSchema } from '@/validators/products.validator'
import productsService from '@/services/products.service'
import type { AuthContext } from '@/lib/api-helpers'

type RouteContext = { params: { id: string } }

// ---------------------------------------------------------------------------
// GET /api/v1/products/[id]
// ---------------------------------------------------------------------------

export const GET = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext?: RouteContext) => {
    const id = routeContext?.params?.id
    if (!id) return createErrorResponse('Product ID is required', 400)

    try {
      const product = await productsService.getProductById(ctx.userId, id)
      if (!product) return createErrorResponse('Product not found', 404)
      return createApiResponse(product)
    } catch (err) {
      console.error('[GET /products/:id]', err)
      return createErrorResponse('Failed to fetch product', 500)
    }
  },
)

// ---------------------------------------------------------------------------
// PATCH /api/v1/products/[id]
// ---------------------------------------------------------------------------

export const PATCH = withAuth(
  async (request: NextRequest, ctx: AuthContext, routeContext?: RouteContext) => {
    const id = routeContext?.params?.id
    if (!id) return createErrorResponse('Product ID is required', 400)

    const { data: body, error: parseError } = await parseBody(request)
    if (parseError) return createErrorResponse(parseError, 400)

    const { data: input, error: validationError } = validateParams(
      updateProductSchema,
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
      const product = await productsService.updateProduct(ctx.userId, id, input!)
      return createApiResponse(product)
    } catch (err) {
      console.error('[PATCH /products/:id]', err)
      return createErrorResponse('Failed to update product', 500)
    }
  },
)

// ---------------------------------------------------------------------------
// DELETE /api/v1/products/[id]
// ---------------------------------------------------------------------------

export const DELETE = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext?: RouteContext) => {
    const id = routeContext?.params?.id
    if (!id) return createErrorResponse('Product ID is required', 400)

    try {
      await productsService.deleteProduct(ctx.userId, id)
      return createApiResponse({ deleted: true })
    } catch (err) {
      console.error('[DELETE /products/:id]', err)
      return createErrorResponse('Failed to delete product', 500)
    }
  },
)
