import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLES } from '@/lib/constants'
import type { UserRole } from '@/types/database.types'
import AdminSubNav from './_components/AdminSubNav'

// ── Admin Route Group Layout ──────────────────────────────────────────────────
//
// Guards the /admin/* subtree: only super_admin and admin roles are allowed.
// Renders an "ADMINISTRAÇÃO" breadcrumb header and admin sub-navigation tabs.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .single()

  const profile = profileData as { role: UserRole; full_name: string | null } | null
  const role = profile?.role ?? ('usuario_final' as UserRole)

  if (!ADMIN_ROLES.has(role)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin section header */}
      <div className="border-b border-border-subtle bg-background">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-3 text-xs">
            <Link
              href="/dashboard"
              className="text-text-muted hover:text-[#00ff88] transition-colors duration-150"
            >
              Dashboard
            </Link>
            <span className="text-text-faint">/</span>
            <span className="text-[#00ff88] font-semibold tracking-widest uppercase text-[10px]">
              Administração
            </span>
          </div>

          {/* Page title */}
          <div className="flex items-center justify-between pb-4">
            <div>
              <h1 className="text-xl font-black tracking-[0.2em] text-text-title uppercase">
                ADMINISTRAÇÃO
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Painel de controle do sistema
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[#00ff88] text-xs font-semibold tracking-wider">
                {role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
              </span>
            </div>
          </div>

          {/* Sub-navigation tabs (client component for usePathname) */}
          <AdminSubNav />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}
