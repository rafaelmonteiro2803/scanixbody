'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Add additional client-side providers here as the app grows.
// (e.g. ThemeProvider, QueryClientProvider, etc.)
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      {children}
      <ToastProvider />
    </>
  );
}

export default AppProviders;
