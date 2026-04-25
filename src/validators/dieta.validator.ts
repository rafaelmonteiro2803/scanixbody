/**
 * SCANIX BODY – Dieta Validators
 *
 * Zod schemas for diet / meal-related API payloads.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Allowed values (mirrors database enums)
// ---------------------------------------------------------------------------

const mealSourceValues = ['manual', 'ai_analysis', 'file_import'] as const

// ---------------------------------------------------------------------------
// Create Meal
// ---------------------------------------------------------------------------

export const createMealSchema = z.object({
  mealName: z
    .string({ required_error: 'Nome da refeição é obrigatório' })
    .min(1, 'Nome da refeição não pode ser vazio')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      'Horário deve estar no formato HH:MM (24h)',
    )
    .optional()
    .nullable(),

  items: z
    .string()
    .max(2000, 'Itens devem ter no máximo 2000 caracteres')
    .optional()
    .nullable(),

  calories: z
    .number()
    .min(0, 'Calorias não pode ser negativo')
    .max(9999, 'Calorias deve ser menor que 9999')
    .optional()
    .nullable(),

  proteinG: z
    .number()
    .min(0, 'Proteína não pode ser negativa')
    .max(9999, 'Proteína deve ser menor que 9999 g')
    .optional()
    .nullable(),

  carbsG: z
    .number()
    .min(0, 'Carboidratos não pode ser negativo')
    .max(9999, 'Carboidratos deve ser menor que 9999 g')
    .optional()
    .nullable(),

  fatG: z
    .number()
    .min(0, 'Gorduras não pode ser negativo')
    .max(9999, 'Gorduras deve ser menor que 9999 g')
    .optional()
    .nullable(),

  mealDate: z
    .string({ required_error: 'Data da refeição é obrigatória' })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'mealDate deve estar no formato YYYY-MM-DD',
    ),

  source: z.enum(mealSourceValues).optional().default('manual'),

  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
})

export type CreateMealInput = z.infer<typeof createMealSchema>

export const updateMealSchema = createMealSchema.partial()

export type UpdateMealInput = z.infer<typeof updateMealSchema>

// ---------------------------------------------------------------------------
// List meals query params
// ---------------------------------------------------------------------------

export const listMealsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve estar no formato YYYY-MM-DD')
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate deve estar no formato YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate deve estar no formato YYYY-MM-DD')
    .optional(),
})

export type ListMealsQueryInput = z.infer<typeof listMealsQuerySchema>
