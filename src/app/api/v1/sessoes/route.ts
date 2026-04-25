/**
 * GET  /api/v1/sessoes  – list the authenticated user's workout sessions (paginated)
 * POST /api/v1/sessoes  – log a new workout session with PR detection
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
import { logSessionSchema } from '@/validators/treinos.validator'
import treinosService from '@/services/treinos.service'
import { detectPR } from '@/domain/workout-calculations'
import type { AuthContext } from '@/lib/api-helpers'
import type { WorkoutSet } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// GET /api/v1/sessoes
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { searchParams } = new URL(request.url)

  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20

  try {
    const sessions = await treinosService.getSessionHistory(ctx.userId, limit)
    return createApiResponse({ sessions, total: sessions.length })
  } catch (err) {
    console.error('[GET /sessoes]', err)
    const message = err instanceof Error ? err.message : 'Erro ao buscar sessões'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/sessoes
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    logSessionSchema,
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
    // ── PR detection ──────────────────────────────────────────────────────
    // For each exercise, check whether any set beats the user's historical best.
    const exercisesWithPR = await Promise.all(
      input!.exercises.map(async (exercise) => {
        // Fetch the previous best for this exercise
        const previousBest = await treinosService.getBestLift(
          ctx.userId,
          exercise.exerciseName,
        )

        const previousBestAsSet: WorkoutSet | null = previousBest
          ? {
              set_number: 1,
              weight: previousBest.weight,
              reps: previousBest.reps,
            }
          : null

        // Mark each set as PR if it beats the previous best
        const setsWithPR: WorkoutSet[] = exercise.sets.map((s) => {
          const currentSet: WorkoutSet = {
            set_number: s.setNumber,
            weight: s.weight ?? 0,
            reps: s.reps ?? 0,
            is_pr: false,
          }
          return {
            ...currentSet,
            is_pr: detectPR(currentSet, previousBestAsSet),
          }
        })

        return {
          exercise_id: exercise.exerciseId,
          exercise_name: exercise.exerciseName,
          order_index: exercise.orderIndex ?? 0,
          sets: setsWithPR,
        }
      }),
    )

    const session = await treinosService.logSession({
      workout_day_id: input!.workoutDayId,
      session_date: input!.sessionDate,
      started_at: input!.startedAt ?? undefined,
      finished_at: input!.finishedAt ?? undefined,
      notes: input!.notes ?? undefined,
      exercises: exercisesWithPR,
    })

    return createApiResponse(session, 201)
  } catch (err) {
    console.error('[POST /sessoes]', err)
    const message = err instanceof Error ? err.message : 'Erro ao registrar sessão'
    return createErrorResponse(message, 500)
  }
})
