'use client';

import React, { useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      if (e.key === 'Enter')  { e.preventDefault(); void onConfirm(); }
    },
    [isOpen, onCancel, onConfirm],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertCircle : AlertTriangle;

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />

      <div
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-background-card border border-border rounded-2xl shadow-2xl',
          'flex flex-col gap-5 p-6',
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              isDanger ? 'bg-danger/10' : 'bg-primary/10',
            )}
          >
            <Icon className={cn('w-5 h-5', isDanger ? 'text-danger' : 'text-primary')} aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-text-primary leading-tight">
              {title}
            </h2>
            <p id={descId} className="mt-1 text-sm text-text-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium',
              'bg-transparent border border-border text-text-secondary',
              'hover:bg-surface-2 hover:text-text-primary hover:border-border-strong',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2',
              isDanger
                ? 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger'
                : 'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

export default ConfirmDialog;
