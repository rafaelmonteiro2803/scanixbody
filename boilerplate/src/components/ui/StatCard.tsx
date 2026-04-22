'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrendDirection = 'up' | 'down' | 'neutral';
export type StatCardAccent = 'primary' | 'danger' | 'warning' | 'success' | 'none';

export interface StatCardTrend {
  direction: TrendDirection;
  value: string;
  label?: string;
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  trend?: StatCardTrend;
  icon?: React.ReactNode;
  accent?: StatCardAccent;
  compact?: boolean;
  hoverable?: boolean;
  loading?: boolean;
}

const accentBorderStyles: Record<StatCardAccent, string> = {
  primary: 'border-l-[3px] border-l-primary',
  danger:  'border-l-[3px] border-l-danger',
  warning: 'border-l-[3px] border-l-warning',
  success: 'border-l-[3px] border-l-success',
  none:    '',
};

const accentIconBgStyles: Record<StatCardAccent, string> = {
  primary: 'bg-primary/10 text-primary',
  danger:  'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  none:    'bg-surface-2 text-text-muted',
};

const trendStyles: Record<TrendDirection, { color: string; bg: string }> = {
  up:      { color: 'text-success', bg: 'bg-success/10' },
  down:    { color: 'text-danger',  bg: 'bg-danger/10'  },
  neutral: { color: 'text-text-muted', bg: 'bg-surface-2' },
};

const TrendIcon: Record<TrendDirection, React.ElementType> = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
};

export function StatCard({
  label,
  value,
  unit,
  trend,
  icon,
  accent = 'none',
  compact = false,
  hoverable = false,
  loading = false,
  className,
  ...props
}: StatCardProps) {
  if (loading) {
    return (
      <div
        className={cn('rounded-xl border border-border bg-background-card shadow-card', compact ? 'p-3' : 'p-5', 'flex flex-col gap-3', className)}
        {...props}
      >
        <div className="h-3 w-24 rounded bg-surface-2 animate-pulse" />
        <div className="h-8 w-16 rounded bg-surface-2 animate-pulse" />
        <div className="h-3 w-20 rounded bg-surface-2 animate-pulse" />
      </div>
    );
  }

  const TIcon = trend ? TrendIcon[trend.direction] : null;
  const trendStyle = trend ? trendStyles[trend.direction] : null;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background-card shadow-card transition-all duration-200',
        compact ? 'p-3' : 'p-5',
        accentBorderStyles[accent],
        hoverable && 'hover:border-border-strong hover:shadow-card-lg hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={cn('text-text-secondary font-medium leading-tight', compact ? 'text-xs' : 'text-sm')}>
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg flex-shrink-0',
              compact ? 'w-8 h-8 [&>svg]:w-4 [&>svg]:h-4' : 'w-10 h-10 [&>svg]:w-5 [&>svg]:h-5',
              accentIconBgStyles[accent],
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5 mb-2">
        <span className={cn('leading-none text-text-primary font-bold', compact ? 'text-2xl' : 'text-3xl')}>
          {value}
        </span>
        {unit && (
          <span className={cn('text-text-secondary font-medium mb-0.5', compact ? 'text-xs' : 'text-sm')}>
            {unit}
          </span>
        )}
      </div>

      {trend && TIcon && trendStyle && (
        <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5', trendStyle.bg)}>
          <TIcon className={cn('w-3 h-3 flex-shrink-0', trendStyle.color)} aria-hidden />
          <span className={cn('text-xs font-semibold', trendStyle.color)}>{trend.value}</span>
          {trend.label && <span className="text-xs text-text-muted">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
