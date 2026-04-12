/**
 * GET  /api/v1/treinos  – list the authenticated user's workout days (with exercises)
 * POST /api/v1/treinos  – create a new workout day
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
import { createWorkoutDaySchema } from '@/validators/treinos.validator'
import treinosService from '@/services/treinos.service'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/treinos
// ---------------------------------------------------------------------------

export const GET = withAuth(async (_request: NextRequest, ctx: AuthContext) => {
  try {
    // Fetch workout days
    const days = await treinosService.getWorkoutDays(ctx.userId)

    // Attach exercises to each day
    const supabase = await createClient()
    const dayIds = days.map((d) => d.id)

    let exercisesByDay: Record<string, ReturnType<typeof Array.prototype.filter>> = {}

    if (dayIds.length > 0) {
      const { data: exercises, error: exError } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_day_id', dayIds)
        .is('deleted_at', null)
        .order('order_index', { ascending: true })

      if (exError) {
        console.error('[GET /treinos] exercises fetch error:', exError.message)
      } else {
        exercisesByDay = (exercises ?? []).reduce<
          Record<string, typeof exercises>
        >((acc, ex) => {
          if (!acc[ex.workout_day_id]) acc[ex.workout_day_id] = []
          acc[ex.workout_day_id]!.push(ex)
          return acc
        }, {})
      }
    }

    const result = days.map((day) => ({
      ...day,
      exercises: (exercisesByDay[day.id] as unknown[]) ?? [],
    }))

    return createApiResponse(result)
  } catch (err) {
    console.error('[GET /treinos]', err)
    const message = err instanceof Error ? err.message : 'Erro ao buscar treinos'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/treinos
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    createWorkoutDaySchema,
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
    const created = await treinosService.createWorkoutDay(ctx.userId, {
      name: input!.name,
      muscle_groups: input!.muscleGroups,
      order_index: input!.orderIndex,
    })

    return createApiResponse(created, 201)
  } catch (err) {
    console.error('[POST /treinos]', err)
    const message = err instanceof Error ? err.message : 'Erro ao criar treino'
    return createErrorResponse(message, 500)
  }
})
