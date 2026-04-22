'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-6' : 'py-20 px-6',
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl mb-5',
            'bg-surface-2 border border-border',
            compact ? 'w-12 h-12' : 'w-16 h-16',
          )}
          aria-hidden="true"
        >
          <span className={cn('text-text-muted', compact ? '[&>svg]:w-6 [&>svg]:h-6' : '[&>svg]:w-8 [&>svg]:h-8')}>
            {icon}
          </span>
        </div>
      )}

      <h3 className={cn('font-semibold text-text-primary', compact ? 'text-base' : 'text-xl')}>
        {title}
      </h3>

      {description && (
        <p className={cn('mt-2 text-text-secondary leading-relaxed max-w-sm mx-auto', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className={cn('flex flex-wrap items-center justify-center gap-3', compact ? 'mt-4' : 'mt-6')}>
          {action && (
            <Button
              variant={action.variant ?? 'primary'}
              size={compact ? 'sm' : 'md'}
              leftIcon={action.icon}
              onClick={action.onClick}
              {...(action.href ? { as: 'a', href: action.href } : {})}
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'ghost'}
              size={compact ? 'sm' : 'md'}
              leftIcon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
              {...(secondaryAction.href ? { as: 'a', href: secondaryAction.href } : {})}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
