'use client'

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Activity,
  Brain,
  ClipboardList,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Menu,
  X,
  Zap,
  Sun,
  Moon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database.types'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'

interface AppUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
}

interface AppLayoutProps {
  user: AppUser
  initialTheme?: Theme
  children: React.ReactNode
}

// ── Theme context ─────────────────────────────────────────────────────────────

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

function useTheme() {
  return useContext(ThemeContext)
}

// ── Navigation items ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/treinos',   icon: Dumbbell,        label: 'Treinos' },
  { href: '/dieta',     icon: Utensils,        label: 'Dieta' },
  { href: '/corpo',     icon: Activity,        label: 'Composição' },
  { href: '/analise-ia',icon: Brain,           label: 'Análise IA' },
  { href: '/exames',    icon: ClipboardList,   label: 'Exames' },
  { href: '/progresso', icon: TrendingUp,      label: 'Progresso' },
]

// ── Sidebar Logo ──────────────────────────────────────────────────────────────

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  const { theme } = useTheme()
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 px-4 py-5 transition-opacity hover:opacity-80"
      aria-label="SCANIX BODY — ir para o dashboard"
    >
      <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ border: '1px solid var(--shell-accent-bg)', background: 'var(--shell-accent-bg)' }}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden>
          <path d="M16 3L4 9v14l12 6 12-6V9L16 3z" stroke="var(--shell-accent)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 3v20M4 9l12 6 12-6"          stroke="var(--shell-accent)" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="16" cy="16" r="3" fill="var(--shell-accent)" opacity="0.8" />
        </svg>
      </div>

      {!collapsed && (
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-base font-black uppercase leading-tight tracking-[0.15em]"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', color: 'var(--shell-text-title)' }}>
            SCANIX{' '}
            <span style={{ color: 'var(--shell-accent)' }}>BODY</span>
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--shell-text-ghost)' }}>
            Performance Intelligence
          </p>
        </div>
      )}
    </Link>
  )
}

// ── Nav Item ──────────────────────────────────────────────────────────────────

function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number]
  collapsed: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
        collapsed && 'justify-center px-2',
      )}
      style={{
        background: isActive ? 'var(--shell-accent-bg)' : 'transparent',
        color: isActive ? 'var(--shell-accent-text)' : 'var(--shell-text-muted)',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-secondary)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-muted)'
        }
      }}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full"
          style={{ background: 'var(--shell-accent)' }} />
      )}
      <item.icon
        className="h-[18px] w-[18px] flex-shrink-0 transition-colors"
        style={{ color: isActive ? 'var(--shell-accent)' : 'var(--shell-text-faint)' }}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  user,
  collapsed,
  onToggle,
  onClose,
  isMobile = false,
}: {
  user: AppUser
  collapsed: boolean
  onToggle: () => void
  onClose?: () => void
  isMobile?: boolean
}) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = user.fullName?.split(' ')[0] ?? user.email.split('@')[0]
  const initials = user.fullName
    ? user.fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <aside
      className={cn('flex h-full flex-col transition-all duration-300', collapsed ? 'w-[72px]' : 'w-64')}
      style={{ borderRight: '1px solid var(--shell-border)', background: 'var(--shell-sidebar)' }}
    >
      <SidebarLogo collapsed={collapsed} />

      <div className="mx-4 mb-3 h-px" style={{ background: 'var(--shell-divider)' }} />

      {!collapsed && (
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'var(--shell-text-ghost)' }}>
          Módulos
        </p>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Navegação principal">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} item={item} collapsed={collapsed} onClick={isMobile ? onClose : undefined} />
        ))}
      </nav>

      <div className="mt-auto p-2" style={{ borderTop: '1px solid var(--shell-divider)' }}>
        {/* Settings */}
        <Link
          href="/configuracoes"
          onClick={isMobile ? onClose : undefined}
          title={collapsed ? 'Configurações' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            collapsed && 'justify-center px-2',
          )}
          style={{ color: 'var(--shell-text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-secondary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-muted)'
          }}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" aria-hidden />
          {!collapsed && <span>Configurações</span>}
        </Link>

        {/* User card */}
        <div
          className={cn('mt-1 flex items-center gap-3 rounded-xl p-2', collapsed && 'justify-center')}
          style={{ border: '1px solid var(--shell-border-subtle)', background: 'var(--shell-surface)' }}
        >
          <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            style={{ background: 'var(--shell-accent-bg)', color: 'var(--shell-accent-text)' }}>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.fullName ?? 'Avatar'} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <span>{initials}</span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
              style={{ borderColor: 'var(--shell-sidebar)', background: 'var(--shell-accent)' }} />
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
                  {displayName}
                </p>
                <p className="truncate text-[10px]" style={{ color: 'var(--shell-text-muted)' }}>
                  {user.role === 'usuario_final' ? 'Atleta' : user.role}
                </p>
              </div>

              <button
                onClick={handleSignOut}
                title="Sair"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--shell-text-faint)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
                  ;(e.currentTarget as HTMLElement).style.color = '#ff4444'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-faint)'
                }}
                aria-label="Sair da conta"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              'mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all',
              collapsed && 'justify-center px-2',
            )}
            style={{ color: 'var(--shell-text-faint)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-muted)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-faint)'
            }}
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}

