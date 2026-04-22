'use client';

import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

export type InputVariant = 'default' | 'filled';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  successText?: string;
  variant?: InputVariant;
  size?: InputSize;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  showCount?: boolean;
  required?: boolean;
}

const variantBase: Record<InputVariant, string> = {
  default: cn(
    'bg-background-secondary border border-border',
    'hover:border-border-strong',
    'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
  ),
  filled: cn(
    'bg-surface-2 border border-transparent',
    'hover:bg-surface-3',
    'focus-within:bg-background-secondary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
  ),
};

const sizeStyles: Record<InputSize, { wrapper: string; input: string; icon: string }> = {
  sm: { wrapper: 'h-8 rounded-md',  input: 'text-xs px-3', icon: 'w-4 h-4' },
  md: { wrapper: 'h-10 rounded-lg', input: 'text-sm px-3', icon: 'w-4 h-4' },
  lg: { wrapper: 'h-12 rounded-xl', input: 'text-base px-4', icon: 'w-5 h-5' },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      successText,
      variant = 'default',
      size = 'md',
      prefix,
      suffix,
      fullWidth = true,
      showCount = false,
      required,
      className,
      id: externalId,
      type = 'text',
      maxLength,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = externalId ?? `input-${generatedId}`;
    const hintId = `${id}-hint`;

    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() ?? '');

    const resolvedType = type === 'password' ? (showPassword ? 'text' : 'password') : type;
    const currentLength = value !== undefined ? String(value).length : internalValue.length;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(successText) && !hasError;
    const s = sizeStyles[size];

    const wrapperStateStyle = hasError
      ? 'border-danger focus-within:border-danger focus-within:ring-danger'
      : hasSuccess
        ? 'border-success focus-within:border-success focus-within:ring-success'
        : variantBase[variant];

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-secondary select-none">
            {label}
            {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <div className={cn('relative flex items-center transition-all duration-150', s.wrapper, wrapperStateStyle)}>
          {prefix && (
            <div className={cn('pointer-events-none flex items-center pl-3 text-text-muted flex-shrink-0', s.icon)} aria-hidden>
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={resolvedType}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={error || helperText || successText ? hintId : undefined}
            onChange={(e) => {
              setInternalValue(e.target.value);
              props.onChange?.(e);
            }}
            className={cn(
              'flex-1 h-full min-w-0 bg-transparent',
              'text-text-primary placeholder:text-text-tertiary',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              s.input,
              prefix && 'pl-2',
              (suffix || type === 'password') && 'pr-2',
            )}
            {...props}
          />

          <div className="flex items-center gap-1 pr-3 flex-shrink-0">
            {type === 'password' && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className={cn('text-text-muted hover:text-text-secondary transition-colors', s.icon)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-full h-full" /> : <Eye className="w-full h-full" />}
              </button>
            )}
            {hasError && <AlertCircle className={cn(s.icon, 'text-danger flex-shrink-0')} aria-hidden />}
            {hasSuccess && <CheckCircle2 className={cn(s.icon, 'text-success flex-shrink-0')} aria-hidden />}
            {suffix && !hasError && !hasSuccess && (
              <span className={cn('text-text-muted flex-shrink-0', s.icon)} aria-hidden>{suffix}</span>
            )}
          </div>
        </div>

        {(error || helperText || successText || (showCount && maxLength)) && (
          <div className="flex items-start justify-between gap-2">
            <p
              id={hintId}
              role={hasError ? 'alert' : undefined}
              className={cn('text-xs leading-relaxed', hasError && 'text-danger', hasSuccess && 'text-success', !hasError && !hasSuccess && 'text-text-muted')}
            >
              {error ?? successText ?? helperText}
            </p>
            {showCount && maxLength && (
              <span
                className={cn('text-xs tabular-nums flex-shrink-0', currentLength >= maxLength ? 'text-danger' : 'text-text-muted')}
                aria-live="polite"
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
