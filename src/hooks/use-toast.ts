'use client'

/**
 * SCANIX BODY – useToast hook
 *
 * Lightweight toast notification system built with useState + useEffect.
 * No external dependencies required.
 *
 * Usage:
 *   const { toasts, toast, dismiss } = useToast()
 *
 *   toast.success('Dados salvos com sucesso!')
 *   toast.error('Ocorreu um erro. Tente novamente.')
 *   toast.warning('Atenção: confirme sua ação.')
 *   toast.info('Nova análise disponível.')
 */

import { useState, useCallback, useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title?: string
  message: string
  /** Duration in ms before auto-dismiss. Pass 0 to disable. Default: 4500 */
  duration?: number
  /** Whether the user has started dismissing (used for exit animation) */
  dismissing?: boolean
}

export interface ToastOptions {
  title?: string
  duration?: number
}

export interface UseToastReturn {
  toasts: Toast[]
  /** Add a success toast */
  success: (message: string, options?: ToastOptions) => string
  /** Add an error toast */
  error: (message: string, options?: ToastOptions) => string
  /** Add a warning toast */
  warning: (message: string, options?: ToastOptions) => string
  /** Add an info toast */
  info: (message: string, options?: ToastOptions) => string
  /** Dismiss a toast by id */
  dismiss: (id: string) => void
  /** Dismiss all toasts */
  dismissAll: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DURATION = 4500
const EXIT_ANIMATION_DURATION = 300
const MAX_TOASTS = 5

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

let _counter = 0
function generateId(): string {
  return `toast-${Date.now()}-${++_counter}`
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  // ── Dismiss ────────────────────────────────────────────────────────────────

  const dismiss = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
    )

    // Remove after animation completes
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timersRef.current.delete(`remove-${id}`)
    }, EXIT_ANIMATION_DURATION)

    timersRef.current.set(`remove-${id}`, removeTimer)

    // Clear the auto-dismiss timer if it exists
    const autoTimer = timersRef.current.get(id)
    if (autoTimer) {
      clearTimeout(autoTimer)
      timersRef.current.delete(id)
    }
  }, [])

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, dismissing: true })))
    setTimeout(() => setToasts([]), EXIT_ANIMATION_DURATION)
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  // ── Add toast ──────────────────────────────────────────────────────────────

  const addToast = useCallback(
    (
      variant: ToastVariant,
      message: string,
      options: ToastOptions = {},
    ): string => {
      const id = generateId()
      const duration = options.duration ?? DEFAULT_DURATION

      const newToast: Toast = {
        id,
        variant,
        message,
        title: options.title,
        duration,
        dismissing: false,
      }

      setToasts((prev) => {
        // Enforce max toast limit (remove oldest)
        const capped =
          prev.length >= MAX_TOASTS ? prev.slice(prev.length - MAX_TOASTS + 1) : prev
        return [...capped, newToast]
      })

      // Schedule auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id)
        }, duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismiss],
  )

  // ── Shorthand methods ─────────────────────────────────────────────────────

  const success = useCallback(
    (message: string, options?: ToastOptions) => addToast('success', message, options),
    [addToast],
  )

  const error = useCallback(
    (message: string, options?: ToastOptions) =>
      addToast('error', message, { duration: 6000, ...options }),
    [addToast],
  )

  const warning = useCallback(
    (message: string, options?: ToastOptions) => addToast('warning', message, options),
    [addToast],
  )

  const info = useCallback(
    (message: string, options?: ToastOptions) => addToast('info', message, options),
    [addToast],
  )

  return {
    toasts,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  }
}

// ---------------------------------------------------------------------------
// Global singleton (optional pattern for non-hook usage via an event emitter)
// ---------------------------------------------------------------------------

// Export a simple event-based approach so services can trigger toasts
// without needing the hook directly.

type ToastListener = (variant: ToastVariant, message: string, options?: ToastOptions) => void

const listeners = new Set<ToastListener>()

export const toastEmitter = {
  on(listener: ToastListener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emit(variant: ToastVariant, message: string, options?: ToastOptions) {
    listeners.forEach((l) => l(variant, message, options))
  },
  success(message: string, options?: ToastOptions) {
    this.emit('success', message, options)
  },
  error(message: string, options?: ToastOptions) {
    this.emit('error', message, { duration: 6000, ...options })
  },
  warning(message: string, options?: ToastOptions) {
    this.emit('warning', message, options)
  },
  info(message: string, options?: ToastOptions) {
    this.emit('info', message, options)
  },
}

export default useToast
