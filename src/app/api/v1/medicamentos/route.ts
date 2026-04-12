/**
 * GET  /api/v1/medicamentos  – list the authenticated user's medication entries
 * POST /api/v1/medicamentos  – create a new medication entry
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
import {
  createMedicationSchema,
  listMedicationsQuerySchema,
} from '@/validators/medicamentos.validator'
import medicamentosService from '@/services/medicamentos.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/medicamentos
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { searchParams } = new URL(request.url)

  const queryInput = {
    category: searchParams.get('category') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  }

  const { data: query, error: queryError } = validateParams(
    listMedicationsQuerySchema,
    queryInput,
  )
  if (queryError) {
    return createErrorResponse(
      'Parâmetros de consulta inválidos',
      400,
      'VALIDATION_ERROR',
      formatZodError(queryError),
    )
  }

  try {
    const medications = await medicamentosService.getMedications(ctx.userId, {
      category: query?.category,
      search: query?.search,
    })

    return createApiResponse({ medications, total: medications.length })
  } catch (err) {
    console.error('[GET /medicamentos]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao buscar medicamentos'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/medicamentos
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    createMedicationSchema,
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
    const medication = await medicamentosService.createMedication(ctx.userId, {
      name: input!.name,
      category: input!.category,
      dose: input!.dose ?? undefined,
      frequency: input!.frequency ?? undefined,
      route: input!.route ?? undefined,
      start_date: input!.startDate ?? undefined,
      notes: input!.notes ?? undefined,
      source: input!.source,
    })

    return createApiResponse(medication, 201)
  } catch (err) {
    console.error('[POST /medicamentos]', err)
    const message =
      err instanceof Error ? err.message : 'Erro ao criar medicamento'
    return createErrorResponse(message, 500)
  }
})
