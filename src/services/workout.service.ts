'use client'

/**
 * SCANIX BODY – Workout Service (Client-side)
 *
 * Handles all Supabase interactions for workout_days, workout_exercises,
 * workout_sessions, workout_session_exercises, and workout_session_sets.
 *
 * All methods return { data, error } so callers can handle errors gracefully.
 */

import { createClient } from '@/lib/supabase/client'
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
// Extended types used by the UI layer
// ---------------------------------------------------------------------------

export interface WorkoutDayWithExercises extends WorkoutDaysRow {
  exercises: WorkoutExercisesRow[]
}

export interface SessionWithDetails extends WorkoutSessionsRow {
  workout_day_name: string
  exercises: Array<
    WorkoutSessionExercisesRow & { sets: WorkoutSessionSetsRow[] }
  >
}

// ---------------------------------------------------------------------------
// Workout Days
// ---------------------------------------------------------------------------

export const workoutDayService = {
  async list(): Promise<{ data: WorkoutDayWithExercises[]; error: string | null }> {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: [], error: 'Usuário não autenticado' }
    }

    const { data: days, error: daysError } = await supabase
      .from('workout_days')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('order_index', { ascending: true })

    if (daysError) {
      return { data: [], error: daysError.message }
    }

    if (!days || days.length === 0) {
      return { data: [], error: null }
    }

    const dayIds = days.map((d) => d.id)
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('*')
      .in('workout_day_id', dayIds)
      .is('deleted_at', null)
      .order('order_index', { ascending: true })

    if (exercisesError) {
      return { data: [], error: exercisesError.message }
    }

    const exercisesByDay = (exercises ?? []).reduce<
      Record<string, WorkoutExercisesRow[]>
    >((acc, ex) => {
      if (!acc[ex.workout_day_id]) acc[ex.workout_day_id] = []
      acc[ex.workout_day_id].push(ex)
      return acc
    }, {})

    const result: WorkoutDayWithExercises[] = days.map((day) => ({
      ...day,
      exercises: exercisesByDay[day.id] ?? [],
    }))

    return { data: result, error: null }
  },

  async create(
    dto: CreateWorkoutDayDTO,
  ): Promise<{ data: WorkoutDaysRow | null; error: string | null }> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'Usuário não autenticado' }

    // Determine next order_index
    const { data: existing } = await supabase
      .from('workout_days')
      .select('order_index')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextIndex = (existing?.order_index ?? -1) + 1

    const { data, error } = await supabase
      .from('workout_days')
      .insert({
        user_id: user.id,
        name: dto.name,
        muscle_groups: dto.muscle_groups,
        order_index: dto.order_index ?? nextIndex,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  },

  async update(
    id: string,
    dto: UpdateWorkoutDayDTO,
  ): Promise<{ data: WorkoutDaysRow | null; error: string | null }> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workout_days')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const supabase = createClient()
    const { error } = await supabase
      .from('workout_days')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    return { error: null }
  },
}

// ---------------------------------------------------------------------------
// Workout Exercises
// ---------------------------------------------------------------------------

export const workoutExerciseService = {
  async create(
    dto: CreateExerciseDTO,
  ): Promise<{ data: WorkoutExercisesRow | null; error: string | null }> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'Usuário não autenticado' }

    // Determine next order_index for this day
    const { data: existing } = await supabase
      .from('workout_exercises')
      .select('order_index')
      .eq('workout_day_id', dto.workout_day_id)
      .is('deleted_at', null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextIndex = (existing?.order_index ?? -1) + 1

    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_day_id: dto.workout_day_id,
        user_id: user.id,
        name: dto.name,
        sets: dto.sets,
        target_reps: dto.target_reps ?? null,
        load: dto.load ?? null,
        rest_seconds: dto.rest_seconds ?? null,
        order_index: dto.order_index ?? nextIndex,
        notes: dto.notes ?? null,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  },

  async update(
    id: string,
    dto: UpdateExerciseDTO,
  ): Promise<{ data: WorkoutExercisesRow | null; error: string | null }> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workout_exercises')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const supabase = createClient()
    const { error } = await supabase
      .from('workout_exercises')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    return { error: null }
  },
}

// ---------------------------------------------------------------------------
// Workout Sessions
// ---------------------------------------------------------------------------

