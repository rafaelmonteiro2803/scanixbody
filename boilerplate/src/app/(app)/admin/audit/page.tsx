import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Audit Log' };

export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, resource, resource_id, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-elevated border-b border-border">
              <tr>
                {['Date', 'Action', 'Resource', 'Resource ID', 'User'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-border/60 last:border-0 ${i % 2 === 1 ? 'bg-surface-1' : ''}`}
                >
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{log.resource}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted truncate max-w-[120px]">
                    {log.resource_id ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted truncate max-w-[160px]">
                    {log.user_id}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted text-sm">
                    No audit log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
