'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TextareaVariant = 'default' | 'filled';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  successText?: string;
  variant?: TextareaVariant;
  resize?: TextareaResize;
  fullWidth?: boolean;
  showCount?: boolean;
  required?: boolean;
  rows?: number;
}

const variantStyles: Record<TextareaVariant, string> = {
  default: cn(
    'bg-background-secondary border border-border',
    'hover:border-border-strong',
    'focus:border-primary focus:ring-1 focus:ring-primary',
  ),
  filled: cn(
    'bg-surface-2 border border-transparent',
    'hover:bg-surface-3',
    'focus:bg-background-secondary focus:border-primary focus:ring-1 focus:ring-primary',
  ),
};

const resizeStyles: Record<TextareaResize, string> = {
  none:       'resize-none',
  vertical:   'resize-y',
  horizontal: 'resize-x',
  both:       'resize',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      successText,
      variant = 'default',
      resize = 'vertical',
      fullWidth = true,
      showCount = false,
      required,
      rows = 4,
      className,
      id: externalId,
      maxLength,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = externalId ?? `textarea-${generatedId}`;
    const hintId = `${id}-hint`;

    const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() ?? '');
    const currentLength = value !== undefined ? String(value).length : internalValue.length;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(successText) && !hasError;

    const stateStyle = hasError
      ? 'border-danger hover:border-danger focus:border-danger focus:ring-danger'
      : hasSuccess
        ? 'border-success hover:border-success focus:border-success focus:ring-success'
        : variantStyles[variant];

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-secondary select-none">
            {label}
            {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={error || helperText || successText ? hintId : undefined}
            onChange={(e) => {
              setInternalValue(e.target.value);
              onChange?.(e);
            }}
            className={cn(
              'w-full rounded-lg px-3 py-2.5 text-sm',
              'text-text-primary placeholder:text-text-tertiary',
              'transition-all duration-150',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              resizeStyles[resize],
              stateStyle,
            )}
            {...props}
          />
          {hasError && (
            <div className="absolute top-3 right-3 pointer-events-none">
              <AlertCircle className="w-4 h-4 text-danger" aria-hidden />
            </div>
          )}
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

Textarea.displayName = 'Textarea';
export default Textarea;
