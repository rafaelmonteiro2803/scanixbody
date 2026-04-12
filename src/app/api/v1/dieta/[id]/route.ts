/**
 * PUT    /api/v1/dieta/:id  – update a meal entry
 * DELETE /api/v1/dieta/:id  – soft-delete a meal entry
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
import { updateMealSchema } from '@/validators/dieta.validator'
import dietaService from '@/services/dieta.service'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// PUT /api/v1/dieta/:id
// ---------------------------------------------------------------------------

export const PUT = withAuth(
  async (request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID da refeição é obrigatório', 400)
    }

    // Verify ownership
    const supabase = await createClient()
    const { data: meal, error: fetchError } = await supabase
      .from('meals')
      .select('user_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !meal) {
      return createErrorResponse('Refeição não encontrada', 404)
    }

    if (meal.user_id !== ctx.userId) {
      return createErrorResponse('Acesso negado', 403)
    }

    const { data: body, error: parseError } = await parseBody(request)
    if (parseError) {
      return createErrorResponse(parseError, 400)
    }

    const { data: input, error: validationError } = validateParams(
      updateMealSchema,
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
      const updated = await dietaService.updateMeal(id, {
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

      return createApiResponse(updated)
    } catch (err) {
      console.error('[PUT /dieta/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar refeição'
      return createErrorResponse(message, 500)
    }
  },
)

// ---------------------------------------------------------------------------
// DELETE /api/v1/dieta/:id
// ---------------------------------------------------------------------------

export const DELETE = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID da refeição é obrigatório', 400)
    }

    // Verify ownership
    const supabase = await createClient()
    const { data: meal, error: fetchError } = await supabase
      .from('meals')
      .select('user_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !meal) {
      return createErrorResponse('Refeição não encontrada', 404)
    }

    if (meal.user_id !== ctx.userId) {
      return createErrorResponse('Acesso negado', 403)
    }

    try {
      await dietaService.deleteMeal(id)
      return createApiResponse({ deleted: true })
    } catch (err) {
      console.error('[DELETE /dieta/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir refeição'
      return createErrorResponse(message, 500)
    }
  },
)
