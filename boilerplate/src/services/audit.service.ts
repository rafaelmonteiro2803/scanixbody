/**
 * MY APP – Audit Logging Service
 *
 * Provides structured audit log writes and reads.  All sensitive operations
 * in the application should call `auditService.log(...)` so that a full
 * activity trail is maintained in the `audit_logs` table.
 */

import { createClient } from '@/lib/supabase/server'
import type { AuditLogsRow } from '@/types/database.types'

export type AuditLog = AuditLogsRow

export interface AuditLogFilters {
  userId?: string
  action?: string
  resource?: string
  startDate?: string
  endDate?: string
}

function toJsonMetadata(value: unknown): Record<string, unknown> | null {
  if (value == null) return null
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  } catch {
    return null
  }
}

const auditService = {
  /**
   * Persists a single audit event.  Errors are swallowed so that a logging
   * failure never disrupts the primary operation.
   *
   * @param action      - Dot-namespaced event identifier, e.g. `"auth.login"`.
   * @param resource    - The entity type being acted upon, e.g. `"product"`.
   * @param resourceId  - The UUID of the affected record (optional).
   * @param metadata    - Arbitrary JSON payload attached to the log entry.
   */
  async log(
    action: string,
    resource: string,
    resourceId?: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id ?? null,
        action,
        resource,
        resource_id: resourceId ?? null,
        metadata: toJsonMetadata(metadata),
      })

      if (error) {
        console.error('[AuditService] Failed to write audit log:', error.message)
      }
    } catch (err) {
      console.error('[AuditService] Unexpected error:', err)
    }
  },

  /**
   * Retrieves a paginated list of audit log entries.
   */
  async getAuditLogs(
    userId?: string,
    limit = 50,
    offset = 0,
    filters?: AuditLogFilters,
  ): Promise<AuditLog[]> {
    const supabase = await createClient()

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) query = query.eq('user_id', userId)
    if (filters?.action) query = query.eq('action', filters.action)
    if (filters?.resource) query = query.eq('resource', filters.resource)
    if (filters?.startDate) query = query.gte('created_at', filters.startDate)
    if (filters?.endDate) query = query.lte('created_at', filters.endDate)

    const { data, error } = await query

    if (error) {
      throw new Error(`[AuditService] getAuditLogs failed: ${error.message}`)
    }

    return data ?? []
  },
}

export default auditService
