'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'accent';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Optional dot indicator on the left */
  dot?: boolean;
  /** Outlined style instead of filled */
  outline?: boolean;
  /** Icon to show left of the label */
  icon?: React.ReactNode;
}

// ── Style Maps ─────────────────────────────────────────────

const variantFilled: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success border border-success/25',
  danger:  'bg-danger/15 text-danger border border-danger/25',
  warning: 'bg-warning/15 text-warning border border-warning/25',
  info:    'bg-accent/15 text-accent border border-accent/25',
  neutral: 'bg-surface-2 text-text-secondary border border-border',
  primary: 'bg-primary/15 text-primary border border-primary/25',
  accent:  'bg-accent/15 text-accent border border-accent/25',
};

const variantOutline: Record<BadgeVariant, string> = {
  success: 'bg-transparent text-success border border-success/50',
  danger:  'bg-transparent text-danger border border-danger/50',
  warning: 'bg-transparent text-warning border border-warning/50',
  info:    'bg-transparent text-accent border border-accent/50',
  neutral: 'bg-transparent text-text-secondary border border-border',
  primary: 'bg-transparent text-primary border border-primary/50',
  accent:  'bg-transparent text-accent border border-accent/50',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success',
  danger:  'bg-danger',
  warning: 'bg-warning',
  info:    'bg-accent',
  neutral: 'bg-text-secondary',
  primary: 'bg-primary',
  accent:  'bg-accent',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-2xs gap-1 rounded-full',
  md: 'px-2.5 py-1 text-xs gap-1.5 rounded-full',
};

// ── Component ──────────────────────────────────────────────

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      dot = false,
      outline = false,
      icon,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const colorStyles = outline ? variantOutline[variant] : variantFilled[variant];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold tracking-wide select-none',
          'transition-colors duration-150',
          sizeStyles[size],
          colorStyles,
          className,
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'flex-shrink-0 rounded-full',
              size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
              dotColors[variant],
            )}
            aria-hidden
          />
        )}
        {!dot && icon && (
          <span
            className={cn('flex-shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')}
            aria-hidden
          >
            {icon}
          </span>
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export default Badge;
