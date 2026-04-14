/**
 * SCANIX BODY – Coach Context (Server-side utility)
 *
 * Reads the `scanix_coach_student` cookie set when a coach enters
 * student-viewing mode, validates the coach-student relationship in the DB,
 * and returns the resolved target user ID.
 *
 * Use in Server Components and API Route handlers.
 *
 * Usage:
 *   const { targetUserId, coachStudent } = await resolveCoachContext(currentUserId)
 *   // Use targetUserId for all Supabase queries in that page.
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { CoachViewingStudent } from '@/types/domain.types'

export const COACH_COOKIE_NAME = 'scanix_coach_student'

export interface CoachContext {
  /** The user ID whose data should be queried (student when in coach mode, else coach) */
  targetUserId: string
  /** Populated when a coach is actively viewing a student */
  coachStudent: CoachViewingStudent | null
  /** TRUE when a coach is actively viewing a student's data */
  isCoachMode: boolean
}

/**
 * Resolves the target user ID for a given authenticated user.
 *
 * If the user is a coach and has a valid `scanix_coach_student` cookie,
 * verifies the coach-student link is active and returns the student's userId.
 * Otherwise, returns the coach's own userId (normal mode).
 */
export async function resolveCoachContext(coachUserId: string): Promise<CoachContext> {
  const cookieStore = await cookies()
  const studentId   = cookieStore.get(COACH_COOKIE_NAME)?.value

  if (!studentId) {
    return { targetUserId: coachUserId, coachStudent: null, isCoachMode: false }
  }

  try {
    const supabase = await createClient()

    // Validate the relationship is still active
    const { data: link } = await supabase
      .from('coach_students')
      .select('student_user_id')
      .eq('coach_user_id', coachUserId)
      .eq('student_user_id', studentId)
      .eq('active', true)
      .maybeSingle()

    if (!link) {
      // Link no longer valid – treat as normal mode
      return { targetUserId: coachUserId, coachStudent: null, isCoachMode: false }
    }

    // Fetch student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', studentId)
      .maybeSingle()

    const coachStudent: CoachViewingStudent = {
      userId:    studentId,
      fullName:  profile?.full_name  ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    }

    return { targetUserId: studentId, coachStudent, isCoachMode: true }
  } catch {
    // On any error, fall back to normal mode
    return { targetUserId: coachUserId, coachStudent: null, isCoachMode: false }
  }
}

/**
 * Cookie configuration used when setting / deleting the coach cookie.
 * httpOnly prevents client-side JS from tampering with it.
 */
export const COACH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  // Do not set maxAge – session cookie; cleared when browser closes or coach
  // explicitly exits coach mode.
}
