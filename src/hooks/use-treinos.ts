'use client'

/**
 * SCANIX BODY – useTreinos hook
 *
 * Provides client-side access to the authenticated user's workout days and
 * their exercises.  Wraps the treinos API routes with loading + error state.
 *
 * Returns:
 *   days          – WorkoutDay[] with nested exercises
 *   loading       – true during any in-flight request
 *   error         – last error message, or null
 *   refresh       – re-fetches all workout days
 *   createDay     – creates a new workout day
 *   updateDay     – partially updates a workout day
 *   deleteDay     – soft-deletes a workout day
 *   addExercise   – adds an exercise to a day
 *   updateExercise– partially updates an exercise
 *   deleteExercise– soft-deletes an exercise
 */

import { useState, useEffect, useCallback } from 'react'
import type { WorkoutDaysRow, WorkoutExercisesRow } from '@/types/database.types'
import type {
  CreateWorkoutDayDTO,
  UpdateWorkoutDayDTO,
  CreateExerciseDTO,
  UpdateExerciseDTO,
} from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkoutDayWithExercises extends WorkoutDaysRow {
  exercises: WorkoutExercisesRow[]
}

export interface UseTreinosReturn {
  days: WorkoutDayWithExercises[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createDay: (data: CreateWorkoutDayDTO) => Promise<WorkoutDaysRow>
  updateDay: (id: string, data: UpdateWorkoutDayDTO) => Promise<WorkoutDaysRow>
  deleteDay: (id: string) => Promise<void>
  addExercise: (data: CreateExerciseDTO) => Promise<WorkoutExercisesRow>
  updateExercise: (id: string, data: UpdateExerciseDTO) => Promise<WorkoutExercisesRow>
  deleteExercise: (id: string) => Promise<void>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTreinos(): UseTreinosReturn {
  const [days, setDays] = useState<WorkoutDayWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch all workout days (with exercises) ──────────────────────────────

  const fetchDays = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/treinos')
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Erro ao buscar treinos')
        return
      }

      setDays(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDays()
  }, [fetchDays])

  // ── Create workout day ───────────────────────────────────────────────────

  const createDay = useCallback(
    async (data: CreateWorkoutDayDTO): Promise<WorkoutDaysRow> => {
      const res = await fetch('/api/v1/treinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          muscleGroups: data.muscle_groups,
          orderIndex: data.order_index,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao criar treino')
      }

      await fetchDays()
      return json.data as WorkoutDaysRow
    },
    [fetchDays],
  )

  // ── Update workout day ───────────────────────────────────────────────────

  const updateDay = useCallback(
    async (id: string, data: UpdateWorkoutDayDTO): Promise<WorkoutDaysRow> => {
      const res = await fetch(`/api/v1/treinos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          muscleGroups: data.muscle_groups,
          orderIndex: data.order_index,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao atualizar treino')
      }

      await fetchDays()
      return json.data as WorkoutDaysRow
    },
    [fetchDays],
  )

  // ── Delete workout day ───────────────────────────────────────────────────

  const deleteDay = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/v1/treinos/${id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao excluir treino')
      }

      await fetchDays()
    },
    [fetchDays],
  )

  // ── Add exercise ──────────────────────────────────────────────────────────

  const addExercise = useCallback(
    async (data: CreateExerciseDTO): Promise<WorkoutExercisesRow> => {
      const res = await fetch('/api/v1/treinos/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutDayId: data.workout_day_id,
          name: data.name,
          sets: data.sets,
          targetReps: data.target_reps,
          load: data.load,
          restSeconds: data.rest_seconds,
          orderIndex: data.order_index,
          notes: data.notes,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao adicionar exercício')
      }

      await fetchDays()
      return json.data as WorkoutExercisesRow
    },
    [fetchDays],
  )

  // ── Update exercise ───────────────────────────────────────────────────────

  const updateExercise = useCallback(
    async (id: string, data: UpdateExerciseDTO): Promise<WorkoutExercisesRow> => {
      const res = await fetch(`/api/v1/treinos/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          sets: data.sets,
          targetReps: data.target_reps,
          load: data.load,
          restSeconds: data.rest_seconds,
          orderIndex: data.order_index,
          notes: data.notes,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao atualizar exercício')
      }

      await fetchDays()
      return json.data as WorkoutExercisesRow
    },
    [fetchDays],
  )

  // ── Delete exercise ───────────────────────────────────────────────────────

  const deleteExercise = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/v1/treinos/exercises/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao excluir exercício')
      }

      await fetchDays()
    },
    [fetchDays],
  )

  return {
    days,
    loading,
    error,
    refresh: fetchDays,
    createDay,
    updateDay,
    deleteDay,
    addExercise,
    updateExercise,
    deleteExercise,
  }
}

export default useTreinos
