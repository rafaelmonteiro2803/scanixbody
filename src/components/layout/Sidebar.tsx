'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  TrendingUp,
  History,
  Utensils,
  Activity,
  Scan,
  Pill,
  FileText,
  Heart,
  Brain,
  Shield,
  Zap,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────

export interface SidebarUser {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface SidebarProps {
  user?: SidebarUser | null;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

// ── Nav config ─────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard',        href: '/dashboard',         icon: LayoutDashboard },
  { label: 'Treinos',          href: '/treinos',           icon: Dumbbell         },
  { label: 'Registrar Treino', href: '/treinos/registrar', icon: ClipboardList    },
  { label: 'Cardio',           href: '/cardio',            icon: Heart            },
  { label: 'Progresso',        href: '/progresso',         icon: TrendingUp       },
  { label: 'Histórico',        href: '/historico',         icon: History          },
  { label: 'Dieta',            href: '/dieta',             icon: Utensils         },
  { label: 'Corpo & Objetivo', href: '/corpo',             icon: Activity         },
  { label: 'Bioimpedância',    href: '/bioimpedancia',     icon: Scan             },
  { label: 'Medicamentos',     href: '/medicamentos',      icon: Pill             },
  { label: 'Exames',           href: '/exames',            icon: FileText         },
  { label: 'Análise IA',       href: '/analise',           icon: Brain            },
];

const adminNavItems: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: Shield, adminOnly: true },
];

// ── User Avatar ────────────────────────────────────────────

function UserAvatar({
  user,
  size = 'md',
}: {
  user: SidebarUser;
  size?: 'sm' | 'md';
}) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-primary/20 text-primary font-bold border border-primary/30',
        sizeClass,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ── NavItem component ───────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-sm font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? [
              'bg-primary/10 text-primary',
              'before:absolute before:left-0 before:top-2 before:bottom-2',
              'before:w-[3px] before:rounded-r-full before:bg-primary',
            ]
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] flex-shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary',
        )}
        aria-hidden="true"
      />
      <span className="truncate leading-tight">{item.label}</span>

      {isActive && (
        <ChevronRight
          className="ml-auto w-3.5 h-3.5 text-primary/60 flex-shrink-0"
          aria-hidden
        />
      )}
    </Link>
  );
}

// ── Main Sidebar ────────────────────────────────────────────

export function Sidebar({ user, isOpen = true, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40',
          'w-64 flex flex-col',
          'bg-background-secondary border-r border-border',
          'hidden lg:flex',
        )}
        aria-label="Navegação principal"
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          isAdmin={isAdmin}
          onLogout={onLogout}
        />
      </aside>

      {/* Mobile overlay + drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className={cn(
              'fixed left-0 top-0 bottom-0 z-50',
              'w-64 flex flex-col',
              'bg-background-secondary border-r border-border',
              'lg:hidden animate-drawer-in',
            )}
            aria-label="Navegação principal"
          >
            <SidebarContent
              pathname={pathname}
              user={user}
              isAdmin={isAdmin}
              onClose={onClose}
              onLogout={onLogout}
            />
          </aside>
        </>
      )}
    </>
  );
}

// ── Sidebar inner content ──────────────────────────────────

function SidebarContent({
  pathname,
  user,
  isAdmin,
  onClose,
  onLogout,
}: {
  pathname: string;
  user?: SidebarUser | null;
  isAdmin?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0">
          <Zap className="w-4.5 h-4.5 text-primary" fill="currentColor" aria-hidden />
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-base tracking-wider text-primary leading-none">
            SCANIX
          </span>
          <span className="font-display font-bold text-base tracking-wider text-text-primary leading-none">
            {' '}BODY
          </span>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollable" aria-label="Menu">
        {mainNavItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isActive={
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            }
            onClick={onClose}
          />
        ))}

        {/* Separator */}
        {isAdmin && (
          <>
            <div className="py-2 px-3">
              <div className="border-t border-border" />
            </div>

            {adminNavItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
                onClick={onClose}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── User footer ── */}
      {user && (
        <div className="border-t border-border flex-shrink-0">
          <div className="px-3 py-3 flex items-center gap-2.5">
            <UserAvatar user={user} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate leading-tight">
                {user.name}
              </p>
              {user.email && (
                <p className="text-xs text-text-muted truncate leading-tight mt-0.5">
                  {user.email}
                </p>
              )}
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                  'text-text-muted hover:text-danger hover:bg-danger/10',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
                aria-label="Sair da conta"
                title="Sair"
              >
                <LogOut className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
