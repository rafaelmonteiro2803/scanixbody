/**
 * SCANIX BODY – Workout & Training Calculation Functions
 *
 * All functions are pure (no side-effects, no I/O).
 * They operate on domain types imported from `@/types/domain.types`.
 *
 * @module workout-calculations
 */

import type {
  WorkoutSet,
  ExerciseHistory,
  ChartDataPoint,
} from '@/types/domain.types';
import type {
  WorkoutSessionsRow,
  WorkoutDaysRow,
} from '@/types/database.types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns zero when a value is `null | undefined | NaN`.
 * @internal
 */
function safeNum(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return value;
}

// ---------------------------------------------------------------------------
// Volume calculations
// ---------------------------------------------------------------------------

/**
 * Calculates the total lifting volume for a set of completed sets.
 *
 * Volume = Σ (weight × reps) for every set
 *
 * Sets with missing or zero weight/reps are treated as 0 and do not
 * raise an error – they simply contribute nothing to total volume.
 *
 * @param sets - Array of completed workout sets
 * @returns Total volume in kg (or lbs, matching the `weight` unit used)
 *
 * @example
 * calculateVolume([
 *   { set_number: 1, weight: 100, reps: 5 },
 *   { set_number: 2, weight: 100, reps: 5 },
 *   { set_number: 3, weight: 95,  reps: 6 },
 * ]) // → 1570
 */
export function calculateVolume(sets: WorkoutSet[]): number {
  return sets.reduce(
    (total, set) => total + safeNum(set.weight) * safeNum(set.reps),
    0,
  );
}

/**
 * Calculates the total lifting volume for an entire workout session.
 *
 * Accepts a nested structure where each element represents one exercise
 * with its performed sets.
 *
 * @param exercises - Array of exercise entries, each with a `sets` property
 * @returns Total session volume
 *
 * @example
 * calculateSessionVolume([
 *   { exercise_id: 'abc', exercise_name: 'Bench Press', order_index: 0,
 *     sets: [{ set_number: 1, weight: 80, reps: 8 }] },
 * ]) // → 640
 */
export function calculateSessionVolume(
  exercises: Array<{ sets: WorkoutSet[] }>,
): number {
  return exercises.reduce(
    (total, exercise) => total + calculateVolume(exercise.sets),
    0,
  );
}

// ---------------------------------------------------------------------------
// Personal record detection
// ---------------------------------------------------------------------------

/**
 * Finds the best (heaviest single-set) lift from an array of completed sets.
 * "Best" is determined first by `weight`, then by `reps` as a tiebreaker.
 *
 * @param sets - Array of completed workout sets
 * @returns The set with the highest weight (and reps on tie), or `null` if the
 *          array is empty
 *
 * @example
 * findBestLift([
 *   { set_number: 1, weight: 100, reps: 5 },
 *   { set_number: 2, weight: 105, reps: 3 },
 * ]) // → { set_number: 2, weight: 105, reps: 3 }
 */
export function findBestLift(sets: WorkoutSet[]): WorkoutSet | null {
  if (sets.length === 0) return null;

  return sets.reduce<WorkoutSet>((best, current) => {
    const bestWeight = safeNum(best.weight);
    const currWeight = safeNum(current.weight);

    if (currWeight > bestWeight) return current;
    if (currWeight === bestWeight && safeNum(current.reps) > safeNum(best.reps))
      return current;
    return best;
  }, sets[0]);
}

/**
 * Determines whether a given set constitutes a new Personal Record (PR)
 * relative to the athlete's previous best.
 *
 * A set is a PR when:
 *   1. There is no previous best (first-ever logged set), OR
 *   2. The current weight exceeds the previous best weight, OR
 *   3. The weight is equal but the rep count is higher.
 *
 * @param currentSet   - The set just completed
 * @param previousBest - The athlete's historical best for this exercise,
 *                       or `null` if no history exists
 * @returns `true` if the set is a PR, `false` otherwise
 *
 * @example
 * detectPR(
 *   { set_number: 1, weight: 110, reps: 3 },
 *   { set_number: 1, weight: 105, reps: 5 },
 * ) // → true  (new weight PR)
 */
export function detectPR(
  currentSet: WorkoutSet,
  previousBest: WorkoutSet | null,
): boolean {
  if (!previousBest) return true;

  const currWeight = safeNum(currentSet.weight);
  const prevWeight = safeNum(previousBest.weight);

  if (currWeight > prevWeight) return true;
  if (
    currWeight === prevWeight &&
    safeNum(currentSet.reps) > safeNum(previousBest.reps)
  )
    return true;

  return false;
}

// ---------------------------------------------------------------------------
// Aggregate session statistics
// ---------------------------------------------------------------------------

/**
 * Calculates the total number of sets performed across multiple sessions.
 *
 * @param sessions - Flat array of all sets from one or more sessions
 * @returns Total set count
 *
 * @example
 * calculateTotalSets([
 *   [set1, set2, set3],   // session 1 – 3 sets
 *   [set4, set5],         // session 2 – 2 sets
 * ]) // → 5
 */
export function calculateTotalSets(sessions: WorkoutSet[][]): number {
  return sessions.reduce((total, sessionSets) => total + sessionSets.length, 0);
}

// ---------------------------------------------------------------------------
// Exercise history grouping
// ---------------------------------------------------------------------------

/**
 * Internal representation of one session's data for a single exercise.
 * @internal
 */
interface RawSessionData {
  session_date: string;
  exercise_name: string;
  sets: WorkoutSet[];
}

