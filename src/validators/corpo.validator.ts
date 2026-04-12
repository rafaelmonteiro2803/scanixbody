/**
 * SCANIX BODY – Corpo (Body Assessment) Validators
 *
 * Zod schemas for athlete body composition API payloads.
 * All body measurement fields are optional to allow partial saves,
 * but userId is required internally (injected from the session, not the body).
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Allowed enum values (mirrors database types)
// ---------------------------------------------------------------------------

const sexValues = ['M', 'F'] as const

const activityLevelValues = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const

const bodySegmentValues = [
  'right_arm',
  'left_arm',
  'trunk',
  'right_leg',
  'left_leg',
] as const

// ---------------------------------------------------------------------------
// Body segment schema (used nested inside the main profile schema)
// ---------------------------------------------------------------------------

export const bodySegmentInputSchema = z.object({
  segment: z.enum(bodySegmentValues, {
    errorMap: () => ({ message: 'Segmento corporal inválido' }),
  }),
  leanMass: z.number().min(0).max(200).optional().nullable(),
  fatMass: z.number().min(0).max(200).optional().nullable(),
})

export type BodySegmentInput = z.infer<typeof bodySegmentInputSchema>

// ---------------------------------------------------------------------------
// Athlete profile (body assessment) payload
// ---------------------------------------------------------------------------

export const saveAthleteProfileSchema = z.object({
  // Anthropometrics
  weight: z
    .number()
    .min(20, 'Peso mínimo: 20 kg')
    .max(500, 'Peso máximo: 500 kg')
    .optional()
    .nullable(),

  height: z
    .number()
    .min(50, 'Altura mínima: 50 cm')
    .max(300, 'Altura máxima: 300 cm')
    .optional()
    .nullable(),

  age: z
    .number()
    .int('Idade deve ser um número inteiro')
    .min(1, 'Idade mínima: 1 ano')
    .max(150, 'Idade máxima: 150 anos')
    .optional()
    .nullable(),

  sex: z
    .enum(sexValues, { errorMap: () => ({ message: 'Sexo deve ser M ou F' }) })
    .optional()
    .nullable(),

  // Body composition (InBody / bioimpedance outputs)
  bodyFatPercentage: z
    .number()
    .min(1, 'Percentual de gordura mínimo: 1%')
    .max(70, 'Percentual de gordura máximo: 70%')
    .optional()
    .nullable(),

  fatMass: z
    .number()
    .min(0, 'Massa gorda não pode ser negativa')
    .max(400, 'Massa gorda máxima: 400 kg')
    .optional()
    .nullable(),

  skeletalMuscleMass: z
    .number()
    .min(0, 'Massa muscular esquelética não pode ser negativa')
    .max(200, 'Massa muscular esquelética máxima: 200 kg')
    .optional()
    .nullable(),

  leanMass: z
    .number()
    .min(0, 'Massa magra não pode ser negativa')
    .max(400, 'Massa magra máxima: 400 kg')
    .optional()
    .nullable(),

  bodyWater: z
    .number()
    .min(0, 'Água corporal não pode ser negativa')
    .max(300, 'Água corporal máxima: 300 L')
    .optional()
    .nullable(),

  proteinMass: z
    .number()
    .min(0, 'Massa proteica não pode ser negativa')
    .max(100, 'Massa proteica máxima: 100 kg')
    .optional()
    .nullable(),

  mineralsMass: z
    .number()
    .min(0, 'Massa de minerais não pode ser negativa')
    .max(50, 'Massa de minerais máxima: 50 kg')
    .optional()
    .nullable(),

  bmi: z
    .number()
    .min(5, 'IMC mínimo: 5')
    .max(100, 'IMC máximo: 100')
    .optional()
    .nullable(),

  bmr: z
    .number()
    .min(500, 'TMB mínima: 500 kcal')
    .max(10000, 'TMB máxima: 10000 kcal')
    .optional()
    .nullable(),

  visceralFat: z
    .number()
    .min(1, 'Gordura visceral mínima: 1')
    .max(50, 'Gordura visceral máxima: 50')
    .optional()
    .nullable(),

  waistHipRatio: z
    .number()
    .min(0.5, 'Relação cintura-quadril mínima: 0.5')
    .max(2.0, 'Relação cintura-quadril máxima: 2.0')
    .optional()
    .nullable(),

  obesityGrade: z
    .string()
    .max(50, 'Grau de obesidade deve ter no máximo 50 caracteres')
    .optional()
    .nullable(),

  inbodyScore: z
    .number()
    .min(0, 'InBody score mínimo: 0')
    .max(100, 'InBody score máximo: 100')
    .optional()
    .nullable(),

  idealWeight: z
    .number()
    .min(20, 'Peso ideal mínimo: 20 kg')
    .max(300, 'Peso ideal máximo: 300 kg')
    .optional()
    .nullable(),

  // Lifestyle
  goal: z
    .string()
    .max(100, 'Objetivo deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  activityLevel: z
    .enum(activityLevelValues, {
      errorMap: () => ({ message: 'Nível de atividade inválido' }),
    })
    .optional()
    .nullable(),

  sleepHours: z
    .number()
    .min(0, 'Horas de sono não pode ser negativo')
    .max(24, 'Horas de sono máximo: 24')
    .optional()
    .nullable(),

  sleepQuality: z
    .number()
    .int('Qualidade do sono deve ser inteira')
    .min(1, 'Qualidade do sono mínima: 1')
    .max(10, 'Qualidade do sono máxima: 10')
    .optional()
    .nullable(),

  waterPerDay: z
    .number()
    .min(0, 'Ingestão de água não pode ser negativa')
    .max(20000, 'Ingestão de água máxima: 20000 ml')
    .optional()
    .nullable(),

  tdee: z
    .number()
    .min(500, 'TDEE mínimo: 500 kcal')
    .max(15000, 'TDEE máximo: 15000 kcal')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(2000, 'Notas devem ter no máximo 2000 caracteres')
    .optional()
    .nullable(),

  // Optional body segments array (upserted alongside the profile)
  bodySegments: z
    .array(bodySegmentInputSchema)
    .max(5, 'Máximo de 5 segmentos corporais')
    .optional(),
})

export type SaveAthleteProfileInput = z.infer<typeof saveAthleteProfileSchema>
