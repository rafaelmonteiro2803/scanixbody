'use client'

/**
 * SCANIX BODY – Toast notification component
 *
 * Renders a stack of toast notifications at the bottom-right of the viewport.
 * Connects to the `useToast` hook and optionally to the `toastEmitter` for
 * fire-and-forget usage from outside React.
 *
 * Usage (inside a layout or page):
 *   <ToastProvider />
 *
 * With hook:
 *   const { toasts, success, error, dismiss } = useToast()
 *   <ToastContainer toasts={toasts} onDismiss={dismiss} />
 */

import React, { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, toastEmitter } from '@/hooks/use-toast'
import type { Toast, ToastVariant } from '@/hooks/use-toast'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    icon: React.ElementType
    containerClass: string
    iconClass: string
    titleClass: string
    messageClass: string
    progressClass: string
  }
> = {
  success: {
    icon: CheckCircle2,
    containerClass:
      'border-[#00ff88]/25 bg-[#0d1a12] shadow-[0_0_24px_rgba(0,255,136,0.08)]',
    iconClass: 'text-[#00ff88]',
    titleClass: 'text-white',
    messageClass: 'text-[#a0a0a0]',
    progressClass: 'bg-[#00ff88]',
  },
  error: {
    icon: AlertCircle,
    containerClass:
      'border-[#ff4444]/25 bg-[#1a0d0d] shadow-[0_0_24px_rgba(255,68,68,0.08)]',
    iconClass: 'text-[#ff4444]',
    titleClass: 'text-white',
    messageClass: 'text-[#a0a0a0]',
    progressClass: 'bg-[#ff4444]',
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      'border-[#ffaa00]/25 bg-[#1a1500] shadow-[0_0_24px_rgba(255,170,0,0.08)]',
    iconClass: 'text-[#ffaa00]',
    titleClass: 'text-white',
    messageClass: 'text-[#a0a0a0]',
    progressClass: 'bg-[#ffaa00]',
  },
  info: {
    icon: Info,
    containerClass:
      'border-[#00d4ff]/25 bg-[#0d1419] shadow-[0_0_24px_rgba(0,212,255,0.08)]',
    iconClass: 'text-[#00d4ff]',
    titleClass: 'text-white',
    messageClass: 'text-[#a0a0a0]',
    progressClass: 'bg-[#00d4ff]',
  },
}

// ---------------------------------------------------------------------------
// Single Toast item
// ---------------------------------------------------------------------------

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = VARIANT_CONFIG[toast.variant]
  const Icon = config.icon
  const duration = toast.duration ?? 4500

  return (
    <div
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border p-4',
        'transition-all duration-300 ease-out',
        config.containerClass,
        toast.dismissing
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100',
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <Icon className={cn('h-5 w-5', config.iconClass)} aria-hidden />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pr-4">
        {toast.title && (
          <p className={cn('text-sm font-bold leading-tight', config.titleClass)}>
            {toast.title}
          </p>
        )}
        <p
          className={cn(
            'text-sm leading-snug',
            config.messageClass,
            toast.title && 'mt-0.5',
          )}
        >
          {toast.message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg text-[#444444] transition-colors hover:bg-white/5 hover:text-[#a0a0a0]"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Progress bar (auto-dismiss timer) */}
      {duration > 0 && !toast.dismissing && (
        <div
          className="absolute bottom-0 left-0 h-0.5 rounded-full"
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
            transformOrigin: 'left',
          }}
        >
          <div className={cn('h-full w-full', config.progressClass)} />
        </div>
      )}

    </div>
  )
}

// Keyframes are defined once globally via a style element mounted to <head>
// by the ToastProvider. This avoids any Styled JSX dependency.
const KEYFRAMES_ID = 'scanix-toast-keyframes'

function injectToastKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(KEYFRAMES_ID)) return
  const style = document.createElement('style')
  style.id = KEYFRAMES_ID
  style.textContent = `
    @keyframes toast-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `
  document.head.appendChild(style)
}

// ---------------------------------------------------------------------------
// Toast container
// ---------------------------------------------------------------------------

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notificações"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
      style={{ maxWidth: 'min(calc(100vw - 2rem), 24rem)' }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ToastProvider — drop into your layout, wires up everything
// ---------------------------------------------------------------------------

/**
 * Drop `<ToastProvider />` once in your root layout (inside a Client Component
 * wrapper if you need it).  It renders the toast container and listens to
 * the `toastEmitter` for programmatic toasts from outside React.
 */
export function ToastProvider() {
  const { toasts, success, error, warning, info, dismiss } = useToast()

  // Inject CSS keyframes once
  useEffect(() => {
    injectToastKeyframes()
  }, [])

  // Connect external emitter to hook methods
  useEffect(() => {
    const off = toastEmitter.on((variant, message, options) => {
      switch (variant) {
        case 'success':
          success(message, options)
          break
        case 'error':
          error(message, options)
          break
        case 'warning':
          warning(message, options)
          break
        case 'info':
          info(message, options)
          break
      }
    })
    return off
  }, [success, error, warning, info])

  return <ToastContainer toasts={toasts} onDismiss={dismiss} />
}

// ---------------------------------------------------------------------------
// Inline toast hook — returns pre-wired toast container + methods
// ---------------------------------------------------------------------------

/**
 * Alternative: mount your own container alongside hook usage.
 *
 * const { ToastContainer, toast } = useInlineToast()
 */
export function useInlineToast() {
  const { toasts, success, error, warning, info, dismiss } = useToast()

  const Renderer = () => (
    <ToastContainer toasts={toasts} onDismiss={dismiss} />
  )
  Renderer.displayName = 'InlineToastContainer'

  return {
    Renderer,
    toast: { success, error, warning, info },
    dismiss,
    toasts,
  }
}

export default ToastProvider
