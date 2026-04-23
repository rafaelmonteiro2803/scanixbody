/**
 * DELETE /api/v1/cardio/sessions/[id]  – soft-delete a cardio session
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext } from '@/lib/api-helpers'

export const DELETE = withAuth(
  async (_request: NextRequest, ctx: AuthContext, routeContext) => {
    const id = routeContext?.params?.id
    if (!id) return createErrorResponse('ID inválido', 400)

    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('cardio_sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', ctx.userId)

      if (error) throw error

      return createApiResponse({ success: true })
    } catch (err) {
      console.error('[DELETE /cardio/sessions/:id]', err)
      return createErrorResponse(
        err instanceof Error ? err.message : 'Erro ao remover sessão',
        500,
      )
    }
  },
)
