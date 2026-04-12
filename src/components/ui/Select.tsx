'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value?: T | null;
  onChange?: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Render a native <select> on mobile */
  nativeOnMobile?: boolean;
}

// ── Style Maps ─────────────────────────────────────────────

const sizeStyles = {
  sm: { trigger: 'h-8 px-3 text-xs rounded-md', icon: 'w-3.5 h-3.5' },
  md: { trigger: 'h-10 px-3 text-sm rounded-lg', icon: 'w-4 h-4' },
  lg: { trigger: 'h-12 px-4 text-base rounded-xl', icon: 'w-5 h-5' },
};

// ── Component ──────────────────────────────────────────────

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  label,
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  size = 'md',
  className,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const triggerId = useId();
  const listboxId = useId();

  const selectedOption = options.find((o) => o.value === value);
  const s = sizeStyles[size];
  const hasError = Boolean(error);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex]);

  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const enabledOptions = options.filter((o) => !o.disabled);

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        } else {
          setIsOpen((v) => !v);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((i) => {
            const next = i + 1;
            return next < options.length ? next : i;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((i) => (i > 0 ? i - 1 : 0));
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        // Type-ahead: jump to first option matching the key
        if (e.key.length === 1) {
          const match = enabledOptions.findIndex((o) =>
            o.label.toLowerCase().startsWith(e.key.toLowerCase()),
          );
          if (match >= 0) {
            setFocusedIndex(options.indexOf(enabledOptions[match]));
            if (!isOpen) setIsOpen(true);
          }
        }
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={triggerId}
          className="text-sm font-medium text-text-secondary select-none"
        >
          {label}
        </label>
      )}

      {/* Trigger + dropdown container */}
      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((v) => !v)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'bg-background-secondary border text-text-primary',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            s.trigger,
            hasError
              ? 'border-danger'
              : isOpen
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:border-border-strong',
          )}
        >
          <span
            className={cn(
              'flex items-center gap-2 min-w-0 flex-1 truncate',
              !selectedOption && 'text-text-tertiary',
            )}
          >
            {selectedOption?.icon && (
              <span className={cn('flex-shrink-0', s.icon)} aria-hidden>
                {selectedOption.icon}
              </span>
            )}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              s.icon,
              'flex-shrink-0 text-text-muted transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            className={cn(
              'absolute z-50 mt-1 w-full',
              'bg-background-elevated border border-border rounded-xl shadow-card-lg',
              'py-1 overflow-y-auto max-h-60',
              'animate-slide-up',
            )}
          >
            {options.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-text-muted text-center">
                Nenhuma opção
              </li>
            ) : (
              options.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = idx === focusedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer',
                      'text-sm transition-colors duration-100 select-none',
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isFocused
                          ? 'bg-surface-3 text-text-primary'
                          : isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-primary hover:bg-surface-2',
                    )}
                  >
                    {option.icon && (
                      <span className={cn('flex-shrink-0', s.icon)} aria-hidden>
                        {option.icon}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-text-muted truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        className="flex-shrink-0 w-4 h-4 text-primary"
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {/* Helper / error text */}
      {(error || helperText) && (
        <p
          role={hasError ? 'alert' : undefined}
          className={cn(
            'text-xs leading-relaxed',
            hasError ? 'text-danger' : 'text-text-muted',
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

export default Select;
