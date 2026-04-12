/**
 * GET    /api/v1/sessoes/:id  – get full session detail with exercises and sets
 * DELETE /api/v1/sessoes/:id  – soft-delete a workout session
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-helpers'
import treinosService from '@/services/treinos.service'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/sessoes/:id
// ---------------------------------------------------------------------------

export const GET = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID da sessão é obrigatório', 400)
    }

    try {
      const detail = await treinosService.getSessionDetail(id)

      // Ownership check – ensure the session belongs to the authenticated user
      if (detail.user_id !== ctx.userId) {
        return createErrorResponse('Sessão não encontrada', 404)
      }

      return createApiResponse(detail)
    } catch (err) {
      console.error('[GET /sessoes/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao buscar sessão'
      // Distinguish "not found" from server errors
      if (message.toLowerCase().includes('not found')) {
        return createErrorResponse('Sessão não encontrada', 404)
      }
      return createErrorResponse(message, 500)
    }
  },
)

// ---------------------------------------------------------------------------
// DELETE /api/v1/sessoes/:id
// ---------------------------------------------------------------------------

export const DELETE = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id

    if (!id) {
      return createErrorResponse('ID da sessão é obrigatório', 400)
    }

    try {
      // Verify ownership before deleting
      const supabase = await createClient()
      const { data: session, error: fetchError } = await supabase
        .from('workout_sessions')
        .select('user_id')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (fetchError || !session) {
        return createErrorResponse('Sessão não encontrada', 404)
      }

      if (session.user_id !== ctx.userId) {
        return createErrorResponse('Acesso negado', 403)
      }

      await treinosService.deleteSession(id)
      return createApiResponse({ deleted: true })
    } catch (err) {
      console.error('[DELETE /sessoes/:id]', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir sessão'
      return createErrorResponse(message, 500)
    }
  },
)
