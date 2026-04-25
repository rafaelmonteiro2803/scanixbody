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
  id: z.string().uuid().optional().nullable(),  // if provided, update existing row
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
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return createApiResponse({ profiles: data ?? [] })
  } catch (err) {
    console.error('[GET /cardio]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao buscar perfis de cardio'
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
  const typedInput = input as SaveCardioProfileInput

  try {
    const profileData = {
      practices: typedInput.practices,
      type: typedInput.type ?? null,
      intensity: typedInput.intensity ?? null,
      duration_minutes: typedInput.durationMinutes ?? null,
      frequency_per_week: typedInput.frequencyPerWeek ?? null,
      timing: typedInput.timing ?? null,
      goal: typedInput.goal ?? null,
      is_active: true,
    }

    let result: CardioProfilesRow

    if (typedInput.id) {
      // Update existing profile
      const { data: updated, error: updateError } = await supabase
        .from('cardio_profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', typedInput.id)
        .eq('user_id', ctx.userId)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(updateError?.message ?? 'Falha ao atualizar perfil de cardio')
      }
      result = updated
    } else {
      // Create new profile
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

// ---------------------------------------------------------------------------
// DELETE /api/v1/cardio?id=<profile-id>  – deactivate a profile
// ---------------------------------------------------------------------------

export const DELETE = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return createErrorResponse('id é obrigatório', 400)

  const supabase = await createClient()
  const { error } = await supabase
    .from('cardio_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId)

  if (error) return createErrorResponse(error.message, 500)
  return createApiResponse({ success: true })
})
