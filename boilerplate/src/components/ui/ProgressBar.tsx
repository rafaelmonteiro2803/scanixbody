'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ProgressBarVariant = 'primary' | 'danger' | 'warning' | 'success' | 'dynamic';
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  showLabel?: boolean;
  labelPosition?: 'right' | 'top';
  animated?: boolean;
  label?: string;
  striped?: boolean;
}

const sizeStyles: Record<ProgressBarSize, string> = {
  xs: 'h-1 rounded-full',
  sm: 'h-1.5 rounded-full',
  md: 'h-2.5 rounded-full',
  lg: 'h-4 rounded-full',
};

const variantFillStyles: Record<ProgressBarVariant, (pct: number) => string> = {
  primary: () => 'bg-primary',
  danger:  () => 'bg-danger',
  warning: () => 'bg-warning',
  success: () => 'bg-success',
  dynamic: (p) => p >= 70 ? 'bg-success' : p >= 40 ? 'bg-warning' : 'bg-danger',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  label,
  className,
  ...props
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(0, value), max);
  const percentage = Math.round((clampedValue / max) * 100);
  const fillColor = variantFillStyles[variant](percentage);

  const fillBar = (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn('w-full bg-background-elevated overflow-hidden', sizeStyles[size])}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-700', fillColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  if (labelPosition === 'right' && showLabel) {
    return (
      <div className={cn('flex items-center gap-2', className)} {...props}>
        {label && <span className="text-xs text-text-secondary whitespace-nowrap">{label}</span>}
        <div className="flex-1">{fillBar}</div>
        <span className="text-xs font-semibold text-text-secondary tabular-nums w-8 text-right">{percentage}%</span>
      </div>
    );
  }

  if (labelPosition === 'top' || label) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)} {...props}>
        <div className="flex items-center justify-between gap-2">
          {label && <span className="text-xs font-medium text-text-secondary">{label}</span>}
          {showLabel && <span className="text-xs font-semibold text-text-primary tabular-nums ml-auto">{percentage}%</span>}
        </div>
        {fillBar}
      </div>
    );
  }

  return <div className={cn(className)} {...props}>{fillBar}</div>;
}

export default ProgressBar;
