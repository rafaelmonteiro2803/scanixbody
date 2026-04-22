'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'white' | 'muted';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  srLabel?: string;
  overlay?: boolean;
}

const sizeStyles: Record<SpinnerSize, { ring: string; gap: string; text: string }> = {
  xs: { ring: 'w-3 h-3 border',        gap: 'gap-1.5', text: 'text-xs'  },
  sm: { ring: 'w-4 h-4 border',        gap: 'gap-2',   text: 'text-xs'  },
  md: { ring: 'w-6 h-6 border-2',      gap: 'gap-2.5', text: 'text-sm'  },
  lg: { ring: 'w-8 h-8 border-2',      gap: 'gap-3',   text: 'text-base'},
  xl: { ring: 'w-12 h-12 border-[3px]',gap: 'gap-3',   text: 'text-lg'  },
};

const variantStyles: Record<SpinnerVariant, string> = {
  primary: 'border-primary/20 border-t-primary',
  white:   'border-white/20 border-t-white',
  muted:   'border-text-muted/20 border-t-text-muted',
};

const variantTextStyles: Record<SpinnerVariant, string> = {
  primary: 'text-primary',
  white:   'text-white',
  muted:   'text-text-muted',
};

export function Spinner({
  size = 'md',
  variant = 'primary',
  label,
  srLabel = 'Loading...',
  overlay = false,
  className,
  ...props
}: SpinnerProps) {
  const s = sizeStyles[size];

  const spinnerEl = (
    <span
      className={cn('inline-flex items-center', s.gap, overlay && 'flex-col', className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span
        className={cn('flex-shrink-0 rounded-full animate-spin', s.ring, variantStyles[variant])}
        aria-hidden="true"
      />
      {label && (
        <span className={cn(s.text, 'font-medium', variantTextStyles[variant])} aria-hidden="true">
          {label}
        </span>
      )}
      {!label && <span className="sr-only">{srLabel}</span>}
    </span>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        {spinnerEl}
      </div>
    );
  }

  return spinnerEl;
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner size="xl" variant="primary" />
      <p className="text-sm text-text-secondary animate-pulse">{label}</p>
    </div>
  );
}

export default Spinner;
