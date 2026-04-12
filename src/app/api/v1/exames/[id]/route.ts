/**
 * GET    /api/v1/exames/:id  – get exam report detail with all markers
 * DELETE /api/v1/exames/:id  – soft-delete an exam report
 */

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-helpers'
import examesService from '@/services/exames.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/exames/:id
// ---------------------------------------------------------------------------

export const GET = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID do exame é obrigatório', 400)
    }

    try {
      const report = await examesService.getExamReportById(id)

      if (!report) {
        return createErrorResponse('Exame não encontrado', 404)
      }

      // Ownership check
      if (report.user_id !== ctx.userId) {
        return createErrorResponse('Exame não encontrado', 404)
      }

      // Fetch associated markers
      const markers = await examesService.getExamMarkers(id)

      return createApiResponse({ report, markers })
    } catch (err) {
      console.error('[GET /exames/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao buscar exame'
      return createErrorResponse(message, 500)
    }
  },
)

// ---------------------------------------------------------------------------
// DELETE /api/v1/exames/:id
// ---------------------------------------------------------------------------

export const DELETE = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID do exame é obrigatório', 400)
    }

    try {
      const report = await examesService.getExamReportById(id)

      if (!report) {
        return createErrorResponse('Exame não encontrado', 404)
      }

      // Ownership check
      if (report.user_id !== ctx.userId) {
        return createErrorResponse('Acesso negado', 403)
      }

      await examesService.deleteExamReport(id)
      return createApiResponse({ deleted: true })
    } catch (err) {
      console.error('[DELETE /exames/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir exame'
      return createErrorResponse(message, 500)
    }
  },
)
