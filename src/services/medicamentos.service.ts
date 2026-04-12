/**
 * SCANIX BODY – Medicamentos (Medication) Service
 *
 * Full CRUD for medication / supplement entries.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
import type { MedicationEntriesRow } from '@/types/database.types'
import type {
  CreateMedicationEntryDTO,
  UpdateMedicationEntryDTO,
} from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type MedicationEntry = MedicationEntriesRow

export interface MedicationFilters {
  category?: MedicationEntriesRow['category']
  search?: string
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

class MedicamentosServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'MedicamentosServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const medicamentosService = {
  /**
   * Returns all non-deleted medication entries for a user.
   * Supports optional filtering by category and a case-insensitive name search.
   */
  async getMedications(
    userId: string,
    filters?: MedicationFilters,
  ): Promise<MedicationEntry[]> {
    const supabase = await createClient()

    let query = supabase
      .from('medication_entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new MedicamentosServiceError(
        `getMedications failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Returns a single medication entry by ID.
   */
  async getMedicationById(id: string): Promise<MedicationEntry | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('medication_entries')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null

      throw new MedicamentosServiceError(
        `getMedicationById failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? null
  },

  /**
   * Creates a new medication entry.
   */
  async createMedication(
    userId: string,
    data: CreateMedicationEntryDTO,
  ): Promise<MedicationEntry> {
    const supabase = await createClient()

    const { data: created, error } = await supabase
      .from('medication_entries')
      .insert({
        user_id: userId,
        name: data.name,
        category: data.category ?? 'outro',
        dose: data.dose ?? null,
        frequency: data.frequency ?? null,
        route: data.route ?? null,
        start_date: data.start_date ?? null,
        notes: data.notes ?? null,
        source: data.source ?? 'manual',
      })
      .select()
      .single()

    if (error || !created) {
      throw new MedicamentosServiceError(
        `createMedication failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.MEDICATION_CREATED,
      AUDIT_RESOURCES.MEDICATION,
      created.id,
      { name: created.name, category: created.category },
    )

    return created
  },

  /**
   * Partially updates an existing medication entry.
   */
  async updateMedication(
    id: string,
    data: UpdateMedicationEntryDTO,
  ): Promise<MedicationEntry> {
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('medication_entries')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      throw new MedicamentosServiceError(
        `updateMedication failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.MEDICATION_UPDATED,
      AUDIT_RESOURCES.MEDICATION,
      id,
      data,
    )

    return updated
  },

  /**
   * Soft-deletes a medication entry.
   */
  async deleteMedication(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('medication_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new MedicamentosServiceError(
        `deleteMedication failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.MEDICATION_DELETED,
      AUDIT_RESOURCES.MEDICATION,
      id,
    )
  },

  /**
   * Hard-deletes a medication entry permanently.
   * Use with caution – prefer `deleteMedication` (soft delete) in most cases.
   */
  async hardDeleteMedication(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('medication_entries')
      .delete()
      .eq('id', id)

    if (error) {
      throw new MedicamentosServiceError(
        `hardDeleteMedication failed: ${error.message}`,
        error.code,
      )
    }
  },

  /**
   * Returns the count of active (non-deleted) medications for a user.
   */
  async getMedicationCount(userId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('medication_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      throw new MedicamentosServiceError(
        `getMedicationCount failed: ${error.message}`,
        error.code,
      )
    }

    return count ?? 0
  },
}

export default medicamentosService
