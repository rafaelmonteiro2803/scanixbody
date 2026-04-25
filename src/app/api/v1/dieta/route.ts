/**
 * GET  /api/v1/dieta        – list meals (optional ?date=YYYY-MM-DD filter)
 * POST /api/v1/dieta        – create a new meal entry
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
  createMealSchema,
  listMealsQuerySchema,
} from '@/validators/dieta.validator'
import dietaService from '@/services/dieta.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/dieta
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { searchParams } = new URL(request.url)

  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50
  const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0

  const queryInput = {
    date: searchParams.get('date') ?? undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
  }

  const { data: query, error: queryError } = validateParams(
    listMealsQuerySchema,
    queryInput,
  )
  if (queryError) {
    return createErrorResponse(
      'Parâmetros de consulta inválidos',
      400,
      'VALIDATION_ERROR',
      formatZodError(queryError),
    )
  }

  try {
    const { data: meals, total } = await dietaService.getMeals(ctx.userId, {
      date: query?.date,
      limit,
      offset,
    })
    return createApiResponse({ meals, total, limit, offset })
  } catch (err) {
    console.error('[GET /dieta]', err)
    const message = err instanceof Error ? err.message : 'Erro ao buscar refeições'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/dieta
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    createMealSchema,
    body,
  )
  if (validationError) {
    return createErrorResponse(
      'Dados inválidos',
      400,
      'VALIDATION_ERROR',
      formatZodError(validationError),
    )
  }

  try {
    const meal = await dietaService.createMeal(ctx.userId, {
      meal_date: input!.mealDate,
      meal_name: input!.mealName,
      time: input!.time ?? undefined,
      calories: input!.calories ?? undefined,
      protein_g: input!.proteinG ?? undefined,
      carbs_g: input!.carbsG ?? undefined,
      fat_g: input!.fatG ?? undefined,
      items: input!.items ?? undefined,
      source: input!.source,
      notes: input!.notes ?? undefined,
    })

    return createApiResponse(meal, 201)
  } catch (err) {
    console.error('[POST /dieta]', err)
    const message = err instanceof Error ? err.message : 'Erro ao criar refeição'
    return createErrorResponse(message, 500)
  }
})