/**
 * Groups session data by exercise name to build per-exercise history.
 *
 * @param sessions - Flat array of session+exercise+set records
 * @returns Array of `ExerciseHistory` objects, one per unique exercise name,
 *          sorted chronologically within each history entry
 *
 * @example
 * groupSessionsByExercise([
 *   { session_date: '2024-01-01', exercise_name: 'Squat',
 *     sets: [{ set_number: 1, weight: 100, reps: 5 }] },
 *   { session_date: '2024-01-08', exercise_name: 'Squat',
 *     sets: [{ set_number: 1, weight: 105, reps: 5 }] },
 * ])
 * // → [{ exercise_name: 'Squat', sessions: [...] }]
 */
export function groupSessionsByExercise(
  sessions: RawSessionData[],
): ExerciseHistory[] {
  const map = new Map<string, ExerciseHistory>();

  for (const entry of sessions) {
    const { exercise_name, session_date, sets } = entry;

    if (!map.has(exercise_name)) {
      map.set(exercise_name, { exercise_name, sessions: [] });
    }

    const best = findBestLift(sets);
    const history = map.get(exercise_name)!;

    history.sessions.push({
      session_date,
      best_weight: best ? safeNum(best.weight) : 0,
      best_reps: best ? safeNum(best.reps) : 0,
      total_volume: calculateVolume(sets),
    });
  }

  // Sort sessions chronologically within each exercise history
  for (const history of map.values()) {
    history.sessions.sort((a, b) =>
      a.session_date.localeCompare(b.session_date),
    );
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Progression chart data builder
// ---------------------------------------------------------------------------

/**
 * Builds a chart-ready progression dataset from an exercise's history.
 *
 * Each data-point represents the athlete's best single-set weight on a given
 * session date, suitable for rendering in a line/area chart.
 *
 * @param history - An `ExerciseHistory` object for a single exercise
 * @returns Array of `ChartDataPoint` objects, sorted by date ascending
 *
 * @example
 * buildProgressionChart(history)
 * // → [
 * //     { date: '2024-01-01', value: 100, label: '100 kg × 5 reps' },
 * //     { date: '2024-01-08', value: 105, label: '105 kg × 5 reps' },
 * //   ]
 */
export function buildProgressionChart(
  history: ExerciseHistory,
): ChartDataPoint[] {
  return history.sessions.map((session) => ({
    date: session.session_date,
    value: session.best_weight,
    label: `${session.best_weight} kg × ${session.best_reps} reps`,
  }));
}

// ---------------------------------------------------------------------------
// Streak calculations
// ---------------------------------------------------------------------------

/**
 * Returns the ISO year-week key for a given date string ("YYYY-MM-DD").
 * Uses UTC noon to avoid timezone edge-cases around midnight.
 * @internal
 */
function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  // Shift to nearest Thursday (ISO week rule)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Calculates the athlete's current consecutive-week training streak.
 *
 * A week "counts" if it contains at least one recorded session.
 * Counting starts from the current week and walks backward: the streak
 * breaks as soon as a week with no session is found.
 *
 * @param sessionDates - Array of "YYYY-MM-DD" session date strings
 * @param today        - Reference date string "YYYY-MM-DD" (keeps the function pure)
 * @returns Number of consecutive training weeks (≥ 0)
 *
 * @example
 * calculateWeeklyStreak(['2024-04-15', '2024-04-08', '2024-03-31'], '2024-04-20')
 * // → 3  (all three weeks have a session)
 */
export function calculateWeeklyStreak(
  sessionDates: string[],
  today: string,
): number {
  if (sessionDates.length === 0) return 0

  const weekSet = new Set(sessionDates.map(isoWeekKey))

  let streak = 0
  let checkDate = today

  for (let i = 0; i < 104; i++) {
    const key = isoWeekKey(checkDate)
    if (!weekSet.has(key)) break
    streak++
    // Walk back exactly 7 days
    const d = new Date(checkDate + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() - 7)
    checkDate = d.toISOString().slice(0, 10)
  }

  return streak
}

// ---------------------------------------------------------------------------
// High-level aggregate helpers used by the dashboard
// ---------------------------------------------------------------------------

/**
 * Counts how many distinct workout sessions are present in the given period.
 *
 * @param sessions - Array of `WorkoutSessionsRow` records
 * @returns Total number of sessions
 */
export function countSessions(sessions: WorkoutSessionsRow[]): number {
  return sessions.filter((s) => s.deleted_at === null).length;
}

/**
 * Returns the number of unique workout days (templates) the user has created.
 *
 * @param workoutDays - Array of `WorkoutDaysRow` records
 * @returns Count of active (non-deleted) workout days
 */
export function countWorkoutDays(workoutDays: WorkoutDaysRow[]): number {
  return workoutDays.filter((d) => d.deleted_at === null).length;
}

/**
 * Computes the average session duration in minutes for a list of sessions
 * that have both `started_at` and `finished_at` timestamps.
 *
 * @param sessions - Array of `WorkoutSessionsRow` records
 * @returns Average duration in minutes (integer), or `null` if no timed
 *          sessions are present
 *
 * @example
 * averageSessionDurationMinutes(sessions) // → 52
 */
export function averageSessionDurationMinutes(
  sessions: WorkoutSessionsRow[],
): number | null {
  const timed = sessions.filter(
    (s) =>
      s.deleted_at === null &&
      s.started_at !== null &&
      s.finished_at !== null,
  );

  if (timed.length === 0) return null;

  const totalMs = timed.reduce((sum, s) => {
    const start = new Date(s.started_at!).getTime();
    const end = new Date(s.finished_at!).getTime();
    return sum + Math.max(0, end - start);
  }, 0);

  return Math.round(totalMs / timed.length / 60_000);
}
