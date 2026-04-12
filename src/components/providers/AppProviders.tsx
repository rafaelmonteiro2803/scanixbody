'use client'

/**
 * SCANIX BODY – AppProviders
 *
 * Wraps the application with all client-side providers that must sit above
 * the component tree.  Add new providers here as the app grows.
 *
 * Current providers:
 *   - ToastProvider  – renders the global toast notification stack
 */

import React from 'react'
import { ToastProvider } from '@/components/ui/Toast'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      {children}
      {/* Toast notifications are rendered in a portal at the bottom-right */}
      <ToastProvider />
    </>
  )
}

export default AppProviders
