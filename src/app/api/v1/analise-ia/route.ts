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

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-helpers'
import { analysisRateLimiter } from '@/lib/rate-limiter'
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
    const [profileResult, workoutDaysResult, mealsResult, cardioResult, medsResult, examsResult] =
      await Promise.all([
        supabase
          .from('athlete_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId),
        supabase
          .from('workout_days')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId)
          .is('deleted_at', null),
        supabase
          .from('meals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId)
          .is('deleted_at', null),
        supabase
          .from('cardio_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId)
          .eq('is_active', true),
        supabase
          .from('medication_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId)
          .eq('is_active', true),
        supabase
          .from('exam_reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId)
          .is('deleted_at', null),
      ])

    const checklistStatus = {
      hasProfile: (profileResult.count ?? 0) > 0,
      hasWorkoutDays: (workoutDaysResult.count ?? 0) > 0,
      hasMeals: (mealsResult.count ?? 0) > 0,
      hasCardio: (cardioResult.count ?? 0) > 0,
      hasMedications: (medsResult.count ?? 0) > 0,
      hasExams: (examsResult.count ?? 0) > 0,
    }

    // Determine if the user can rerun the analysis
    // (allowed if any data was created OR updated since the last report)
    let canRerun = true
    if (report) {
      const since = report.generated_at
      const changeChecks = await Promise.all([
        // New rows
        supabase.from('meals').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('workout_days').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('workout_exercises').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('cardio_profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).eq('is_active', true).gt('created_at', since),
        supabase.from('medication_entries').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).eq('is_active', true).gt('created_at', since),
        supabase.from('exam_reports').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        // Updated rows (edits to existing data also count as a change)
        supabase.from('athlete_profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).gt('updated_at', since),
        supabase.from('meals').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('updated_at', since),
        supabase.from('workout_exercises').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('updated_at', since),
        supabase.from('cardio_profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).eq('is_active', true).gt('updated_at', since),
      ])
      canRerun = changeChecks.some((r) => (r.count ?? 0) > 0)
    }

    return createApiResponse({
      report: report ?? null,
      checklistStatus,
      canRerun,
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
  // Rate limit: 3 full analyses per 10 min per user
  const rateLimit = analysisRateLimiter.check(ctx.userId)
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil(rateLimit.resetInMs / 1000)
    return createErrorResponse(
      `Muitas análises geradas. Aguarde ${Math.ceil(retryAfter / 60)} minuto(s) antes de tentar novamente.`,
      429,
    )
  }

  const supabase = await createClient()

  try {
    // Guard: enforce canRerun server-side (prevents bypassing the client-side lock)
    const { data: lastReport } = await supabase
      .from('ai_analysis_reports')
      .select('generated_at')
      .eq('user_id', ctx.userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (lastReport) {
      const since = lastReport.generated_at
      const changeChecks = await Promise.all([
        supabase.from('meals').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('workout_days').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('workout_exercises').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('cardio_profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).eq('is_active', true).gt('created_at', since),
        supabase.from('medication_entries').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).eq('is_active', true).gt('created_at', since),
        supabase.from('exam_reports').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('created_at', since),
        supabase.from('athlete_profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).gt('updated_at', since),
        supabase.from('meals').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('updated_at', since),
        supabase.from('workout_exercises').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).is('deleted_at', null).gt('updated_at', since),
        supabase.from('cardio_profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.userId).eq('is_active', true).gt('updated_at', since),
      ])
      const hasChanges = changeChecks.some((r) => (r.count ?? 0) > 0)
      if (!hasChanges) {
        return createErrorResponse(
          'Nenhuma alteração nos dados desde a última análise.',
          422,
          'NO_DATA_CHANGES',
        )
      }
    }

    // ── 1. Fetch all user data in parallel ───────────────────���────────────
    const [
      profileResult,
      sessionsResult,
      workoutDaysResult,
      workoutExercisesResult,
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
        .from('workout_exercises')
        .select('workout_day_id, name, sets, target_reps, load, notes')
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
        .eq('is_active', true),
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
    const workoutExercises = workoutExercisesResult.data ?? []
    const meals = mealsResult.data ?? []
    const cardioProfile =
      cardioResult.data ??
      (cardioResult.error?.code === 'PGRST116' ? null : null)
    const medications = medsResult.data ?? []
    const examReports = examsResult.data ?? []

    // Fetch actual exam markers for the most recent report
    let examMarkers: Array<{ marker_name: string; value: string | null; unit: string | null; status: string | null; reference_range: string | null }> = []
    if (examReports.length > 0) {
      const { data: markers } = await supabase
        .from('exam_markers')
        .select('marker_name, value, unit, status, reference_range')
        .eq('exam_report_id', examReports[0].id)
        .order('marker_name', { ascending: true })
      examMarkers = markers ?? []
    }

    // ── 2. Calculate all 6 scores ─────────────────────────────────────────
    const macroTargets: MacroTargets | undefined = profile?.tdee
      ? {
          calories: profile.tdee,
          protein_g: profile.weight ? profile.weight * 2 : 150,
          carbs_g: Math.round((profile.tdee * 0.4) / 4),
          fat_g: Math.round((profile.tdee * 0.3) / 9),
        }
      : undefined

    const trainingScore = calculateTrainingScore(sessions, workoutDays, workoutExercises.length)
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

    const examContext = examMarkers.length > 0
      ? examMarkers
          .map((m) => {
            const range = m.reference_range ? ` [ref: ${m.reference_range}]` : ''
            const status = m.status ? ` → ${m.status.toUpperCase()}` : ''
            return `${m.marker_name}: ${m.value ?? '?'} ${m.unit ?? ''}${range}${status}`
          })
          .join('; ')
      : examReports.length > 0
        ? `${examReports.length} relatório(s) registrado(s) sem marcadores detalhados`
        : null

    const workoutContext =
      workoutDays.length > 0
        ? [
            `Programa: ${workoutDays.map((d) => d.name).join(', ')} (${workoutDays.length} dias de treino)`,
            `Total de ${workoutExercises.length} exercícios configurados`,
            sessions.length > 0
              ? `${sessions.length} sessões registradas recentemente`
              : 'Sem sessões registradas — análise baseada na estrutura do programa',
          ].join('; ')
        : null

    const dietContext =
      meals.length > 0
        ? `${meals.length} refeições registradas recentemente`
        : null

    // ── 4. Call Claude directly for narrative recommendations ─────────────
    let recommendations: string[] = []
    let reportData: Record<string, unknown> = {}

    try {
      const anthropicKey = process.env.ANTHROPIC_API_KEY
      if (anthropicKey) {
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const athleteContext = [
          bodyState ? `Composição corporal: ${bodyState}` : null,
          workoutContext ? `Treinos: ${workoutContext}` : null,
          dietContext ? `Dieta: ${dietContext}` : null,
          medicationContext ? `Medicamentos/Suplementos: ${medicationContext}` : null,
          examContext ? `Exames laboratoriais: ${examContext}` : null,
          profile?.goal ? `Objetivo: ${profile.goal}` : null,
          `Scores – Treino: ${trainingScore}/100, Dieta: ${dietScore}/100, Sono: ${sleepScore}/100, Hidratação: ${hydrationScore}/100, Cardio: ${cardioScore}/100, Geral: ${overallScore}/100`,
        ].filter(Boolean).join('\n')

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: 'Você é um coach fitness e nutricionista especializado. Seja honesto, motivador e prático. Retorne apenas JSON válido, sem markdown.',
          messages: [{
            role: 'user',
            content: `Com base nos dados do atleta abaixo, gere um relatório de análise completo e personalizado em português.

DADOS DO ATLETA:
${athleteContext}

INSTRUÇÕES:
- Se houver medicamentos/suplementos, analise como cada um impacta o objetivo declarado, a dieta, o sono e a recuperação.
- Se houver marcadores de exames, identifique quais estão ALTO, BAIXO ou CRÍTICO e inclua nas recomendações.
- Seja específico com os dados fornecidos — não invente informações ausentes.
- Seja honesto sobre pontos negativos, mas sempre motivador.

Retorne APENAS este JSON (sem markdown):
{
  "summary": "3-4 frases descrevendo o estado atual do atleta, mencionando composição corporal, treino e principais destaques",
  "strengths": ["ponto forte específico 1", "ponto forte específico 2", "ponto forte específico 3"],
  "improvements": ["área de melhoria concreta 1", "área de melhoria concreta 2", "área de melhoria concreta 3"],
  "recommendations": ["recomendação prática e específica 1", "recomendação 2", "recomendação 3", "recomendação 4", "recomendação 5"],
  "weeklyFocus": "a prioridade número 1 para os próximos 7 dias em uma frase de ação",
  "estimatedProgressTimeline": "estimativa realista de prazo para atingir o objetivo, ou null"
}`,
          }],
        })

        const rawText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
        const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
        const jsonStr = codeBlock ? codeBlock[1].trim() : rawText.trim()
        const aiResult = JSON.parse(jsonStr) as Record<string, unknown>

        recommendations = Array.isArray(aiResult.recommendations) ? aiResult.recommendations as string[] : []
        reportData = aiResult
      }
    } catch (aiErr) {
      // AI generation failure is non-fatal; scores are still saved
      console.warn('[POST /analise-ia] Claude call failed:', aiErr)
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
