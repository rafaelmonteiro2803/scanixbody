'use client'

/**
 * SCANIX BODY – Coach Service (Client-side)
 *
 * Handles Supabase interactions for coach-student relationships:
 *   - Listing a coach's assigned students
 *   - Entering / exiting coach-viewing mode (via API route that sets a cookie)
 *
 * Admin operations (create / delete links) are handled server-side
 * in the admin service to bypass RLS with the service-role key.
 */

import { createClient } from '@/lib/supabase/client'
import type { CoachStudentWithProfile, CoachViewingStudent } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CoachStudentsResult {
  data: CoachStudentWithProfile[]
  error: string | null
}

// ---------------------------------------------------------------------------
// Coach service
// ---------------------------------------------------------------------------

export const coachService = {
  /**
   * Returns all active students linked to the currently authenticated coach.
   * Joins the profiles table to include name, avatar, email, and status.
   */
  async getMyStudents(): Promise<CoachStudentsResult> {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: [], error: 'Usuário não autenticado' }
    }

    // Fetch links where this user is the coach
    const { data: links, error: linksError } = await supabase
      .from('coach_students')
      .select('id, user_id, student_user_id, active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (linksError) {
      return { data: [], error: linksError.message }
    }

    if (!links || links.length === 0) {
      return { data: [], error: null }
    }

    // Fetch profiles for all students in a single query
    const studentIds = links.map((l) => l.student_user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, status')
      .in('user_id', studentIds)

    if (profilesError) {
      return { data: [], error: profilesError.message }
    }

    // Fetch emails from auth (profiles don't store email directly in a publicly
    // accessible column, so we pull it from the profiles.email column if present,
    // or fall back to the Supabase auth user email via the profiles join).
    // For now we grab it from profiles.email (added as a column in migration 001).
    const { data: emailProfiles, error: emailError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', studentIds)

    if (emailError) {
      return { data: [], error: emailError.message }
    }

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? [])
    const emailMap   = new Map(emailProfiles?.map((p) => [p.user_id, p.email]) ?? [])

    const result: CoachStudentWithProfile[] = links.map((link) => {
      const profile = profileMap.get(link.student_user_id)
      return {
        ...link,
        student: {
          full_name:  profile?.full_name  ?? null,
          avatar_url: profile?.avatar_url ?? null,
          email:      emailMap.get(link.student_user_id) ?? '',
          status:     (profile?.status as CoachStudentWithProfile['student']['status']) ?? 'active',
        },
      }
    })

    return { data: result, error: null }
  },

  /**
   * Enters coach-viewing mode for the given student.
   * Calls the API route which sets the httpOnly cookie and returns student info.
   */
  async enterCoachMode(studentUserId: string): Promise<{ student: CoachViewingStudent | null; error: string | null }> {
    try {
      const res = await fetch('/api/v1/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_user_id: studentUserId }),
      })
      const json = await res.json()
      if (!res.ok) return { student: null, error: json.error ?? 'Erro ao entrar no modo coach' }
      return { student: json.data as CoachViewingStudent, error: null }
    } catch {
      return { student: null, error: 'Erro de rede ao entrar no modo coach' }
    }
  },

  /**
   * Exits coach-viewing mode by clearing the cookie server-side.
   */
  async exitCoachMode(): Promise<{ error: string | null }> {
    try {
      const res = await fetch('/api/v1/coach', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        return { error: json.error ?? 'Erro ao sair do modo coach' }
      }
      return { error: null }
    } catch {
      return { error: 'Erro de rede ao sair do modo coach' }
    }
  },
}

export default coachService
