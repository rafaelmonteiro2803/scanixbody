'use client'

/**
 * MY APP – useToast hook
 *
 * Convenience wrapper around the global app store's toast actions.
 *
 * Usage:
 *   const { success, error } = useToast()
 *   success('Saved!', 'Your changes have been saved.')
 */

import { useAppStore } from '@/stores/app.store'

export function useToast() {
  const addToast = useAppStore((s) => s.addToast)
  const removeToast = useAppStore((s) => s.removeToast)

  const success = (title: string, message?: string) =>
    addToast({ type: 'success', title, message })

  const error = (title: string, message?: string) =>
    addToast({ type: 'error', title, message })

  const warning = (title: string, message?: string) =>
    addToast({ type: 'warning', title, message })

  const info = (title: string, message?: string) =>
    addToast({ type: 'info', title, message })

  return { success, error, warning, info, removeToast }
}
