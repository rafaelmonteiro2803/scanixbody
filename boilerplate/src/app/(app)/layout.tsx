/**
 * MY APP – App Layout
 *
 * Shared layout for all authenticated routes under /(app).
 * Renders the Sidebar and the main content area.
 * Redirects unauthenticated users to /login (middleware also handles this).
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, email')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar renders itself as a fixed sidebar on desktop */}
      <Sidebar
        user={{
          name: profile?.full_name ?? user.email ?? 'User',
          email: profile?.email ?? user.email,
          role: profile?.role,
          avatarUrl: profile?.avatar_url ?? undefined,
        }}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
