'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'ghost';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Remove default padding from card body */
  noPadding?: boolean;
  /** Add a green left accent border */
  accent?: boolean;
  /** Hover lift effect */
  hoverable?: boolean;
}

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Separator line above footer */
  divider?: boolean;
}

// ── Style Maps ─────────────────────────────────────────────

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-background-card border border-border shadow-card',
  elevated: 'bg-background-elevated border border-border shadow-card-lg',
  bordered: 'bg-background-card border-2 border-border shadow-card',
  ghost: 'bg-transparent border border-border/50',
};

// ── Card ───────────────────────────────────────────────────

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      noPadding = false,
      accent = false,
      hoverable = false,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-xl',
          'transition-all duration-200',
          variantStyles[variant],
          accent && 'border-l-[3px] border-l-primary',
          hoverable && 'hover:border-border-strong hover:shadow-card-lg hover:-translate-y-0.5 cursor-pointer',
          !noPadding && 'p-4',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

// ── CardHeader ─────────────────────────────────────────────

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between gap-3 mb-4',
          className,
        )}
        {...props}
      >
        {(title || subtitle) ? (
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base font-semibold text-text-primary leading-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="min-w-0 flex-1">{children}</div>
        )}

        {action && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

// ── CardBody ───────────────────────────────────────────────

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex-1', className)} {...props}>
        {children}
      </div>
    );
  },
);

CardBody.displayName = 'CardBody';

// ── CardFooter ─────────────────────────────────────────────

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ divider = false, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-4 flex items-center gap-3',
          divider && 'pt-4 border-t border-border',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardFooter.displayName = 'CardFooter';

export default Card;
