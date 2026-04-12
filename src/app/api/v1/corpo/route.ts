/**
 * GET /api/v1/corpo  – fetch the authenticated athlete's profile + body segments
 * PUT /api/v1/corpo  – upsert the athlete profile (and optional body segments)
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
import { saveAthleteProfileSchema } from '@/validators/corpo.validator'
import corpoService from '@/services/corpo.service'
import type { BodySegment } from '@/services/corpo.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/corpo
// ---------------------------------------------------------------------------

export const GET = withAuth(async (_request: NextRequest, ctx: AuthContext) => {
  try {
    const profile = await corpoService.getAthleteProfile(ctx.userId)
    const segments = profile
      ? await corpoService.getBodySegments(profile.id)
      : []

    return createApiResponse({ profile, segments })
  } catch (err) {
    console.error('[GET /corpo]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao buscar perfil corporal'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// PUT /api/v1/corpo
// ---------------------------------------------------------------------------

export const PUT = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    saveAthleteProfileSchema,
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
    // Extract body segments from the payload (not part of the profile row)
    const { bodySegments, ...profileData } = input!

    // Map camelCase input fields to snake_case DTO
    const profileDTO = {
      weight: profileData.weight ?? undefined,
      height: profileData.height ?? undefined,
      age: profileData.age ?? undefined,
      sex: profileData.sex ?? undefined,
      body_fat_percentage: profileData.bodyFatPercentage ?? undefined,
      fat_mass: profileData.fatMass ?? undefined,
      skeletal_muscle_mass: profileData.skeletalMuscleMass ?? undefined,
      lean_mass: profileData.leanMass ?? undefined,
      body_water: profileData.bodyWater ?? undefined,
      protein_mass: profileData.proteinMass ?? undefined,
      minerals_mass: profileData.mineralsMass ?? undefined,
      bmi: profileData.bmi ?? undefined,
      bmr: profileData.bmr ?? undefined,
      visceral_fat: profileData.visceralFat ?? undefined,
      waist_hip_ratio: profileData.waistHipRatio ?? undefined,
      obesity_grade: profileData.obesityGrade ?? undefined,
      inbody_score: profileData.inbodyScore ?? undefined,
      ideal_weight: profileData.idealWeight ?? undefined,
      goal: profileData.goal ?? undefined,
      activity_level: profileData.activityLevel ?? undefined,
      sleep_hours: profileData.sleepHours ?? undefined,
      sleep_quality: profileData.sleepQuality ?? undefined,
      water_per_day: profileData.waterPerDay ?? undefined,
      tdee: profileData.tdee ?? undefined,
      notes: profileData.notes ?? undefined,
    }

    // Remove undefined keys so we don't accidentally null out existing values
    const cleanedDTO = Object.fromEntries(
      Object.entries(profileDTO).filter(([, v]) => v !== undefined),
    )

    const savedProfile = await corpoService.saveAthleteProfile(
      ctx.userId,
      cleanedDTO,
    )

    // Upsert body segments if provided
    let segments: BodySegment[] = []
    if (bodySegments && bodySegments.length > 0) {
      const segmentInputs = bodySegments.map((s) => ({
        segment: s.segment,
        lean_mass: s.leanMass ?? null,
        fat_mass: s.fatMass ?? null,
      }))
      segments = await corpoService.saveBodySegments(savedProfile.id, segmentInputs)
    } else {
      segments = await corpoService.getBodySegments(savedProfile.id)
    }

    return createApiResponse({ profile: savedProfile, segments })
  } catch (err) {
    console.error('[PUT /corpo]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao salvar perfil corporal'
    return createErrorResponse(message, 500)
  }
})
