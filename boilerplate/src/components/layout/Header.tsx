'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';

export function Header({ title }: { title?: string }) {
  const { setSidebarOpen } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-background border-b border-border px-4 py-3 md:hidden">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>
      {title && <span className="font-semibold text-text-primary text-sm">{title}</span>}
    </header>
  );
}

export default Header;
