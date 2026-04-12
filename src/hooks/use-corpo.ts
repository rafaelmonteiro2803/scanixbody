'use client'

/**
 * SCANIX BODY – useCorpo hook
 *
 * Fetches and saves the authenticated athlete's body composition profile.
 * Runs domain calculations client-side so they are always in sync with
 * the persisted profile data.
 *
 * Returns:
 *   profile      – raw AthleteProfilesRow (or null if not yet created)
 *   segments     – BodySegmentsRow[] for the current profile
 *   calculations – derived metrics: bmi, bmiClass, bmr, tdee, idealWeight,
 *                  bodyState, dailyWater
 *   loading      – true during any in-flight request
 *   error        – last error message, or null
 *   save         – upserts the profile (and optional segments) via PUT /api/v1/corpo
 *   refresh      – re-fetches the profile from the API
 */

import { useState, useEffect, useCallback } from 'react'
import {
  calculateBMI,
  classifyBMI,
  calculateBMR,
  calculateTDEE,
  calculateIdealWeight,
  calculateDailyWater,
  readBodyState,
} from '@/domain/body-calculations'
import type { AthleteProfilesRow, BodySegmentsRow } from '@/types/database.types'
import type { ActivityLevel, Sex } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BodyCalculations {
  bmi: number | null
  bmiClass: string | null
  bmr: number | null
  tdee: number | null
  idealWeight: number | null
  bodyState: string
  dailyWater: number | null
}

export interface UseCorpoReturn {
  profile: AthleteProfilesRow | null
  segments: BodySegmentsRow[]
  calculations: BodyCalculations
  loading: boolean
  error: string | null
  save: (data: Record<string, unknown>) => Promise<AthleteProfilesRow>
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Calculation helpers
// ---------------------------------------------------------------------------

function deriveCalculations(
  profile: AthleteProfilesRow | null,
): BodyCalculations {
  if (!profile) {
    return {
      bmi: null,
      bmiClass: null,
      bmr: null,
      tdee: null,
      idealWeight: null,
      bodyState: 'Perfil sem dados suficientes para descrição.',
      dailyWater: null,
    }
  }

  let bmi: number | null = profile.bmi ?? null
  let bmiClass: string | null = null
  let bmr: number | null = profile.bmr ?? null
  let tdee: number | null = profile.tdee ?? null
  let idealWeight: number | null = profile.ideal_weight ?? null
  let dailyWater: number | null = profile.water_per_day ?? null

  try {
    if (profile.weight && profile.height) {
      bmi = bmi ?? calculateBMI(profile.weight, profile.height)
    }
    if (bmi) {
      bmiClass = classifyBMI(bmi)
    }
    if (profile.weight && profile.height && profile.age && profile.sex) {
      bmr = bmr ?? calculateBMR(
        profile.weight,
        profile.height,
        profile.age,
        profile.sex as Sex,
      )
    }
    if (bmr && profile.activity_level) {
      tdee = tdee ?? calculateTDEE(bmr, profile.activity_level as ActivityLevel)
    }
    if (profile.height && profile.sex) {
      idealWeight = idealWeight ?? calculateIdealWeight(
        profile.height,
        profile.sex as Sex,
      )
    }
    if (profile.weight && !dailyWater) {
      dailyWater = calculateDailyWater(profile.weight)
    }
  } catch {
    // Silently ignore range errors from domain functions (e.g. negative values)
  }

  return {
    bmi,
    bmiClass,
    bmr,
    tdee,
    idealWeight,
    bodyState: readBodyState(profile),
    dailyWater,
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCorpo(): UseCorpoReturn {
  const [profile, setProfile] = useState<AthleteProfilesRow | null>(null)
  const [segments, setSegments] = useState<BodySegmentsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch profile + segments ─────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/corpo')
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Erro ao buscar perfil corporal')
        return
      }

      setProfile(json.data?.profile ?? null)
      setSegments(json.data?.segments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  // ── Save profile ─────────────────────────────────────────────────────────

  const save = useCallback(
    async (data: Record<string, unknown>): Promise<AthleteProfilesRow> => {
      const res = await fetch('/api/v1/corpo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao salvar perfil corporal')
      }

      // Re-fetch to get fresh data with segments
      await fetchProfile()
      return json.data?.profile as AthleteProfilesRow
    },
    [fetchProfile],
  )

  return {
    profile,
    segments,
    calculations: deriveCalculations(profile),
    loading,
    error,
    save,
    refresh: fetchProfile,
  }
}

export default useCorpo
