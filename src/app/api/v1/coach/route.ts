/**
 * SCANIX BODY – Coach Mode API Route
 *
 * POST /api/v1/coach  → Enter coach mode (set httpOnly cookie for a student)
 * DELETE /api/v1/coach → Exit coach mode (clear the cookie)
 *
 * The cookie is read server-side in (app)/layout.tsx to personalise the shell.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { COACH_COOKIE_NAME, COACH_COOKIE_OPTIONS } from '@/lib/coach-context'

// ── POST — enter coach mode ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Role check: only coaches may enter coach mode
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas coaches podem usar este recurso.' },
      { status: 403 },
    )
  }

  // Parse body
  let body: { student_user_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const { student_user_id } = body
  if (!student_user_id || typeof student_user_id !== 'string') {
    return NextResponse.json({ error: 'student_user_id é obrigatório' }, { status: 400 })
  }

  // Validate coach-student relationship
  const { data: link } = await supabase
    .from('coach_students')
    .select('student_user_id')
    .eq('coach_user_id', user.id)
    .eq('student_user_id', student_user_id)
    .eq('active', true)
    .maybeSingle()

  if (!link) {
    return NextResponse.json(
      { error: 'Aluno não encontrado ou não vinculado a este coach.' },
      { status: 404 },
    )
  }

  // Fetch student profile for the response
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', student_user_id)
    .maybeSingle()

  const student = {
    userId:    student_user_id,
    fullName:  studentProfile?.full_name  ?? null,
    avatarUrl: studentProfile?.avatar_url ?? null,
  }

  // Set httpOnly cookie
  const response = NextResponse.json({ data: student }, { status: 200 })
  response.cookies.set(COACH_COOKIE_NAME, student_user_id, COACH_COOKIE_OPTIONS)
  return response
}

// ── DELETE — exit coach mode ──────────────────────────────────────────────────

export async function DELETE() {
  const response = NextResponse.json({ data: null }, { status: 200 })
  response.cookies.delete(COACH_COOKIE_NAME)
  return response
}
