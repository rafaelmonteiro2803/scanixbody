'use client'

import type { UserRole } from '@/types/database.types'

interface RoleBadgeProps {
  role: UserRole
  size?: 'sm' | 'md'
}

const roleConfig: Record<
  UserRole,
  { label: string; bg: string; text: string; border: string }
> = {
  super_admin: {
    label: 'SUPER ADMIN',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/25',
  },
  admin: {
    label: 'ADMIN',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/25',
  },
  coach: {
    label: 'COACH',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/25',
  },
  operator: {
    label: 'OPERADOR',
    bg: 'bg-[#444]/30',
    text: 'text-[#aaa]',
    border: 'border-[#444]/50',
  },
  usuario_final: {
    label: 'USUÁRIO',
    bg: 'bg-[#00ff88]/10',
    text: 'text-[#00ff88]',
    border: 'border-[#00ff88]/25',
  },
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const config = roleConfig[role] ?? roleConfig.usuario_final

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] rounded-full'
      : 'px-2.5 py-1 text-xs rounded-full'

  return (
    <span
      className={[
        'inline-flex items-center font-bold tracking-wider border select-none',
        sizeClass,
        config.bg,
        config.text,
        config.border,
      ].join(' ')}
    >
      {config.label}
    </span>
  )
}

export default RoleBadge