// ── Theme Toggle Button ───────────────────────────────────────────────────────

function ThemeToggleButton() {
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggle}
      title={isLight ? 'Mudar para modo noite' : 'Mudar para modo dia'}
      aria-label={isLight ? 'Mudar para modo noite' : 'Mudar para modo dia'}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
      style={{
        border: '1px solid var(--shell-border-subtle)',
        background: 'var(--shell-surface)',
        color: 'var(--shell-text-muted)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--shell-accent)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-accent)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--shell-border-subtle)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-muted)'
      }}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({ user, onMenuToggle }: { user: AppUser; onMenuToggle: () => void }) {
  const pathname = usePathname()
  const currentNav = NAV_ITEMS.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))
  const pageTitle = currentNav?.label ?? 'SCANIX BODY'
  const displayName = user.fullName?.split(' ')[0] ?? user.email.split('@')[0]

  return (
    <header
      className="flex h-16 flex-shrink-0 items-center justify-between px-4 backdrop-blur-sm md:px-6"
      style={{ borderBottom: '1px solid var(--shell-border)', background: 'var(--shell-topbar)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:hidden"
          style={{ color: 'var(--shell-text-muted)' }}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1
          className="text-base font-bold md:text-lg"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.01em', color: 'var(--shell-text-title)' }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 sm:flex"
          style={{ border: '1px solid var(--shell-accent-bg)', background: 'var(--shell-accent-bg)' }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--shell-accent)' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--shell-accent-subtle)' }}>
            Live
          </span>
        </div>

        {/* Theme toggle */}
        <ThemeToggleButton />

        {/* User pill */}
        <Link
          href="/perfil"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors"
          style={{ border: '1px solid var(--shell-border-subtle)', background: 'var(--shell-surface)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--shell-border)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-2)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--shell-border-subtle)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--shell-surface)'
          }}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
            style={{ background: 'var(--shell-accent-bg)', color: 'var(--shell-accent-text)' }}>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full rounded-md object-cover" />
            ) : (
              (user.fullName?.split(' ').slice(0, 2).map(n => n[0]).join('') ?? user.email[0]).toUpperCase()
            )}
          </div>
          <span className="hidden text-xs font-medium sm:block" style={{ color: 'var(--shell-text-secondary)' }}>
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  )
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function MobileDrawer({ user, open, onClose }: { user: AppUser; open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-72 flex-col">
        <Sidebar user={user} collapsed={false} onToggle={onClose} onClose={onClose} isMobile />
        <button
          onClick={onClose}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ border: '1px solid var(--shell-border)', background: 'var(--shell-surface)', color: 'var(--shell-text-muted)' }}
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  )
}

// ── PageSection / PageHeader (re-exports) ─────────────────────────────────────

export interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  card?: boolean
}

export function PageSection({ title, subtitle, action, card = false, children, className, ...props }: PageSectionProps) {
  return (
    <section
      className={cn(card && 'rounded-xl p-5', className)}
      style={card ? { border: '1px solid var(--shell-border-subtle)', background: 'var(--shell-surface-2)' } : undefined}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0 flex-1">
            {title    && <h2 className="text-lg font-semibold leading-tight" style={{ color: 'var(--shell-text-title)' }}>{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--shell-text-secondary)' }}>{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, breadcrumb, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start gap-4 mb-6', className)} {...props}>
      <div className="min-w-0 flex-1">
        {breadcrumb && <div className="mb-1 text-xs" style={{ color: 'var(--shell-text-muted)' }}>{breadcrumb}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif', color: 'var(--shell-text-title)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--shell-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

// ── AppLayout ─────────────────────────────────────────────────────────────────

export default function AppLayout({ user, initialTheme = 'dark', children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen]             = useState(false)
  const [theme, setTheme]                       = useState<Theme>(initialTheme)

  // Apply theme class to <html> immediately and on every change
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
  }, [theme])

  const toggleTheme = useCallback(async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    // Persist preference in the user's profile
    try {
      const supabase = createClient()
      await supabase.from('profiles').update({ theme: next }).eq('user_id', user.id)
    } catch {
      // Non-critical — theme already applied locally
    }
  }, [theme, user.id])

  const toggleSidebar = useCallback(() => setSidebarCollapsed(v => !v), [])
  const openMobile    = useCallback(() => setMobileOpen(true), [])
  const closeMobile   = useCallback(() => setMobileOpen(false), [])

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--shell-bg)' }}>
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar user={user} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer user={user} open={mobileOpen} onClose={closeMobile} />

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar user={user} onMenuToggle={openMobile} />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
              {children}
            </div>
          </main>

          {/* Status bar */}
          <div
            className="flex items-center justify-between px-4 py-1.5 md:px-6"
            style={{ borderTop: '1px solid var(--shell-border)', background: 'var(--shell-sidebar)' }}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" style={{ color: 'var(--shell-accent)' }} aria-hidden />
              <span className="text-[10px]" style={{ color: 'var(--shell-status-text)' }}>
                SCANIX BODY v1.0 — Performance Intelligence
              </span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--shell-status-year)' }}>
              {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}
