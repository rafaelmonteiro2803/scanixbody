import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/layout/AppLayout'
import type { UserRole } from '@/types/database.types'

// ── App Route Group Layout ────────────────────────────────────────────────────
//
// This layout wraps every /(app)/* route. It:
//   1. Validates the server-side session — unauthenticated users are redirected
//      to /login.
//   2. Fetches the user profile to pass display data to the shell.
//   3. Renders the full app shell (sidebar + top bar + content area) via
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

  // Fetch profile for shell personalisation (name, avatar, role)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, status')
    .eq('user_id', user.id)
    .single()

  const profile = profileData as {
    full_name: string | null
    avatar_url: string | null
    role: UserRole
    status: string
  } | null

  // Guard: first_access users must complete onboarding
  // (middleware already handles this, but we defensively guard here too)
  if (profile?.status === 'first_access') {
    redirect('/primeiro-acesso')
  }

  return (
    <AppLayout
      user={{
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        role: profile?.role ?? 'usuario_final',
      }}
    >
      {children}
    </AppLayout>
  )
}
