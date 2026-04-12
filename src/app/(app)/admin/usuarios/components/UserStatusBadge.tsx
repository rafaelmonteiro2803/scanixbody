'use client'

import type { UserStatus } from '@/types/database.types'

interface UserStatusBadgeProps {
  status: UserStatus
  size?: 'sm' | 'md'
  dot?: boolean
}

const statusConfig: Record<
  UserStatus,
  { label: string; bg: string; text: string; border: string; dotColor: string }
> = {
  active: {
    label: 'Ativo',
    bg: 'bg-[#00ff88]/10',
    text: 'text-[#00ff88]',
    border: 'border-[#00ff88]/25',
    dotColor: 'bg-[#00ff88]',
  },
  inactive: {
    label: 'Inativo',
    bg: 'bg-[#444]/30',
    text: 'text-[#888]',
    border: 'border-[#444]/50',
    dotColor: 'bg-[#888]',
  },
  blocked: {
    label: 'Bloqueado',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/25',
    dotColor: 'bg-red-400',
  },
  first_access: {
    label: '1º Acesso',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/25',
    dotColor: 'bg-yellow-400',
  },
}

export function UserStatusBadge({
  status,
  size = 'md',
  dot = true,
}: UserStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.inactive

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] rounded-full gap-1'
      : 'px-2.5 py-1 text-xs rounded-full gap-1.5'

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <span
      className={[
        'inline-flex items-center font-semibold border select-none',
        sizeClass,
        config.bg,
        config.text,
        config.border,
      ].join(' ')}
    >
      {dot && (
        <span
          className={['rounded-full flex-shrink-0', dotSize, config.dotColor].join(
            ' ',
          )}
          aria-hidden
        />
      )}
      {config.label}
    </span>
  )
}

export default UserStatusBadge
