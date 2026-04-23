/**
 * MY APP – Dashboard Page
 *
 * The main entry point after login.
 * TODO: Replace the example stat cards with real data from your domain.
 */

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('user_id', user.id)
    .single();

  // TODO: Replace with real aggregate queries for your domain
  const stats = [
    { label: 'Total Products', value: '—' },
    { label: 'Active Orders', value: '—' },
    { label: 'This Month', value: '—' },
    { label: 'Pending', value: '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Here&apos;s what&apos;s happening in your account.
        </p>
      </div>

      {/* ── Stat cards — TODO: wire up real data ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface-1 p-4"
          >
            <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Recent activity — TODO: replace with real data ── */}
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h2>
        <p className="text-sm text-text-muted">No recent activity to show.</p>
        {/* TODO: render a list of recent orders, products, etc. */}
      </div>
    </div>
  );
}
