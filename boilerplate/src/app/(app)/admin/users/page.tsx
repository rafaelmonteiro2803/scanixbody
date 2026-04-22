/**
 * MY APP – Admin Users Page
 *
 * List, create, update, and block/unblock users.
 * Only accessible to 'admin' and 'super_admin' roles (enforced by middleware).
 */

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import adminService from '@/services/admin.service';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const users = await adminService.getUsers({ perPage: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="text-text-muted text-sm mt-1">
          Create, update, and manage user accounts.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background-elevated border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary uppercase text-xs tracking-wide">
                User
              </th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary uppercase text-xs tracking-wide hidden md:table-cell">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary uppercase text-xs tracking-wide hidden md:table-cell">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-text-secondary uppercase text-xs tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/60 last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-primary">
                        {u.profile?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-text-muted">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize hidden md:table-cell">
                    {u.profile?.role ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.profile?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : u.profile?.status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {u.profile?.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
