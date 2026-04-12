'use client'

/**
 * SCANIX BODY – ConfirmDialog
 *
 * A reusable confirmation dialog rendered via a Portal.
 *
 * Props:
 *   isOpen      – controls visibility
 *   title       – dialog heading
 *   message     – body copy
 *   confirmText – label for the primary action button (default: "Confirmar")
 *   cancelText  – label for the cancel button (default: "Cancelar")
 *   onConfirm   – called when the user clicks the confirm button
 *   onCancel    – called when the user cancels (button, backdrop, ESC)
 *   variant     – 'default' (blue confirm) | 'danger' (red confirm)
 *
 * Keyboard:
 *   ESC   → cancel
 *   Enter → confirm
 */

import React, { useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  variant?: 'default' | 'danger'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const titleId = useId()
  const descId = useId()

  // ── Keyboard handlers ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        void onConfirm()
      }
    },
    [isOpen, onCancel, onConfirm],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Body scroll lock ─────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── Derived styles ────────────────────────────────────────────────────────

  const isDanger = variant === 'danger'

  const iconBgClass = isDanger
    ? 'bg-red-500/10'
    : 'bg-[#00d4ff]/10'

  const iconColorClass = isDanger
    ? 'text-red-500'
    : 'text-[#00d4ff]'

  const confirmButtonClass = isDanger
    ? [
        'bg-red-600 hover:bg-red-700 active:bg-red-800',
        'text-white font-semibold',
        'focus-visible:ring-red-500',
      ].join(' ')
    : [
        'bg-[#00d4ff] hover:bg-[#00b8e0] active:bg-[#009dc0]',
        'text-[#0a0a0a] font-semibold',
        'focus-visible:ring-[#00d4ff]',
      ].join(' ')

  const Icon = isDanger ? AlertCircle : AlertTriangle

  // ── Portal content ────────────────────────────────────────────────────────

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl',
          'flex flex-col gap-5 p-6',
          'animate-modal-content',
        )}
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              iconBgClass,
            )}
          >
            <Icon className={cn('w-5 h-5', iconColorClass)} aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold text-white leading-tight"
            >
              {title}
            </h2>
            <p
              id={descId}
              className="mt-1 text-sm text-[#a0a0a0] leading-relaxed"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium',
              'bg-transparent border border-[#333333] text-[#a0a0a0]',
              'hover:bg-[#1a1a1a] hover:text-white hover:border-[#444444]',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            )}
          >
            {cancelText}
          </button>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => void onConfirm()}
            className={cn(
              'px-4 py-2 rounded-xl text-sm',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2',
              confirmButtonClass,
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

export default ConfirmDialog
