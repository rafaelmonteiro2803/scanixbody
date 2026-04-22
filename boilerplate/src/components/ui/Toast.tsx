'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast, toastEmitter } from '@/hooks/use-toast';
import type { Toast, ToastVariant } from '@/hooks/use-toast';

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.ElementType;
  containerClass: string;
  iconClass: string;
  titleClass: string;
  messageClass: string;
  progressClass: string;
}> = {
  success: {
    icon: CheckCircle2,
    containerClass: 'border-success/25 bg-success/5 shadow-lg',
    iconClass: 'text-success',
    titleClass: 'text-text-primary',
    messageClass: 'text-text-secondary',
    progressClass: 'bg-success',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'border-danger/25 bg-danger/5 shadow-lg',
    iconClass: 'text-danger',
    titleClass: 'text-text-primary',
    messageClass: 'text-text-secondary',
    progressClass: 'bg-danger',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-warning/25 bg-warning/5 shadow-lg',
    iconClass: 'text-warning',
    titleClass: 'text-text-primary',
    messageClass: 'text-text-secondary',
    progressClass: 'bg-warning',
  },
  info: {
    icon: Info,
    containerClass: 'border-primary/25 bg-primary/5 shadow-lg',
    iconClass: 'text-primary',
    titleClass: 'text-text-primary',
    messageClass: 'text-text-secondary',
    progressClass: 'bg-primary',
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;
  const duration = toast.duration ?? 4500;

  return (
    <div
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border p-4',
        'transition-all duration-300 ease-out',
        'bg-background-card',
        config.containerClass,
        toast.dismissing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Icon className={cn('h-5 w-5', config.iconClass)} aria-hidden />
      </div>

      <div className="min-w-0 flex-1 pr-4">
        {toast.title && (
          <p className={cn('text-sm font-bold leading-tight', config.titleClass)}>{toast.title}</p>
        )}
        <p className={cn('text-sm leading-snug', config.messageClass, toast.title && 'mt-0.5')}>
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {duration > 0 && !toast.dismissing && (
        <div
          className="absolute bottom-0 left-0 h-0.5 rounded-full"
          style={{ animation: `toast-progress ${duration}ms linear forwards`, transformOrigin: 'left' }}
        >
          <div className={cn('h-full w-full', config.progressClass)} />
        </div>
      )}
    </div>
  );
}

const KEYFRAMES_ID = 'boilerplate-toast-keyframes';

function injectToastKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `@keyframes toast-progress { from { width: 100%; } to { width: 0%; } }`;
  document.head.appendChild(style);
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
      style={{ maxWidth: 'min(calc(100vw - 2rem), 24rem)' }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function ToastProvider() {
  const { toasts, success, error, warning, info, dismiss } = useToast();

  useEffect(() => { injectToastKeyframes(); }, []);

  useEffect(() => {
    const off = toastEmitter.on((variant, message, options) => {
      switch (variant) {
        case 'success': success(message, options); break;
        case 'error':   error(message, options);   break;
        case 'warning': warning(message, options);  break;
        case 'info':    info(message, options);     break;
      }
    });
    return off;
  }, [success, error, warning, info]);

  return <ToastContainer toasts={toasts} onDismiss={dismiss} />;
}

export default ToastProvider;
