/**
 * SCANIX BODY – AI Integration Service (provider-agnostic)
 *
 * Centralises all communication with the AI extraction API route.
 * The concrete AI provider (OpenAI / Claude) is resolved server-side in
 * /api/v1/ai/extract, so client code remains completely decoupled from it.
 *
 * Usage:
 *   const result = await aiService.extractStructuredData(prompt, content, schema)
 *   const report = await aiService.generateAnalysisReport(userData)
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Lightweight user data snapshot sent to the analysis endpoint */
export interface UserDataSummary {
  userId: string
  bodyState?: string | null
  trainingScore?: number | null
  dietScore?: number | null
  sleepScore?: number | null
  hydrationScore?: number | null
  cardioScore?: number | null
  overallScore?: number | null
  // Raw context strings assembled by the caller
  workoutContext?: string | null
  dietContext?: string | null
  medicationContext?: string | null
  examContext?: string | null
  bodyContext?: string | null
  // Athlete-specific overrides
  goal?: string | null
  activityLevel?: string | null
}

/** Shape returned by the AI analysis endpoint */
export interface AnalysisResult {
  summary: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  weeklyFocus: string
  estimatedProgressTimeline?: string | null
  generatedAt: string
}

/** Extraction parameters sent to /api/v1/ai/extract */
interface ExtractPayload {
  prompt: string
  content: string
  expectedFormat: string
}

/** Raw envelope returned by /api/v1/ai/extract */
interface ExtractApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  mock?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds the full URL for the extract endpoint */
function extractUrl(): string {
  // Works both server-side (absolute) and client-side (relative)
  if (typeof window === 'undefined') {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000'
    return `${base}/api/v1/ai/extract`
  }
  return '/api/v1/ai/extract'
}

/** Constructs the prompt for full analysis report generation */
function buildAnalysisPrompt(userData: UserDataSummary): string {
  const scores = [
    userData.trainingScore != null ? `Treino: ${userData.trainingScore}/100` : null,
    userData.dietScore != null ? `Dieta: ${userData.dietScore}/100` : null,
    userData.sleepScore != null ? `Sono: ${userData.sleepScore}/100` : null,
    userData.hydrationScore != null ? `Hidratação: ${userData.hydrationScore}/100` : null,
    userData.cardioScore != null ? `Cardio: ${userData.cardioScore}/100` : null,
    userData.overallScore != null ? `Geral: ${userData.overallScore}/100` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return [
    'Você é um coach fitness e nutricionista especializado.',
    'Com base nos dados do atleta abaixo, gere um relatório de análise completo em português.',
    '',
    'DADOS DO ATLETA:',
    userData.bodyState ? `Corpo: ${userData.bodyState}` : '',
    scores ? `Scores: ${scores}` : '',
    userData.workoutContext ? `Treinos: ${userData.workoutContext}` : '',
    userData.dietContext ? `Dieta: ${userData.dietContext}` : '',
    userData.medicationContext ? `Medicamentos/Suplementos: ${userData.medicationContext}` : '',
    userData.examContext ? `Exames Laboratoriais: ${userData.examContext}` : '',
    userData.goal ? `Objetivo: ${userData.goal}` : '',
    userData.activityLevel ? `Nível de atividade: ${userData.activityLevel}` : '',
    '',
    'Retorne APENAS um JSON válido com a estrutura especificada em expectedFormat.',
    'Seja específico, actionável e baseado nos dados fornecidos.',
    'Use linguagem motivadora mas honesta.',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

const analysisExpectedFormat = JSON.stringify({
  summary: 'string – 3-4 sentences summarising the athlete state',
  strengths: ['array of 2-4 string items'],
  improvements: ['array of 2-4 string items'],
  recommendations: ['array of 3-5 actionable string items'],
  weeklyFocus: 'string – single top priority for the next 7 days',
  estimatedProgressTimeline: 'string or null – rough timeline estimate',
  generatedAt: 'ISO 8601 datetime string',
})

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const aiService = {
  /**
   * Sends `content` to the AI extraction endpoint with a structured `prompt`,
   * then validates the response against the provided Zod schema.
   *
   * @param prompt         - Instruction describing what to extract
   * @param content        - Raw text / document content
   * @param schema         - Zod schema to parse and validate the response
   * @returns              Typed parsed result
   * @throws               When the API returns an error or the schema fails
   */
  async extractStructuredData<T>(
    prompt: string,
    content: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const payload: ExtractPayload = {
      prompt,
      content,
      expectedFormat: JSON.stringify(schema.description ?? 'structured JSON object'),
    }

    const res = await fetch(extractUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(`AI extract API error ${res.status}: ${text}`)
    }

    const envelope: ExtractApiResponse<unknown> = await res.json()

    if (!envelope.success || envelope.data === undefined) {
      throw new Error(envelope.error ?? 'AI extract returned no data')
    }

    // Validate against Zod schema
    const parsed = schema.safeParse(envelope.data)
    if (!parsed.success) {
      throw new Error(
        `AI response failed schema validation: ${parsed.error.message}`,
      )
    }

    return parsed.data
  },

  /**
   * Sends a full user data snapshot to the AI to generate a personalised
   * analysis report.  The caller is responsible for assembling the context
   * strings from the relevant services.
   *
   * @param userData - Aggregated athlete data for the prompt
   * @returns        Typed analysis result
   */
  async generateAnalysisReport(userData: UserDataSummary): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(userData)
    const content = `Usuário ID: ${userData.userId}`

    const payload: ExtractPayload = {
      prompt,
      content,
      expectedFormat: analysisExpectedFormat,
    }

    const res = await fetch(extractUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(`AI analysis API error ${res.status}: ${text}`)
    }

    const envelope: ExtractApiResponse<AnalysisResult> = await res.json()

    if (!envelope.success || !envelope.data) {
      throw new Error(envelope.error ?? 'AI analysis returned no data')
    }

    return {
      ...envelope.data,
      generatedAt: envelope.data.generatedAt ?? new Date().toISOString(),
    }
  },
}

export default aiService
