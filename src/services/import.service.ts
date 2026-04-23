/**
 * Import Service — Decoupled AI extraction layer for SCANIX BODY
 *
 * Each method accepts a File or raw text string, calls the AI extraction
 * API route, validates the response, and returns a typed ImportResult.
 *
 * This service is completely decoupled from any specific AI provider.
 * The provider is configured via environment variables and resolved in
 * /api/v1/ai/extract.
 */

export type ExtractionType = 'workout' | 'diet' | 'medications' | 'exams' | 'bioimpedance' | 'cardio'

export interface ImportResult<T> {
  success: boolean
  data?: T
  rawText?: string
  error?: string
  confidence?: number
}

// ─── Workout Import ─────────────────────────────────────────────────────────

export interface WorkoutExerciseImport {
  name: string
  sets: number
  targetReps: number | string
  load?: number
  restSeconds?: number
  notes?: string
}

export interface WorkoutDayImport {
  name: string
  muscleGroups: string[]
  exercises: WorkoutExerciseImport[]
}

export interface WorkoutImportData {
  days: WorkoutDayImport[]
}

// ─── Diet Import ─────────────────────────────────────────────────────────────

export interface MealImport {
  mealName: string
  time?: string
  items: string
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
}

export interface DietImportData {
  meals: MealImport[]
  totalCalories?: number
  totalProteinG?: number
  totalCarbsG?: number
  totalFatG?: number
}

// ─── Medication Import ────────────────────────────────────────────────────────

export interface MedicationImport {
  name: string
  category: string
  dose: string
  frequency: string
  route?: string
  notes?: string
}

export interface MedicationImportData {
  medications: MedicationImport[]
}

// ─── Exam Import ─────────────────────────────────────────────────────────────

export interface ExamMarkerImport {
  markerName: string
  value: string
  unit?: string
  referenceRange?: string
  status?: 'normal' | 'alto' | 'baixo' | 'critico'
}

export interface ExamImportData {
  reportDate?: string
  markers: ExamMarkerImport[]
  labName?: string
}

// ─── Bioimpedance Import ─────────────────────────────────────────────────────

export interface BioimpedanceData {
  weight?: number
  height?: number
  bmi?: number
  bodyFatPercentage?: number
  fatMass?: number
  skeletalMuscleMass?: number
  leanMass?: number
  bodyWater?: number
  proteinMass?: number
  mineralsMass?: number
  visceralFat?: number
  inbodyScore?: number
  basalMetabolicRate?: number
  segments?: {
    rightArm?: { leanMass?: number; fatMass?: number }
    leftArm?: { leanMass?: number; fatMass?: number }
    trunk?: { leanMass?: number; fatMass?: number }
    rightLeg?: { leanMass?: number; fatMass?: number }
    leftLeg?: { leanMass?: number; fatMass?: number }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const normalizedType = file.type.toLowerCase()
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

    const isPdf = normalizedType === 'application/pdf' || extension === 'pdf'
    const isDocx =
      normalizedType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    const isXlsx =
      normalizedType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      extension === 'xlsx'
    const isJson = normalizedType === 'application/json' || extension === 'json'

    if (isPdf || isDocx || isXlsx) {
      const bReader = new FileReader()
      bReader.onload = e => {
        const dataUrl = e.target?.result as string
        const b64 = dataUrl.split(',')[1] ?? ''
        const prefix = isPdf ? 'PDF' : isDocx ? 'DOCX' : 'XLSX'
        resolve(`[${prefix}_BASE64]:${b64}`)
      }
      bReader.onerror = () => reject(new Error('Falha ao ler arquivo'))
      bReader.readAsDataURL(file)
      return
    }

    if (isJson || normalizedType.startsWith('text/')) {
      const reader = new FileReader()
      reader.onload = e => resolve((e.target?.result as string) ?? '')
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
      reader.readAsText(file)
      return
    }

    reject(new Error('Formato de arquivo não suportado'))
  })
}

async function callExtractionAPI<T>(
  extractionType: ExtractionType,
  content: string
): Promise<ImportResult<T>> {
  const res = await fetch('/api/v1/ai/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extractionType, content }),
  })

  const json = await res.json() as { success: boolean; extracted?: T; rawText?: string; error?: string; confidence?: number }

  if (!res.ok || !json.success) {
    return {
      success: false,
      error: json.error ?? 'Erro na extração',
    }
  }

  return {
    success: true,
    data: json.extracted,
    rawText: json.rawText,
    confidence: json.confidence,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Import workout plan from file or text.
 * Extracts days, exercises, sets, reps and load information.
 */
export async function importWorkout(input: File | string): Promise<ImportResult<WorkoutImportData>> {
  const content = typeof input === 'string' ? input : await readFileAsText(input)
  return callExtractionAPI<WorkoutImportData>('workout', content)
}

/**
 * Import diet/nutrition plan from file or text.
 * Extracts meals, foods, macros and calorie information.
 */
export async function importDiet(input: File | string): Promise<ImportResult<DietImportData>> {
  const content = typeof input === 'string' ? input : await readFileAsText(input)
  return callExtractionAPI<DietImportData>('diet', content)
}

/**
 * Import medication list from file or text.
 * Extracts medication name, category, dose, frequency and route.
 */
export async function importMedications(input: File | string): Promise<ImportResult<MedicationImportData>> {
  const content = typeof input === 'string' ? input : await readFileAsText(input)
  return callExtractionAPI<MedicationImportData>('medications', content)
}

/**
 * Import lab exam report from file or text.
 * Extracts all lab markers with values, units, reference ranges and status.
 */
export async function importExamReport(input: File | string): Promise<ImportResult<ExamImportData>> {
  const content = typeof input === 'string' ? input : await readFileAsText(input)
  return callExtractionAPI<ExamImportData>('exams', content)
}

/**
 * Import InBody/bioimpedance report from PDF.
 * Extracts all body composition metrics for automatic profile population.
 */
export async function importBioimpedance(input: File | string): Promise<ImportResult<BioimpedanceData>> {
  const content = typeof input === 'string' ? input : await readFileAsText(input)
  return callExtractionAPI<BioimpedanceData>('bioimpedance', content)
}

// ─── Cardio Import ───────────────────────────────────────────────────────────

export interface CardioSessionImport {
  sessionDate: string | null
  type: string | null
  durationMinutes: number | null
  intensity: 'low' | 'moderate' | 'high' | null
  notes: string | null
}

export interface CardioImportData {
  sessions: CardioSessionImport[]
}

/**
 * Import cardio training plan from file or text.
 * Extracts individual sessions with date, type, duration and intensity.
 */
export async function importCardio(input: File | string): Promise<ImportResult<CardioImportData>> {
  const content = typeof input === 'string' ? input : await readFileAsText(input)
  return callExtractionAPI<CardioImportData>('cardio', content)
}
