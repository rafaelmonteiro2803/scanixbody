/**
 * SCANIX BODY – Medicamentos Validators
 *
 * Zod schemas for medication/supplement entry API payloads.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Allowed enum values (mirrors database enums)
// ---------------------------------------------------------------------------

const medicationCategoryValues = [
  'hormonio',
  'peptideo',
  'suplemento',
  'medicamento',
  'sarm',
  'outro',
] as const

const medicationSourceValues = ['manual', 'import'] as const

// ---------------------------------------------------------------------------
// Create Medication Entry
// ---------------------------------------------------------------------------

export const createMedicationSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome não pode ser vazio')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),

  category: z
    .enum(medicationCategoryValues, {
      errorMap: () => ({ message: 'Categoria inválida' }),
    })
    .optional()
    .default('outro'),

  dose: z
    .string()
    .max(100, 'Dose deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  frequency: z
    .string()
    .max(100, 'Frequência deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  route: z
    .string()
    .max(100, 'Via de administração deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  startDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'startDate deve estar no formato YYYY-MM-DD',
    )
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(1000, 'Notas devem ter no máximo 1000 caracteres')
    .optional()
    .nullable(),

  source: z
    .enum(medicationSourceValues, {
      errorMap: () => ({ message: 'Fonte inválida' }),
    })
    .optional()
    .default('manual'),
})

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>

export const updateMedicationSchema = createMedicationSchema.partial()

export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>

// ---------------------------------------------------------------------------
// List medications query params
// ---------------------------------------------------------------------------

export const listMedicationsQuerySchema = z.object({
  category: z.enum(medicationCategoryValues).optional(),
  search: z.string().max(200).optional(),
})

export type ListMedicationsQueryInput = z.infer<typeof listMedicationsQuerySchema>
