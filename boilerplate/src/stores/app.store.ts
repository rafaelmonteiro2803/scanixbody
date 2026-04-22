'use client'

/**
 * MY APP – Global Zustand Store
 *
 * Holds UI state that is shared across the application:
 *   - Sidebar open/closed
 *   - Global loading overlay
 *   - Toast notifications
 *   - Confirmation dialog
 *
 * TODO: Add domain-specific slices here as needed, e.g. a shopping cart,
 *       active item selection, or a wizard's step state.
 *       Keep this store lean — heavy domain state belongs in query hooks.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

interface ConfirmDialog {
  open: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface AppStore {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Global loading overlay (use sparingly — prefer local loading states)
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // Toast notifications
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Confirmation dialog
  confirmDialog: ConfirmDialog | null
  showConfirm: (config: Omit<ConfirmDialog, 'open'>) => void
  dismissConfirm: () => void

  // TODO: Add domain-specific state here
  // Example: activeItemId: string | null
  // Example: setActiveItemId: (id: string | null) => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // ── Sidebar ────────────────────────────────────────────────────────────
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // ── Global loading ─────────────────────────────────────────────────────
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // ── Toasts ─────────────────────────────────────────────────────────────
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: `${Date.now()}-${Math.random()}` },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // ── Confirm dialog ─────────────────────────────────────────────────────
      confirmDialog: null,
      showConfirm: (config) => set({ confirmDialog: { ...config, open: true } }),
      dismissConfirm: () => set({ confirmDialog: null }),
    }),
    {
      name: 'my-app-store', // TODO: rename to your app name
      // Only persist sidebar state across page reloads.
      // TODO: add other fields you want persisted (e.g. theme preference).
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
)

export type { Toast, ConfirmDialog }
