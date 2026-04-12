/**
 * GET  /api/v1/analise-ia  – fetch the most recent AI analysis report + checklist status
 * POST /api/v1/analise-ia  – generate a new AI analysis report
 *
 * POST flow:
 *   1. Fetch all relevant user data (profile, sessions, meals, body, cardio, meds, exams)
 *   2. Calculate all 6 domain scores via domain/ai-scoring.ts
 *   3. Call /api/v1/ai/extract for AI-generated narrative recommendations
 *   4. Save the full report to ai_analysis_reports table
 *   5. Return the saved report
 */

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import {
  calculateTrainingScore,
  calculateDietScore,
  calculateSleepScore,
  calculateHydrationScore,
  calculateCardioScore,
  calculateOverallScore,
} from '@/domain/ai-scoring'
import { readBodyState } from '@/domain/body-calculations'
import type { AuthContext } from '@/lib/api-helpers'
import type { AiAnalysisReportsRow } from '@/types/database.types'
import type { MacroTargets } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// GET /api/v1/analise-ia
// ---------------------------------------------------------------------------

export const GET = withAuth(async (_request: NextRequest, ctx: AuthContext) => {
  const supabase = await createClient()

  try {
    // Fetch most recent report
    const { data: report, error: reportError } = await supabase
      .from('ai_analysis_reports')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (reportError && reportError.code !== 'PGRST116') {
      throw reportError
    }

    // Build checklist status (which modules have data)
    const [profileResult, sessionsResult, mealsResult, cardioResult, medsResult, examsResult] =
      await Promise.all([
        supabase
          .from('athlete_profiles')
          .select('id')
          .eq('user_id', ctx.userId)
          .limit(1)
          .single(),
        supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', ctx.userId)
          .is('deleted_at', null)
          .limit(1)
          .single(),
        supabase
          .from('meals')
          .select('id')
          .eq('user_id', ctx.userId)
          .is('deleted_at', null)
          .limit(1)
          .single(),
        supabase
          .from('cardio_profiles')
          .select('id')
          .eq('user_id', ctx.userId)
          .limit(1)
          .single(),
        supabase
          .from('medication_entries')
          .select('id')
          .eq('user_id', ctx.userId)
          .is('deleted_at', null)
          .limit(1)
          .single(),
        supabase
          .from('exam_reports')
          .select('id')
          .eq('user_id', ctx.userId)
          .is('deleted_at', null)
          .limit(1)
          .single(),
      ])

    const checklistStatus = {
      hasProfile: !!profileResult.data,
      hasSessions: !!sessionsResult.data,
      hasMeals: !!mealsResult.data,
      hasCardio: !!cardioResult.data,
      hasMedications: !!medsResult.data,
      hasExams: !!examsResult.data,
    }

    return createApiResponse({
      report: report ?? null,
      checklistStatus,
    })
  } catch (err) {
    console.error('[GET /analise-ia]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao buscar análise IA'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/analise-ia
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const supabase = await createClient()

  try {
    // ── 1. Fetch all user data in parallel ───────────────────���────────────
    const [
      profileResult,
      sessionsResult,
      workoutDaysResult,
      mealsResult,
      cardioResult,
      medsResult,
      examsResult,
    ] = await Promise.all([
      supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', ctx.userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', ctx.userId)
        .is('deleted_at', null)
        .order('session_date', { ascending: false })
        .limit(60),
      supabase
        .from('workout_days')
        .select('*')
        .eq('user_id', ctx.userId)
        .is('deleted_at', null),
      supabase
        .from('meals')
        .select('*')
        .eq('user_id', ctx.userId)
        .is('deleted_at', null)
        .order('meal_date', { ascending: false })
        .limit(90),
      supabase
        .from('cardio_profiles')
        .select('*')
        .eq('user_id', ctx.userId)
        .limit(1)
        .single(),
      supabase
        .from('medication_entries')
        .select('name, category, dose, frequency')
        .eq('user_id', ctx.userId)
        .is('deleted_at', null),
      supabase
        .from('exam_reports')
        .select('id, report_date, source')
        .eq('user_id', ctx.userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const profile =
      profileResult.data ??
      (profileResult.error?.code === 'PGRST116' ? null : null)
    const sessions = sessionsResult.data ?? []
    const workoutDays = workoutDaysResult.data ?? []
    const meals = mealsResult.data ?? []
    const cardioProfile =
      cardioResult.data ??
      (cardioResult.error?.code === 'PGRST116' ? null : null)
    const medications = medsResult.data ?? []
    const examReports = examsResult.data ?? []

    // ── 2. Calculate all 6 scores ───────────────────────���─────────────────
    const macroTargets: MacroTargets | undefined = profile?.tdee
      ? {
          calories: profile.tdee,
          protein_g: profile.weight ? profile.weight * 2 : 150,
          carbs_g: Math.round((profile.tdee * 0.4) / 4),
          fat_g: Math.round((profile.tdee * 0.3) / 9),
        }
      : undefined

    const trainingScore = calculateTrainingScore(sessions, workoutDays)
    const dietScore = calculateDietScore(
      meals,
      macroTargets,
      profile?.weight ?? undefined,
    )
    const sleepScore = calculateSleepScore(
      profile?.sleep_hours ?? null,
      profile?.sleep_quality ?? null,
    )
    const hydrationScore = calculateHydrationScore(
      profile?.water_per_day ?? null,
      profile?.weight ?? null,
    )
    const cardioScore = calculateCardioScore(cardioProfile)
    const overallScore = calculateOverallScore({
      training: trainingScore,
      diet: dietScore,
      sleep: sleepScore,
      hydration: hydrationScore,
      cardio: cardioScore,
    })

    // ── 3. Build context for AI narrative ──────���────────────────────────��
    const bodyState = profile ? readBodyState(profile) : null

    const medicationContext =
      medications.length > 0
        ? medications
            .map((m) => `${m.name} (${m.category}) – ${m.dose ?? 'sem dose'} ${m.frequency ?? ''}`.trim())
            .join('; ')
        : null

    const examContext =
      examReports.length > 0
        ? `${examReports.length} relatório(s) de exames registrado(s)`
        : null

    const workoutContext =
      sessions.length > 0
        ? `${sessions.length} sessões registradas recentemente; ${workoutDays.length} dias de treino configurados`
        : null

    const dietContext =
      meals.length > 0
        ? `${meals.length} refeições registradas recentemente`
        : null

    // ── 4. Call AI extract for narrative recommendations ──────────────────
    let recommendations: string[] = []
    let reportData: Record<string, unknown> = {}

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000'

      const aiRes = await fetch(`${baseUrl}/api/v1/ai/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: [
            bodyState ? `Corpo: ${bodyState}` : '',
            workoutContext ? `Treinos: ${workoutContext}` : '',
            dietContext ? `Dieta: ${dietContext}` : '',
            medicationContext ? `Suplementos: ${medicationContext}` : '',
            examContext ? `Exames: ${examContext}` : '',
            `Scores – Treino: ${trainingScore}, Dieta: ${dietScore}, Sono: ${sleepScore}, Hidratação: ${hydrationScore}, Cardio: ${cardioScore}, Geral: ${overallScore}`,
          ]
            .filter(Boolean)
            .join('\n'),
          extractionType: 'workout',
        }),
      })

      if (aiRes.ok) {
        const aiJson = await aiRes.json()
        if (aiJson.success && aiJson.extracted) {
          recommendations = aiJson.extracted.recommendations ?? []
          reportData = aiJson.extracted
        }
      }
    } catch (aiErr) {
      // AI generation failure is non-fatal; scores are still saved
      console.warn('[POST /analise-ia] AI extract failed:', aiErr)
    }

    // ── 5. Save report to DB ─────────────────────────��────────────────────
    const { data: savedReport, error: saveError } = await supabase
      .from('ai_analysis_reports')
      .insert({
        user_id: ctx.userId,
        generated_at: new Date().toISOString(),
        score_training: trainingScore,
        score_diet: dietScore,
        score_sleep: sleepScore,
        score_hydration: hydrationScore,
        score_cardio: cardioScore,
        score_overall: overallScore,
        recommendations,
        report_data: Object.keys(reportData).length > 0 ? reportData : null,
      })
      .select()
      .single()

    if (saveError || !savedReport) {
      throw new Error(saveError?.message ?? 'Falha ao salvar relatório de análise')
    }

    return createApiResponse(savedReport as AiAnalysisReportsRow, 201)
  } catch (err) {
    console.error('[POST /analise-ia]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao gerar análise IA'
    return createErrorResponse(message, 500)
  }
})
