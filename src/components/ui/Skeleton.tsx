/**
 * SCANIX BODY — Skeleton Loading Primitives
 *
 * All variants use the `.skeleton` CSS class (shimmer animation defined in
 * globals.css). Use these instead of a centred <Spinner> when the page has
 * known content shapes — it reduces perceived load time and avoids layout
 * shift once data arrives.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ── Base shimmer block ────────────────────────────────────────────────────────

interface SkeletonLineProps {
  className?: string;
}

export function SkeletonLine({ className }: SkeletonLineProps) {
  return <div className={cn('skeleton rounded', className)} />;
}

// ── Stat card (matches StatCard layout) ──────────────────────────────────────

export function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-border bg-background-card p-5">
      <SkeletonLine className="h-3 w-24 mb-3" />
      <SkeletonLine className="h-7 w-16" />
    </div>
  );
}

// ── Generic card (title + a few body lines) ───────────────────────────────────

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-background-card p-5', className)}>
      <SkeletonLine className="h-4 w-2/5 mb-4" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} className={cn('h-3', i === lines - 1 ? 'w-3/5' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

// ── List item (icon circle + text lines, matches session/exam/medication rows) ─

export function SkeletonListItem() {
  return (
    <div className="rounded-xl border border-border bg-background-card px-5 py-4 flex items-center gap-4">
      <SkeletonLine className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3.5 w-2/5" />
        <SkeletonLine className="h-3 w-3/5" />
      </div>
      <SkeletonLine className="h-6 w-16 rounded-full flex-shrink-0" />
    </div>
  );
}

// ── Stat row (3 or 4 stats side by side) ─────────────────────────────────────

interface SkeletonStatRowProps {
  count?: number;
}

export function SkeletonStatRow({ count = 3 }: SkeletonStatRowProps) {
  return (
    <div className={cn('grid gap-4', count === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3')}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}

// ── Page-level list skeleton (stat row + N list items) ───────────────────────

interface SkeletonPageListProps {
  stats?: number;
  rows?: number;
}

export function SkeletonPageList({ stats = 0, rows = 5 }: SkeletonPageListProps) {
  return (
    <div className="space-y-4">
      {stats > 0 && <SkeletonStatRow count={stats} />}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  );
}
