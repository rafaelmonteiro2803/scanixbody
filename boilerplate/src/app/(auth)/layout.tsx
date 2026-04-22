/**
 * MY APP – Auth Layout
 *
 * Shared layout for unauthenticated routes (/login, /recuperar-senha, etc.).
 * TODO: Add your logo or brand illustration here if needed.
 */

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Optional: branded banner/header above the auth forms */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <footer className="text-center py-4 text-xs text-text-muted">
        &copy; {new Date().getFullYear()} My App. All rights reserved.
        {/* TODO: replace "My App" with your company/product name */}
      </footer>
    </div>
  );
}
