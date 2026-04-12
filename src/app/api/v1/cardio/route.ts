/**
 * GET /api/v1/cardio  – fetch the authenticated user's cardio profile
 * PUT /api/v1/cardio  – upsert the cardio profile
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
import type { CardioProfilesRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const cardioIntensityValues = ['low', 'moderate', 'high'] as const

const saveCardioProfileSchema = z.object({
  practices: z.boolean({ required_error: 'practices é obrigatório' }),
  type: z.string().max(100).optional().nullable(),
  intensity: z.enum(cardioIntensityValues).optional().nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'Duração mínima: 1 minuto')
    .max(600, 'Duração máxima: 600 minutos')
    .optional()
    .nullable(),
  frequencyPerWeek: z
    .number()
    .int()
    .min(0)
    .max(14)
    .optional()
    .nullable(),
  timing: z.string().max(100).optional().nullable(),
  goal: z.string().max(200).optional().nullable(),
})

type SaveCardioProfileInput = z.infer<typeof saveCardioProfileSchema>

// ---------------------------------------------------------------------------
// GET /api/v1/cardio
// ---------------------------------------------------------------------------

export const GET = withAuth(async (_request: NextRequest, ctx: AuthContext) => {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('cardio_profiles')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // PGRST116 = no rows found – not an error, just no profile yet
      if (error.code === 'PGRST116') {
        return createApiResponse({ profile: null })
      }
      throw error
    }

    return createApiResponse({ profile: data ?? null })
  } catch (err) {
    console.error('[GET /cardio]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao buscar perfil de cardio'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// PUT /api/v1/cardio
// ---------------------------------------------------------------------------

export const PUT = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    saveCardioProfileSchema,
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

  const supabase = await createClient()

  try {
    // Check whether a cardio profile already exists
    const { data: existing } = await supabase
      .from('cardio_profiles')
      .select('id')
      .eq('user_id', ctx.userId)
      .single()

    let result: CardioProfilesRow

    const profileData = {
      practices: (input as SaveCardioProfileInput).practices,
      type: (input as SaveCardioProfileInput).type ?? null,
      intensity: (input as SaveCardioProfileInput).intensity ?? null,
      duration_minutes: (input as SaveCardioProfileInput).durationMinutes ?? null,
      frequency_per_week: (input as SaveCardioProfileInput).frequencyPerWeek ?? null,
      timing: (input as SaveCardioProfileInput).timing ?? null,
      goal: (input as SaveCardioProfileInput).goal ?? null,
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('cardio_profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(updateError?.message ?? 'Falha ao atualizar perfil de cardio')
      }
      result = updated
    } else {
      const { data: created, error: createError } = await supabase
        .from('cardio_profiles')
        .insert({ user_id: ctx.userId, ...profileData })
        .select()
        .single()

      if (createError || !created) {
        throw new Error(createError?.message ?? 'Falha ao criar perfil de cardio')
      }
      result = created
    }

    return createApiResponse({ profile: result })
  } catch (err) {
    console.error('[PUT /cardio]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao salvar perfil de cardio'
    return createErrorResponse(message, 500)
  }
})
