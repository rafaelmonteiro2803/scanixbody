'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export type ProgressBarVariant = 'primary' | 'accent' | 'danger' | 'warning' | 'success' | 'dynamic';
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value 0–100 */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  /** Show the percentage label */
  showLabel?: boolean;
  /** Position of the label */
  labelPosition?: 'right' | 'top' | 'inside';
  /** Animate the fill on mount */
  animated?: boolean;
  /** Optional track label on top left */
  label?: string;
  /** Striped pattern */
  striped?: boolean;
  /** Pulse glow on the fill */
  glow?: boolean;
}

// ── Style Maps ─────────────────────────────────────────────

const sizeStyles: Record<ProgressBarSize, string> = {
  xs: 'h-1 rounded-full',
  sm: 'h-1.5 rounded-full',
  md: 'h-2.5 rounded-full',
  lg: 'h-4 rounded-full',
};

const variantFillStyles: Record<ProgressBarVariant, (pct: number) => string> = {
  primary: ()  => 'bg-primary',
  accent:  ()  => 'bg-accent',
  danger:  ()  => 'bg-danger',
  warning: ()  => 'bg-warning',
  success: ()  => 'bg-success',
  // dynamic: green > 70, yellow 40–70, red < 40
  dynamic: (p) =>
    p >= 70 ? 'bg-success' : p >= 40 ? 'bg-warning' : 'bg-danger',
};

// ── Component ──────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  animated = true,
  label,
  striped = false,
  glow = false,
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
      className={cn(
        'w-full bg-background-elevated overflow-hidden',
        sizeStyles[size],
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out-expo',
          animated && 'animate-fill-up',
          fillColor,
          striped && [
            'bg-stripes',
            'bg-[length:20px_20px]',
            'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.1)_5px,rgba(0,0,0,0.1)_10px)]',
          ],
          glow && 'shadow-glow-sm',
        )}
        style={{ width: `${percentage}%` }}
      >
        {/* Inside label */}
        {showLabel && labelPosition === 'inside' && size === 'lg' && (
          <span className="sr-only">{percentage}%</span>
        )}
      </div>
    </div>
  );

  if (labelPosition === 'right' && showLabel) {
    return (
      <div className={cn('flex items-center gap-2', className)} {...props}>
        {label && (
          <span className="text-xs text-text-secondary whitespace-nowrap">{label}</span>
        )}
        <div className="flex-1">{fillBar}</div>
        <span className="text-xs font-semibold text-text-secondary tabular-nums w-8 text-right">
          {percentage}%
        </span>
      </div>
    );
  }

  if (labelPosition === 'top' || label) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)} {...props}>
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-xs font-medium text-text-secondary">{label}</span>
          )}
          {showLabel && (
            <span className="text-xs font-semibold text-text-primary tabular-nums ml-auto">
              {percentage}%
            </span>
          )}
        </div>
        {fillBar}
      </div>
    );
  }

  return (
    <div className={cn(className)} {...props}>
      {fillBar}
    </div>
  );
}

// ── Multi-bar (stacked) ─────────────────────────────────────

export interface SegmentedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: Array<{ value: number; color: string; label?: string }>;
  size?: ProgressBarSize;
}

export function SegmentedProgress({
  segments,
  size = 'md',
  className,
  ...props
}: SegmentedProgressProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-background-elevated flex',
        sizeStyles[size],
        className,
      )}
      role="img"
      aria-label="Progresso segmentado"
      {...props}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className="h-full transition-all duration-500"
          style={{
            width: `${(seg.value / total) * 100}%`,
            backgroundColor: seg.color,
          }}
          aria-label={seg.label ? `${seg.label}: ${seg.value}` : undefined}
        />
      ))}
    </div>
  );
}

export default ProgressBar;
