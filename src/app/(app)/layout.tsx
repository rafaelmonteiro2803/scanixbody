import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/layout/AppLayout'
import { resolveCoachContext } from '@/lib/coach-context'
import type { UserRole } from '@/types/database.types'

// ── App Route Group Layout ────────────────────────────────────────────────────
//
// This layout wraps every /(app)/* route. It:
//   1. Validates the server-side session — unauthenticated users are redirected
//      to /login.
//   2. Fetches the user profile to pass display data to the shell.
//   3. For coaches: reads the scanix_coach_student cookie, validates the
//      coach-student relationship and passes the student info to AppLayout.
//   4. Renders the full app shell (sidebar + top bar + content area) via
//      <AppLayout />, which is a Client Component that handles interactivity.

export default async function AppRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Server-side session guard
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for shell personalisation (name, avatar, role, theme)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, status, theme')
    .eq('user_id', user.id)
    .single()

  const profile = profileData as {
    full_name: string | null
    avatar_url: string | null
    role: UserRole
    status: string
    theme: string | null
  } | null

  // Guard: first_access users must complete onboarding
  if (profile?.status === 'first_access') {
    redirect('/primeiro-acesso')
  }

  // For coaches: check if they have an active student-viewing cookie
  // (non-coaches will always get null back from resolveCoachContext)
  const isCoach = profile?.role === 'coach'
  const coachCtx = isCoach
    ? await resolveCoachContext(user.id)
    : { coachStudent: null, isCoachMode: false }

  return (
    <AppLayout
      user={{
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        role: profile?.role ?? 'usuario_final',
      }}
      initialTheme={(profile?.theme === 'light' ? 'light' : 'dark')}
      coachStudent={coachCtx.coachStudent}
    >
      {children}
    </AppLayout>
  )
}
