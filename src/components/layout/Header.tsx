'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────

export interface HeaderUser {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  read?: boolean;
}

export interface HeaderProps {
  title?: string;
  user?: HeaderUser | null;
  notifications?: NotificationItem[];
  unreadCount?: number;
  onMenuToggle?: () => void;
  onLogout?: () => void;
  /** Right-side extra actions slot */
  actions?: React.ReactNode;
}

// ── User Avatar ─────────────────────────────────────────────

function HeaderAvatar({ user }: { user: HeaderUser }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        'bg-primary/20 text-primary text-xs font-bold border border-primary/30',
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ── Dropdown menu ───────────────────────────────────────────

function UserMenu({
  user,
  onLogout,
}: {
  user: HeaderUser;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu do usuário"
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg',
          'transition-colors duration-150',
          'hover:bg-surface-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          open && 'bg-surface-2',
        )}
      >
        <HeaderAvatar user={user} />
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold text-text-primary leading-tight truncate max-w-[120px]">
            {user.name}
          </span>
          {user.role && (
            <span className="text-xs text-text-muted leading-tight capitalize">
              {user.role}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-text-muted transition-transform duration-200 hidden sm:block',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-2 w-56 z-50',
            'bg-background-elevated border border-border rounded-xl shadow-card-lg',
            'py-1 overflow-hidden animate-slide-up',
          )}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user.name}
            </p>
            {user.email && (
              <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/perfil"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                'text-sm text-text-primary hover:bg-surface-2 hover:text-text-primary',
                'transition-colors duration-100 cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              )}
            >
              <User className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden />
              Meu Perfil
            </Link>

            <Link
              href="/configuracoes"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                'text-sm text-text-primary hover:bg-surface-2',
                'transition-colors duration-100 cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              )}
            >
              <Settings className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden />
              Configurações
            </Link>
          </div>

          {/* Logout */}
          <div className="py-1 border-t border-border">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5',
                'text-sm text-danger hover:bg-danger/10',
                'transition-colors duration-100 cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-inset',
              )}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification Bell ───────────────────────────────────────

function NotificationBell({
  unreadCount = 0,
  notifications = [],
}: {
  unreadCount?: number;
  notifications?: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        className={cn(
          'relative w-9 h-9 rounded-lg flex items-center justify-center',
          'text-text-secondary hover:text-text-primary hover:bg-surface-2',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <Bell className="w-5 h-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute top-1 right-1 flex items-center justify-center',
              'min-w-[16px] h-4 px-1 rounded-full',
              'bg-primary text-background text-2xs font-bold',
              'animate-pulse-green',
            )}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications dropdown */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-80 z-50',
            'bg-background-elevated border border-border rounded-xl shadow-card-lg',
            'overflow-hidden animate-slide-up',
          )}
          role="region"
          aria-label="Notificações"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Notificações</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-primary">
                {unreadCount} nova{unreadCount !== 1 && 's'}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-text-muted mx-auto mb-2" aria-hidden />
                <p className="text-sm text-text-muted">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 border-b border-border/50 last:border-0',
                    'hover:bg-surface-2 transition-colors cursor-pointer',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary leading-tight">
                        {n.title}
                      </p>
                      {n.description && (
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed truncate-2">
                          {n.description}
                        </p>
                      )}
                      {n.time && (
                        <p className="text-2xs text-text-muted mt-1">{n.time}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────

export function Header({
  title,
  user,
  notifications = [],
  unreadCount = 0,
  onMenuToggle,
  onLogout,
  actions,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 lg:left-64 z-30',
        'h-16 flex items-center gap-3 px-4 sm:px-6',
        'bg-background-secondary/95 border-b border-border',
        'backdrop-blur-sm',
      )}
    >
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuToggle}
        className={cn(
          'lg:hidden w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          'text-text-secondary hover:text-text-primary hover:bg-surface-2',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="w-5 h-5" aria-hidden />
      </button>

      {/* Mobile logo (visible only on small screens) */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" aria-hidden />
        </div>
        <span className="font-display font-bold text-sm tracking-wider text-primary">
          SCANIX
        </span>
      </div>

      {/* Page title */}
      {title && (
        <h1 className="hidden sm:block text-base font-semibold text-text-primary truncate flex-shrink min-w-0">
          {title}
        </h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right-side actions */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}

      {/* Notification bell */}
      <NotificationBell
        unreadCount={unreadCount}
        notifications={notifications}
      />

      {/* User menu */}
      {user && <UserMenu user={user} onLogout={onLogout} />}
    </header>
  );
}

export default Header;
