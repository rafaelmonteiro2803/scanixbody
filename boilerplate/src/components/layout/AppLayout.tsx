'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}

interface AppLayoutProps {
  user: AppUser;
  children: React.ReactNode;
}

export function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />

      <div className="flex flex-col flex-1 min-w-0 md:ml-64">
        {/* Mobile-only top bar */}
        <Header />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
