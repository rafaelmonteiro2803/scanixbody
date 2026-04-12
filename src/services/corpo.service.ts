/**
 * SCANIX BODY – Corpo (Body Assessment) Service
 *
 * Manages athlete body composition profiles (bioimpedance / InBody data)
 * and per-segment lean/fat mass readings.
 */

import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
import type {
  AthleteProfilesRow,
  BodySegmentsRow,
} from '@/types/database.types'
import type {
  CreateAthleteProfileDTO,
  UpdateAthleteProfileDTO,
} from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AthleteProfile = AthleteProfilesRow
export type BodySegment = BodySegmentsRow

export interface BodySegmentInput {
  segment: BodySegmentsRow['segment']
  lean_mass?: number | null
  fat_mass?: number | null
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

class CorpoServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'CorpoServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const corpoService = {
  /**
   * Returns the most recent athlete profile for a user, or `null` if none
   * exists yet.
   */
  async getAthleteProfile(userId: string): Promise<AthleteProfile | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // PostgREST returns code PGRST116 when `.single()` finds no rows.
      if (error.code === 'PGRST116') return null

      throw new CorpoServiceError(
        `getAthleteProfile failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? null
  },

  /**
   * Creates or updates the athlete profile for a user (upsert on user_id).
   * If a profile already exists it is fully merged; otherwise a new row is
   * inserted.
   */
  async saveAthleteProfile(
    userId: string,
    data: CreateAthleteProfileDTO | UpdateAthleteProfileDTO,
  ): Promise<AthleteProfile> {
    const supabase = await createClient()

    // Check whether a profile already exists so we can choose insert vs update.
    const existing = await corpoService.getAthleteProfile(userId)

    let result: AthleteProfile

    if (existing) {
      const { data: updated, error } = await supabase
        .from('athlete_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error || !updated) {
        throw new CorpoServiceError(
          `saveAthleteProfile (update) failed: ${error?.message ?? 'no data'}`,
          error?.code,
        )
      }

      result = updated
    } else {
      const { data: created, error } = await supabase
        .from('athlete_profiles')
        .insert({
          user_id: userId,
          ...data,
        })
        .select()
        .single()

      if (error || !created) {
        throw new CorpoServiceError(
          `saveAthleteProfile (insert) failed: ${error?.message ?? 'no data'}`,
          error?.code,
        )
      }

      result = created
    }

    void auditService.log(
      AUDIT_ACTIONS.ATHLETE_PROFILE_SAVED,
      AUDIT_RESOURCES.ATHLETE_PROFILE,
      result.id,
      { user_id: userId },
    )

    return result
  },

  /**
   * Returns all body segment readings for a given athlete profile.
   */
  async getBodySegments(profileId: string): Promise<BodySegment[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('body_segments')
      .select('*')
      .eq('athlete_profile_id', profileId)
      .order('segment', { ascending: true })

    if (error) {
      throw new CorpoServiceError(
        `getBodySegments failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Replaces all body segment readings for a given athlete profile.
   * Existing rows are deleted before the new batch is inserted so that the
   * caller does not need to track which segments already exist.
   */
  async saveBodySegments(
    profileId: string,
    segments: BodySegmentInput[],
  ): Promise<BodySegment[]> {
    const supabase = await createClient()

    // Delete existing segments for this profile.
    const { error: deleteError } = await supabase
      .from('body_segments')
      .delete()
      .eq('athlete_profile_id', profileId)

    if (deleteError) {
      throw new CorpoServiceError(
        `saveBodySegments (delete) failed: ${deleteError.message}`,
        deleteError.code,
      )
    }

    if (segments.length === 0) return []

    const toInsert = segments.map((s) => ({
      athlete_profile_id: profileId,
      segment: s.segment,
      lean_mass: s.lean_mass ?? null,
      fat_mass: s.fat_mass ?? null,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('body_segments')
      .insert(toInsert)
      .select()

    if (insertError || !inserted) {
      throw new CorpoServiceError(
        `saveBodySegments (insert) failed: ${insertError?.message ?? 'no data'}`,
        insertError?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.BODY_SEGMENTS_SAVED,
      AUDIT_RESOURCES.BODY_SEGMENT,
      profileId,
      { segment_count: segments.length },
    )

    return inserted
  },
}

export default corpoService
