'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: React.ElementType;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-primary text-white font-bold',
    'hover:bg-primary/90 active:bg-primary/80',
    'disabled:bg-primary/40',
  ),
  secondary: cn(
    'bg-background-elevated border border-border text-text-primary',
    'hover:bg-surface-2 hover:border-border-strong',
  ),
  ghost: cn(
    'bg-transparent text-text-secondary',
    'hover:bg-surface-2 hover:text-text-primary',
  ),
  danger: cn(
    'bg-danger text-white font-bold',
    'hover:bg-danger/90 active:bg-danger/80',
  ),
  outline: cn(
    'bg-transparent border border-primary text-primary',
    'hover:bg-primary/10',
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-base gap-2 rounded-xl',
  xl: 'h-13 px-8 text-lg gap-2.5 rounded-xl',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      as: Component = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const iconClass = iconSizeStyles[size];

    return (
      <Component
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold select-none',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn(iconClass, 'animate-spin flex-shrink-0')} aria-hidden />
        ) : leftIcon ? (
          <span className={cn(iconClass, 'flex-shrink-0')} aria-hidden>
            {leftIcon}
          </span>
        ) : null}

        {children && (
          <span className={cn(loading && 'opacity-70')}>{children}</span>
        )}

        {!loading && rightIcon && (
          <span className={cn(iconClass, 'flex-shrink-0')} aria-hidden>
            {rightIcon}
          </span>
        )}
      </Component>
    );
  },
);

Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'fullWidth'> {
  'aria-label': string;
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    const squareSizes: Record<ButtonSize, string> = {
      xs: 'w-7 h-7 p-0',
      sm: 'w-8 h-8 p-0',
      md: 'w-9 h-9 p-0',
      lg: 'w-11 h-11 p-0',
      xl: 'w-13 h-13 p-0',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(squareSizes[size], 'rounded-lg', className)}
        {...props}
      >
        {icon}
      </Button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default Button;