export const workoutSessionService = {
  async list(): Promise<{ data: SessionWithDetails[]; error: string | null }> {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: [], error: 'Usuário não autenticado' }
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('session_date', { ascending: false })

    if (sessionsError) return { data: [], error: sessionsError.message }
    if (!sessions || sessions.length === 0) return { data: [], error: null }

    const sessionIds = sessions.map((s) => s.id)
    const dayIds = [...new Set(sessions.map((s) => s.workout_day_id))]

    // Fetch day names
    const { data: days } = await supabase
      .from('workout_days')
      .select('id, name')
      .in('id', dayIds)

    const dayNameMap: Record<string, string> = {}
    ;(days ?? []).forEach((d) => {
      dayNameMap[d.id] = d.name
    })

    // Fetch session exercises
    const { data: sessionExercises, error: seError } = await supabase
      .from('workout_session_exercises')
      .select('*')
      .in('session_id', sessionIds)
      .order('order_index', { ascending: true })

    if (seError) return { data: [], error: seError.message }

    const seIds = (sessionExercises ?? []).map((se) => se.id)

    // Fetch sets
    const { data: sets, error: setsError } =
      seIds.length > 0
        ? await supabase
            .from('workout_session_sets')
            .select('*')
            .in('session_exercise_id', seIds)
            .order('set_number', { ascending: true })
        : { data: [], error: null }

    if (setsError) return { data: [], error: setsError.message }

    const setsBySE: Record<string, WorkoutSessionSetsRow[]> = {}
    ;(sets ?? []).forEach((s) => {
      if (!setsBySE[s.session_exercise_id])
        setsBySE[s.session_exercise_id] = []
      setsBySE[s.session_exercise_id].push(s)
    })

    const exercisesBySession: Record<
      string,
      Array<WorkoutSessionExercisesRow & { sets: WorkoutSessionSetsRow[] }>
    > = {}
    ;(sessionExercises ?? []).forEach((se) => {
      if (!exercisesBySession[se.session_id])
        exercisesBySession[se.session_id] = []
      exercisesBySession[se.session_id].push({
        ...se,
        sets: setsBySE[se.id] ?? [],
      })
    })

    const result: SessionWithDetails[] = sessions.map((s) => ({
      ...s,
      workout_day_name: dayNameMap[s.workout_day_id] ?? 'Treino',
      exercises: exercisesBySession[s.id] ?? [],
    }))

    return { data: result, error: null }
  },

  async log(
    dto: LogSessionDTO,
  ): Promise<{ data: WorkoutSessionsRow | null; error: string | null }> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'Usuário não autenticado' }

    // 1. Insert session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        workout_day_id: dto.workout_day_id,
        session_date: dto.session_date,
        started_at: dto.started_at ?? null,
        finished_at: dto.finished_at ?? null,
        notes: dto.notes ?? null,
      })
      .select()
      .single()

    if (sessionError || !session) {
      return { data: null, error: sessionError?.message ?? 'Erro ao salvar sessão' }
    }

    // 2. Insert session exercises + sets
    for (const exercise of dto.exercises) {
      const { data: se, error: seError } = await supabase
        .from('workout_session_exercises')
        .insert({
          session_id: session.id,
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          order_index: exercise.order_index,
        })
        .select()
        .single()

      if (seError || !se) continue

      const setsToInsert = exercise.sets.map((s) => ({
        session_exercise_id: se.id,
        set_number: s.set_number,
        weight: s.weight ?? null,
        reps: s.reps ?? null,
        is_pr: s.is_pr ?? false,
      }))

      if (setsToInsert.length > 0) {
        await supabase.from('workout_session_sets').insert(setsToInsert)
      }
    }

    return { data: session, error: null }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const supabase = createClient()
    const { error } = await supabase
      .from('workout_sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    return { error: null }
  },

  /**
   * Returns best set per exercise_id from all sessions.
   * Used for PR detection during session logging.
   */
  async getBestSetsForExercise(
    exerciseId: string,
  ): Promise<{ data: WorkoutSessionSetsRow[]; error: string | null }> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: [], error: null }

    // Get all session_exercise entries for this exercise
    const { data: ses } = await supabase
      .from('workout_session_exercises')
      .select('id')
      .eq('exercise_id', exerciseId)

    if (!ses || ses.length === 0) return { data: [], error: null }

    const seIds = ses.map((s) => s.id)

    const { data: sets, error } = await supabase
      .from('workout_session_sets')
      .select('*')
      .in('session_exercise_id', seIds)
      .order('weight', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: sets ?? [], error: null }
  },

  /**
   * Fetches all exercise history for the progress chart.
   */
  async getExerciseProgressData(): Promise<{
    data: Array<{
      session_date: string
      exercise_name: string
      exercise_id: string
      sets: Array<{ set_number: number; weight: number; reps: number }>
    }>
    error: string | null
  }> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: [], error: null }

    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select('id, session_date')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('session_date', { ascending: true })

    if (sessionsError) return { data: [], error: sessionsError.message }
    if (!sessions || sessions.length === 0) return { data: [], error: null }

    const sessionIds = sessions.map((s) => s.id)
    const sessionDateMap: Record<string, string> = {}
    sessions.forEach((s) => {
      sessionDateMap[s.id] = s.session_date
    })

    const { data: ses, error: seError } = await supabase
      .from('workout_session_exercises')
      .select('id, session_id, exercise_id, exercise_name')
      .in('session_id', sessionIds)

    if (seError) return { data: [], error: seError.message }
    if (!ses || ses.length === 0) return { data: [], error: null }

    const seIds = ses.map((s) => s.id)
    const { data: sets, error: setsError } = await supabase
      .from('workout_session_sets')
      .select('*')
      .in('session_exercise_id', seIds)

    if (setsError) return { data: [], error: setsError.message }

    const setsBySE: Record<
      string,
      Array<{ set_number: number; weight: number; reps: number }>
    > = {}
    ;(sets ?? []).forEach((s) => {
      if (!setsBySE[s.session_exercise_id]) setsBySE[s.session_exercise_id] = []
      setsBySE[s.session_exercise_id].push({
        set_number: s.set_number,
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
      })
    })

    const result = ses.map((se) => ({
      session_date: sessionDateMap[se.session_id] ?? '',
      exercise_name: se.exercise_name,
      exercise_id: se.exercise_id,
      sets: setsBySE[se.id] ?? [],
    }))

    return { data: result, error: null }
  },
}
