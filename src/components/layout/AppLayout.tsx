'use client'

import React, { useState, useCallback } from 'react'
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
  User,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database.types'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
}

interface AppLayoutProps {
  user: AppUser
  children: React.ReactNode
}

// ── Navigation items ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    exact: true,
  },
  {
    href: '/treinos',
    icon: Dumbbell,
    label: 'Treinos',
  },
  {
    href: '/dieta',
    icon: Utensils,
    label: 'Dieta',
  },
  {
    href: '/corpo',
    icon: Activity,
    label: 'Composição',
  },
  {
    href: '/analise-ia',
    icon: Brain,
    label: 'Análise IA',
  },
  {
    href: '/exames',
    icon: ClipboardList,
    label: 'Exames',
  },
  {
    href: '/progresso',
    icon: TrendingUp,
    label: 'Progresso',
  },
]

// ── Sidebar Logo ──────────────────────────────────────────────────────────────

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 px-4 py-5 transition-opacity hover:opacity-80"
      aria-label="SCANIX BODY — ir para o dashboard"
    >
      {/* Icon */}
      <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/10">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M16 3L4 9v14l12 6 12-6V9L16 3z"
            stroke="#00ff88"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 3v20M4 9l12 6 12-6"
            stroke="#00ff88"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="3" fill="#00ff88" opacity="0.8" />
        </svg>
      </div>

      {/* Wordmark — hidden when collapsed */}
      {!collapsed && (
        <div className="min-w-0 overflow-hidden">
          <p
            className="truncate text-base font-black uppercase leading-tight tracking-[0.15em] text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          >
            SCANIX{' '}
            <span
              className="text-[#00ff88]"
              style={{ textShadow: '0 0 10px rgba(0,255,136,0.4)' }}
            >
              BODY
            </span>
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.2em] text-[#555555]">
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
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-[#00ff88]/10 text-[#00ff88]'
          : 'text-[#666666] hover:bg-[#1a1a1a] hover:text-[#a0a0a0]',
        collapsed && 'justify-center px-2',
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#00ff88]" />
      )}

      <item.icon
        className={cn(
          'h-[18px] w-[18px] flex-shrink-0 transition-colors',
          isActive ? 'text-[#00ff88]' : 'text-[#444444] group-hover:text-[#666666]',
        )}
        aria-hidden
      />

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
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
    ? user.fullName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[#1e1e1e] bg-[#0d0d0d] transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Logo */}
      <SidebarLogo collapsed={collapsed} />

      {/* Divider */}
      <div className="mx-4 mb-3 h-px bg-[#1a1a1a]" />

      {/* Nav label */}
      {!collapsed && (
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#333333]">
          Módulos
        </p>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            onClick={isMobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto border-t border-[#1a1a1a] p-2">
        {/* Settings */}
        <Link
          href="/configuracoes"
          onClick={isMobile ? onClose : undefined}
          title={collapsed ? 'Configurações' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#555555] transition-all hover:bg-[#1a1a1a] hover:text-[#a0a0a0]',
            collapsed && 'justify-center px-2',
          )}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" aria-hidden />
          {!collapsed && <span>Configurações</span>}
        </Link>

        {/* User info + sign out */}
        <div
          className={cn(
            'mt-1 flex items-center gap-3 rounded-xl border border-[#1e1e1e] bg-[#111111] p-2',
            collapsed && 'justify-center',
          )}
        >
          {/* Avatar */}
          <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#00ff88]/10 text-xs font-bold text-[#00ff88]">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName ?? 'Avatar'}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d0d0d] bg-[#00ff88]" />
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#e0e0e0]">
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-[#555555]">
                  {user.role === 'usuario_final' ? 'Atleta' : user.role}
                </p>
              </div>

              <button
                onClick={handleSignOut}
                title="Sair"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[#444444] transition-colors hover:bg-[#1e1e1e] hover:text-[#ff4444]"
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
              'mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#444444] transition-all hover:bg-[#1a1a1a] hover:text-[#666666]',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({
  user,
  onMenuToggle,
}: {
  user: AppUser
  onMenuToggle: () => void
}) {
  const pathname = usePathname()

  // Derive page title from current route
  const currentNav = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  )
  const pageTitle = currentNav?.label ?? 'SCANIX BODY'

  const displayName = user.fullName?.split(' ')[0] ?? user.email.split('@')[0]

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a]/80 px-4 backdrop-blur-sm md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#555555] transition-colors hover:bg-[#1a1a1a] hover:text-[#a0a0a0] md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title */}
        <div>
          <h1
            className="text-base font-bold text-white md:text-lg"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.01em' }}
          >
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="hidden items-center gap-1.5 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 px-2.5 py-1 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ff88]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]/70">
            Live
          </span>
        </div>

        {/* User pill */}
        <Link
          href="/perfil"
          className="flex items-center gap-2 rounded-xl border border-[#1e1e1e] bg-[#111111] px-3 py-1.5 transition-colors hover:border-[#2a2a2a] hover:bg-[#161616]"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00ff88]/10 text-[10px] font-bold text-[#00ff88]">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              (user.fullName?.split(' ').slice(0, 2).map((n) => n[0]).join('') ?? user.email[0]).toUpperCase()
            )}
          </div>
          <span className="hidden text-xs font-medium text-[#a0a0a0] sm:block">
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  )
}

// ── Mobile drawer overlay ─────────────────────────────────────────────────────

function MobileDrawer({
  user,
  open,
  onClose,
}: {
  user: AppUser
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-72 flex-col">
        <Sidebar
          user={user}
          collapsed={false}
          onToggle={onClose}
          onClose={onClose}
          isMobile
        />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#666666] transition-colors hover:text-[#a0a0a0]"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  )
}

// ── Page section wrapper (optional utility) ────────────────────────────────────

export interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  card?: boolean
}

export function PageSection({
  title,
  subtitle,
  action,
  card = false,
  children,
  className,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn(
        card && 'rounded-xl border border-[#1e1e1e] bg-[#161616] shadow-card p-5',
        className,
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-lg font-semibold text-white leading-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[#a0a0a0] leading-relaxed">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

// ── Page header (large title row at top of content) ────────────────────────────

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col sm:flex-row sm:items-start gap-4 mb-6', className)}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {breadcrumb && <div className="mb-1 text-xs text-[#666666]">{breadcrumb}</div>}
        <h1
          className="text-2xl sm:text-3xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[#a0a0a0] leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  )
}

// ── AppLayout ─────────────────────────────────────────────────────────────────

export default function AppLayout({ user, children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer user={user} open={mobileOpen} onClose={closeMobile} />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar user={user} onMenuToggle={openMobile} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
            {children}
          </div>
        </main>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between border-t border-[#1a1a1a] bg-[#0a0a0a] px-4 py-1.5 md:px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-[#00ff88]" aria-hidden />
            <span className="text-[10px] text-[#333333]">
              SCANIX BODY v1.0 — Performance Intelligence
            </span>
          </div>
          <span className="text-[10px] text-[#2a2a2a]">
            {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  )
}
