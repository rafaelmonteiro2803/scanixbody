/**
 * GET  /api/v1/cardio/sessions  – list recent cardio sessions (last 60 days)
 * POST /api/v1/cardio/sessions  – log a new cardio session
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
  parseBody,
  validateParams,
  formatZodError,
} from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext } from '@/lib/api-helpers'
import type { CardioSessionsRow } from '@/types/database.types'

const createSessionSchema = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  type: z.string().max(100).optional().nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(1)
    .max(600)
    .optional()
    .nullable(),
  intensity: z.enum(['low', 'moderate', 'high']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

// ---------------------------------------------------------------------------
// GET /api/v1/cardio/sessions
// ---------------------------------------------------------------------------

export const GET = withAuth(async (_request: NextRequest, ctx: AuthContext) => {
  const supabase = await createClient()

  try {
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const { data, error } = await supabase
      .from('cardio_sessions')
      .select('*')
      .eq('user_id', ctx.userId)
      .is('deleted_at', null)
      .gte('session_date', since.toISOString().split('T')[0])
      .order('session_date', { ascending: false })
      .limit(100)

    if (error) throw error

    return createApiResponse({ sessions: data ?? [] })
  } catch (err) {
    console.error('[GET /cardio/sessions]', err)
    return createErrorResponse(
      err instanceof Error ? err.message : 'Erro ao buscar sessões',
      500,
    )
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/cardio/sessions
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) return createErrorResponse(parseError, 400)

  const { data: input, error: validationError } = validateParams(createSessionSchema, body)
  if (validationError) {
    return createErrorResponse('Dados inválidos', 400, 'VALIDATION_ERROR', formatZodError(validationError))
  }

  const supabase = await createClient()

  try {
    const { data: created, error: insertError } = await supabase
      .from('cardio_sessions')
      .insert({
        user_id: ctx.userId,
        session_date: input!.sessionDate,
        type: input!.type ?? null,
        duration_minutes: input!.durationMinutes ?? null,
        intensity: input!.intensity ?? null,
        notes: input!.notes ?? null,
      })
      .select()
      .single()

    if (insertError || !created) {
      throw new Error(insertError?.message ?? 'Falha ao registrar sessão')
    }

    return createApiResponse(created as CardioSessionsRow, 201)
  } catch (err) {
    console.error('[POST /cardio/sessions]', err)
    return createErrorResponse(
      err instanceof Error ? err.message : 'Erro ao registrar sessão',
      500,
    )
  }
})
