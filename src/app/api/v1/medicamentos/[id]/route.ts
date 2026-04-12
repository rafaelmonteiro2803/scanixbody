/**
 * PUT    /api/v1/medicamentos/:id  – update a medication entry
 * DELETE /api/v1/medicamentos/:id  – soft-delete a medication entry
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
import { updateMedicationSchema } from '@/validators/medicamentos.validator'
import medicamentosService from '@/services/medicamentos.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// PUT /api/v1/medicamentos/:id
// ---------------------------------------------------------------------------

export const PUT = withAuth(
  async (request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID do medicamento é obrigatório', 400)
    }

    // Verify ownership
    const existing = await medicamentosService.getMedicationById(id)
    if (!existing) {
      return createErrorResponse('Medicamento não encontrado', 404)
    }
    if (existing.user_id !== ctx.userId) {
      return createErrorResponse('Acesso negado', 403)
    }

    const { data: body, error: parseError } = await parseBody(request)
    if (parseError) {
      return createErrorResponse(parseError, 400)
    }

    const { data: input, error: validationError } = validateParams(
      updateMedicationSchema,
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
      const updated = await medicamentosService.updateMedication(id, {
        name: input!.name,
        category: input!.category,
        dose: input!.dose ?? undefined,
        frequency: input!.frequency ?? undefined,
        route: input!.route ?? undefined,
        start_date: input!.startDate ?? undefined,
        notes: input!.notes ?? undefined,
        source: input!.source,
      })

      return createApiResponse(updated)
    } catch (err) {
      console.error('[PUT /medicamentos/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar medicamento'
      return createErrorResponse(message, 500)
    }
  },
)

// ---------------------------------------------------------------------------
// DELETE /api/v1/medicamentos/:id
// ---------------------------------------------------------------------------

export const DELETE = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID do medicamento é obrigatório', 400)
    }

    // Verify ownership
    const existing = await medicamentosService.getMedicationById(id)
    if (!existing) {
      return createErrorResponse('Medicamento não encontrado', 404)
    }
    if (existing.user_id !== ctx.userId) {
      return createErrorResponse('Acesso negado', 403)
    }

    try {
      await medicamentosService.deleteMedication(id)
      return createApiResponse({ deleted: true })
    } catch (err) {
      console.error('[DELETE /medicamentos/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir medicamento'
      return createErrorResponse(message, 500)
    }
  },
)
