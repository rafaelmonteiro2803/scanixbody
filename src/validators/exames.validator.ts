/**
 * SCANIX BODY – Exames Validators
 *
 * Zod schemas for lab exam report and marker API payloads.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Allowed enum values (mirrors database enums)
// ---------------------------------------------------------------------------

const examReportSourceValues = ['file', 'text'] as const

const examMarkerStatusValues = ['normal', 'alto', 'baixo', 'critico'] as const

// ---------------------------------------------------------------------------
// Exam marker (single lab result)
// ---------------------------------------------------------------------------

export const examMarkerSchema = z.object({
  markerName: z
    .string({ required_error: 'Nome do marcador é obrigatório' })
    .min(1, 'Nome do marcador não pode ser vazio')
    .max(200, 'Nome do marcador deve ter no máximo 200 caracteres'),

  value: z
    .string()
    .max(100, 'Valor deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  unit: z
    .string()
    .max(50, 'Unidade deve ter no máximo 50 caracteres')
    .optional()
    .nullable(),

  referenceRange: z
    .string()
    .max(100, 'Intervalo de referência deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  status: z
    .enum(examMarkerStatusValues, {
      errorMap: () => ({ message: 'Status inválido' }),
    })
    .optional()
    .nullable(),
})

export type ExamMarkerInput = z.infer<typeof examMarkerSchema>

// ---------------------------------------------------------------------------
// Create Exam Report
// ---------------------------------------------------------------------------

export const createExamReportSchema = z.object({
  fileAssetId: z
    .string()
    .uuid('fileAssetId deve ser um UUID válido')
    .optional()
    .nullable(),

  reportDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'reportDate deve estar no formato YYYY-MM-DD',
    )
    .optional()
    .nullable(),

  source: z.enum(examReportSourceValues, {
    errorMap: () => ({ message: 'Fonte inválida. Use "file" ou "text"' }),
  }),

  rawText: z
    .string()
    .max(50000, 'Texto bruto deve ter no máximo 50000 caracteres')
    .optional()
    .nullable(),

  // Markers can be submitted together with the report
  markers: z
    .array(examMarkerSchema)
    .max(200, 'Máximo de 200 marcadores por relatório')
    .optional()
    .default([]),
})

export type CreateExamReportInput = z.infer<typeof createExamReportSchema>

// ---------------------------------------------------------------------------
// Save/Replace exam markers for an existing report
// ---------------------------------------------------------------------------

export const saveExamMarkersSchema = z.object({
  markers: z
    .array(examMarkerSchema)
    .min(1, 'Forneça pelo menos um marcador')
    .max(200, 'Máximo de 200 marcadores por relatório'),
})

export type SaveExamMarkersInput = z.infer<typeof saveExamMarkersSchema>

// ---------------------------------------------------------------------------
// List exam reports query params
// ---------------------------------------------------------------------------

export const listExamReportsQuerySchema = z.object({
  source: z.enum(examReportSourceValues).optional(),
  markerName: z.string().max(200).optional(),
})

export type ListExamReportsQueryInput = z.infer<typeof listExamReportsQuerySchema>
