'use client'

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

interface ActiveSessionSet {
  setNumber: number
  weight: number
  reps: number
  isPR: boolean
}

interface ActiveSessionExercise {
  exerciseId: string
  exerciseName: string
  sets: ActiveSessionSet[]
}

interface ActiveSession {
  workoutDayId: string
  workoutDayName: string
  sessionDate: string
  startedAt: string
  exercises: ActiveSessionExercise[]
}

interface AppStore {
  // Auth
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Active workout session (persisted so a page reload doesn't lose it)
  activeSession: ActiveSession | null
  setActiveSession: (session: ActiveSession | null) => void

  // Global loading overlay
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
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
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // ── Active session ─────────────────────────────────────────────────────
      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),

      // ── Global loading ─────────────────────────────────────────────────────
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
    }),
    {
      name: 'scanix-app-store',
      // Only persist the active session; UI state (sidebar, loading) resets
      // on every page load intentionally.
      partialize: (state) => ({ activeSession: state.activeSession }),
    },
  ),
)

// Re-export Toast type for consumers
export type { Toast, ActiveSession, ActiveSessionExercise, ActiveSessionSet }
