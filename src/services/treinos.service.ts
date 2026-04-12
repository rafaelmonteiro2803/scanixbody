/**
 * SCANIX BODY – Treinos (Workout) Service
 *
 * Manages workout days, exercises, session logging, history retrieval, and
 * personal-record tracking.  All operations use the server-side Supabase
 * client and are designed for Server Actions / Route Handlers.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
import type {
  WorkoutDaysRow,
  WorkoutExercisesRow,
  WorkoutSessionsRow,
  WorkoutSessionExercisesRow,
  WorkoutSessionSetsRow,
} from '@/types/database.types'
import type {
  CreateWorkoutDayDTO,
  UpdateWorkoutDayDTO,
  CreateExerciseDTO,
  UpdateExerciseDTO,
  LogSessionDTO,
} from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type WorkoutDay = WorkoutDaysRow
export type Exercise = WorkoutExercisesRow
export type WorkoutSession = WorkoutSessionsRow

export interface WorkoutSessionDetail extends WorkoutSessionsRow {
  workout_day: Pick<WorkoutDaysRow, 'id' | 'name' | 'muscle_groups'> | null
  exercises: Array<
    WorkoutSessionExercisesRow & {
      sets: WorkoutSessionSetsRow[]
    }
  >
}

export interface BestLift {
  exercise_name: string
  weight: number
  reps: number
  session_date: string
  session_id: string
}

export interface ProgressPoint {
  date: string
  weight: number
  reps: number
  volume: number
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

class TreinosServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'TreinosServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const treinosService = {
  // ── Workout Days ──────────────────────────────────────────────────────────

  /**
   * Returns all non-deleted workout days for a user, ordered by `order_index`.
   */
  async getWorkoutDays(userId: string): Promise<WorkoutDay[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workout_days')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('order_index', { ascending: true })

    if (error) {
      throw new TreinosServiceError(
        `getWorkoutDays failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Creates a new workout day for a user.
   * Automatically assigns `order_index` as max + 1 if not supplied.
   */
  async createWorkoutDay(
    userId: string,
    data: CreateWorkoutDayDTO,
  ): Promise<WorkoutDay> {
    const supabase = await createClient()

    // Determine next order_index if not provided.
    let orderIndex = data.order_index
    if (orderIndex === undefined) {
      const { data: existing } = await supabase
        .from('workout_days')
        .select('order_index')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      orderIndex = existing ? existing.order_index + 1 : 0
    }

    const { data: created, error } = await supabase
      .from('workout_days')
      .insert({
        user_id: userId,
        name: data.name,
        muscle_groups: data.muscle_groups,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (error || !created) {
      throw new TreinosServiceError(
        `createWorkoutDay failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.WORKOUT_DAY_CREATED,
      AUDIT_RESOURCES.WORKOUT_DAY,
      created.id,
      { name: created.name },
    )

    return created
  },

  /**
   * Updates an existing workout day (partial update).
   */
  async updateWorkoutDay(
    id: string,
    data: UpdateWorkoutDayDTO,
  ): Promise<WorkoutDay> {
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('workout_days')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      throw new TreinosServiceError(
        `updateWorkoutDay failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.WORKOUT_DAY_UPDATED,
      AUDIT_RESOURCES.WORKOUT_DAY,
      id,
      data,
    )

    return updated
  },

  /**
   * Soft-deletes a workout day by setting `deleted_at`.
   */
  async deleteWorkoutDay(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('workout_days')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new TreinosServiceError(
        `deleteWorkoutDay failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.WORKOUT_DAY_DELETED,
      AUDIT_RESOURCES.WORKOUT_DAY,
      id,
    )
  },

  // ── Exercises ─────────────────────────────────────────────────────────────

  /**
   * Returns all non-deleted exercises for a given workout day.
   */
  async getExercises(workoutDayId: string): Promise<Exercise[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_day_id', workoutDayId)
      .is('deleted_at', null)
      .order('order_index', { ascending: true })

    if (error) {
      throw new TreinosServiceError(
        `getExercises failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Creates a new exercise within a workout day.
   */
  async createExercise(data: CreateExerciseDTO): Promise<Exercise> {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new TreinosServiceError('Not authenticated', 'not_authenticated')
    }

    // Resolve order_index.
    let orderIndex = data.order_index
    if (orderIndex === undefined) {
      const { data: existing } = await supabase
        .from('workout_exercises')
        .select('order_index')
        .eq('workout_day_id', data.workout_day_id)
        .is('deleted_at', null)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      orderIndex = existing ? existing.order_index + 1 : 0
    }

    const { data: created, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_day_id: data.workout_day_id,
        user_id: user.id,
        name: data.name,
        sets: data.sets,
        target_reps: data.target_reps ?? null,
        load: data.load ?? null,
        rest_seconds: data.rest_seconds ?? null,
        order_index: orderIndex,
        notes: data.notes ?? null,
      })
      .select()
      .single()

    if (error || !created) {
      throw new TreinosServiceError(
        `createExercise failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    return created
  },

  /**
   * Partially updates an exercise.
   */
  async updateExercise(id: string, data: UpdateExerciseDTO): Promise<Exercise> {
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('workout_exercises')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      throw new TreinosServiceError(
        `updateExercise failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    return updated
  },

  /**
   * Soft-deletes an exercise.
   */
  async deleteExercise(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('workout_exercises')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new TreinosServiceError(
        `deleteExercise failed: ${error.message}`,
        error.code,
      )
    }
  },

  // ── Session Logging ───────────────────────────────────────────────────────

  /**
   * Records a completed workout session together with all exercise sets.
   * The operation is performed in two phases:
   *   1. Insert the session header and per-exercise rows.
   *   2. Insert all sets for each exercise.
   */
  async logSession(data: LogSessionDTO): Promise<WorkoutSession> {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new TreinosServiceError('Not authenticated', 'not_authenticated')
    }

    // 1. Create the session header.
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        workout_day_id: data.workout_day_id,
        session_date: data.session_date,
        started_at: data.started_at ?? null,
        finished_at: data.finished_at ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single()

    if (sessionError || !session) {
      throw new TreinosServiceError(
        `logSession – session insert failed: ${sessionError?.message ?? 'no data'}`,
        sessionError?.code,
      )
    }

    // 2. Insert session_exercises and their sets.
    for (const exercise of data.exercises) {
      const { data: sessionExercise, error: exError } = await supabase
        .from('workout_session_exercises')
        .insert({
          session_id: session.id,
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          order_index: exercise.order_index,
        })
        .select()
        .single()

      if (exError || !sessionExercise) {
        throw new TreinosServiceError(
          `logSession – exercise insert failed: ${exError?.message ?? 'no data'}`,
          exError?.code,
        )
      }

      if (exercise.sets.length > 0) {
        const setsToInsert = exercise.sets.map((s) => ({
          session_exercise_id: sessionExercise.id,
          set_number: s.set_number,
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          is_pr: s.is_pr ?? false,
        }))

        const { error: setsError } = await supabase
          .from('workout_session_sets')
          .insert(setsToInsert)

        if (setsError) {
          throw new TreinosServiceError(
            `logSession – sets insert failed: ${setsError.message}`,
            setsError.code,
          )
        }
      }
    }

    void auditService.log(
      AUDIT_ACTIONS.WORKOUT_SESSION_LOGGED,
      AUDIT_RESOURCES.WORKOUT_SESSION,
      session.id,
      {
        workout_day_id: data.workout_day_id,
        session_date: data.session_date,
        exercise_count: data.exercises.length,
      },
    )

    return session
  },

  /**
   * Returns the most recent workout sessions for a user.
   */
  async getSessionHistory(
    userId: string,
    limit = 20,
  ): Promise<WorkoutSession[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('session_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new TreinosServiceError(
        `getSessionHistory failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Returns full detail for a single session: the session header, its workout
   * day, every exercise, and every set.
   */
  async getSessionDetail(sessionId: string): Promise<WorkoutSessionDetail> {
    const supabase = await createClient()

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single()

    if (sessionError || !session) {
      throw new TreinosServiceError(
        `getSessionDetail – session not found: ${sessionError?.message ?? 'no data'}`,
        sessionError?.code,
      )
    }

    // Fetch the associated workout day.
    const { data: workoutDay } = await supabase
      .from('workout_days')
      .select('id, name, muscle_groups')
      .eq('id', session.workout_day_id)
      .single()

    // Fetch the session exercises.
    const { data: sessionExercises, error: exError } = await supabase
      .from('workout_session_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true })

    if (exError) {
      throw new TreinosServiceError(
        `getSessionDetail – exercises fetch failed: ${exError.message}`,
        exError.code,
      )
    }

    // Fetch sets for every exercise.
    const exercisesWithSets = await Promise.all(
      (sessionExercises ?? []).map(async (ex: WorkoutSessionExercisesRow) => {
        const { data: sets } = await supabase
          .from('workout_session_sets')
          .select('*')
          .eq('session_exercise_id', ex.id)
          .order('set_number', { ascending: true })

        return { ...ex, sets: sets ?? [] }
      }),
    )

    return {
      ...session,
      workout_day: workoutDay ?? null,
      exercises: exercisesWithSets,
    }
  },

  /**
   * Soft-deletes a workout session by setting `deleted_at`.
   */
  async deleteSession(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('workout_sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new TreinosServiceError(
        `deleteSession failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.WORKOUT_SESSION_DELETED,
      AUDIT_RESOURCES.WORKOUT_SESSION,
      id,
    )
  },

  // ── PR / Progress ─────────────────────────────────────────────────────────

  /**
   * Returns the heaviest lift on record for a given user + exercise name.
   * Ties are broken by `reps` (more reps wins), then recency.
   */
  async getBestLift(
    userId: string,
    exerciseName: string,
  ): Promise<BestLift | null> {
    const supabase = await createClient()

    // Join: workout_session_sets → workout_session_exercises → workout_sessions
    // to filter by user_id and exercise_name.
    const { data, error } = await supabase
      .from('workout_session_sets')
      .select(
        `
        weight,
        reps,
        workout_session_exercises!inner (
          exercise_name,
          workout_sessions!inner (
            id,
            user_id,
            session_date
          )
        )
      `,
      )
      .eq(
        'workout_session_exercises.workout_sessions.user_id',
        userId,
      )
      .eq('workout_session_exercises.exercise_name', exerciseName)
      .not('weight', 'is', null)
      .order('weight', { ascending: false })
      .order('reps', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    const sessionExercise = data.workout_session_exercises as unknown as {
      exercise_name: string
      workout_sessions: { id: string; user_id: string; session_date: string }
    }

    return {
      exercise_name: exerciseName,
      weight: data.weight as number,
      reps: data.reps as number,
      session_date: sessionExercise.workout_sessions.session_date,
      session_id: sessionExercise.workout_sessions.id,
    }
  },

  /**
   * Returns time-series progress data for a specific exercise (best set per
   * session, ordered by date ascending).
   */
  async getExerciseProgress(
    userId: string,
    exerciseName: string,
  ): Promise<ProgressPoint[]> {
    const supabase = await createClient()

    // Fetch all sessions that include this exercise.
    const { data: sessionExercises, error } = await supabase
      .from('workout_session_exercises')
      .select(
        `
        id,
        exercise_name,
        workout_sessions!inner (
          id,
          user_id,
          session_date
        )
      `,
      )
      .eq('exercise_name', exerciseName)
      .eq('workout_sessions.user_id', userId)
      .order('workout_sessions.session_date', { ascending: true })

    if (error) {
      throw new TreinosServiceError(
        `getExerciseProgress failed: ${error.message}`,
        error.code,
      )
    }

    if (!sessionExercises || sessionExercises.length === 0) return []

    // For each session_exercise, find the best set (highest weight × reps).
    interface SessionExerciseJoinRow {
      id: string
      exercise_name: string
      workout_sessions: {
        id: string
        user_id: string
        session_date: string
      }
    }

    const points = await Promise.all(
      (sessionExercises as unknown as SessionExerciseJoinRow[]).map(async (se) => {
        const { data: sets } = await supabase
          .from('workout_session_sets')
          .select('weight, reps')
          .eq('session_exercise_id', se.id)
          .not('weight', 'is', null)
          .not('reps', 'is', null)
          .order('weight', { ascending: false })
          .limit(1)

        if (!sets || sets.length === 0) return null

        const best = sets[0]
        const session = se.workout_sessions

        return {
          date: session.session_date,
          weight: best.weight as number,
          reps: best.reps as number,
          volume: (best.weight as number) * (best.reps as number),
        } satisfies ProgressPoint
      }),
    )

    return points.filter((p): p is ProgressPoint => p !== null)
  },
}

export default treinosService
