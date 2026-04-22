/**
 * GET  /api/v1/products  – list products for the current user
 * POST /api/v1/products  – create a new product
 *
 * TODO: Duplicate this file for each of your domain entities.
 *       Replace "product" / "products" with your entity name.
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
import {
  createProductSchema,
  listProductsQuerySchema,
} from '@/validators/products.validator'
import productsService from '@/services/products.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/products
// ---------------------------------------------------------------------------

export const GET = withAuth(
  async (request: NextRequest, ctx: AuthContext) => {
    const { searchParams } = new URL(request.url)

    const queryInput = {
      status: searchParams.get('status') ?? undefined,
      category_id: searchParams.get('category_id') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      perPage: searchParams.get('perPage') ?? undefined,
    }

    const { data: query, error: queryError } = validateParams(
      listProductsQuerySchema,
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
      const products = await productsService.getProducts(ctx.userId, {
        status: query?.status,
        category_id: query?.category_id,
        search: query?.search,
        page: query?.page,
        perPage: query?.perPage,
      })

      return createApiResponse({ products, total: products.length })
    } catch (err) {
      console.error('[GET /products]', err)
      return createErrorResponse('Failed to fetch products', 500)
    }
  },
)

// ---------------------------------------------------------------------------
// POST /api/v1/products
// ---------------------------------------------------------------------------

export const POST = withAuth(
  async (request: NextRequest, ctx: AuthContext) => {
    const { data: body, error: parseError } = await parseBody(request)
    if (parseError) {
      return createErrorResponse(parseError, 400)
    }

    const { data: input, error: validationError } = validateParams(
      createProductSchema,
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
      const product = await productsService.createProduct(ctx.userId, input!)
      return createApiResponse(product, 201)
    } catch (err) {
      console.error('[POST /products]', err)
      return createErrorResponse('Failed to create product', 500)
    }
  },
)
