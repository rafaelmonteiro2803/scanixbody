'use client';

import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

// ── Types ────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T = unknown> {
  /** Unique key for the column */
  key: string;
  /** Column heading */
  header: React.ReactNode;
  /** Render cell content — receives the row data */
  cell: (row: T, index: number) => React.ReactNode;
  /** Allow sorting on this column */
  sortable?: boolean;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Fixed column width (e.g. "120px") */
  width?: string;
  /** Hide on small screens */
  hideOnMobile?: boolean;
  /** Header className */
  headerClassName?: string;
  /** Cell className */
  cellClassName?: string;
}

export interface TableProps<T = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Unique key accessor for rows */
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  /** Striped alternating row backgrounds */
  striped?: boolean;
  /** Highlight row on hover */
  hoverable?: boolean;
  /** Allow row click */
  onRowClick?: (row: T) => void;
  /** Controlled sort state */
  sortKey?: string | null;
  sortDir?: SortDirection;
  onSort?: (key: string, dir: SortDirection) => void;
  /** Dense row size */
  dense?: boolean;
}

// ── Sort icon ──────────────────────────────────────────────

function SortIcon({
  direction,
  active,
}: {
  direction: SortDirection;
  active: boolean;
}) {
  if (!active || direction === null) {
    return <ChevronsUpDown className="w-3.5 h-3.5 text-text-muted" aria-hidden />;
  }
  return direction === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5 text-primary" aria-hidden />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-primary" aria-hidden />
  );
}

// ── Component ──────────────────────────────────────────────

export function Table<T = unknown>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = 'Nenhum resultado',
  emptyDescription = 'Não há dados para exibir.',
  emptyIcon,
  striped = false,
  hoverable = true,
  onRowClick,
  sortKey: externalSortKey,
  sortDir: externalSortDir,
  onSort,
  dense = false,
  className,
  ...props
}: TableProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<SortDirection>(null);

  const sortKey = externalSortKey !== undefined ? externalSortKey : internalSortKey;
  const sortDir = externalSortDir !== undefined ? externalSortDir : internalSortDir;

  const handleSort = useCallback(
    (key: string) => {
      let nextDir: SortDirection;
      if (sortKey === key) {
        nextDir = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc';
      } else {
        nextDir = 'asc';
      }
      const nextKey = nextDir === null ? null : key;

      if (onSort) {
        onSort(nextKey ?? key, nextDir);
      } else {
        setInternalSortKey(nextKey);
        setInternalSortDir(nextDir);
      }
    },
    [sortKey, sortDir, onSort],
  );

  const alignClass: Record<string, string> = {
    left:   'text-left',
    center: 'text-center',
    right:  'text-right',
  };

  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  const headPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={cn('w-full rounded-xl overflow-hidden border border-border', className)}
      {...props}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          {/* ── Head ── */}
          <thead className="bg-background-elevated sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    headPad,
                    'border-b border-border',
                    'text-xs font-semibold text-text-secondary uppercase tracking-wider',
                    'whitespace-nowrap select-none',
                    alignClass[col.align ?? 'left'],
                    col.sortable &&
                      'cursor-pointer hover:text-text-primary transition-colors',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.headerClassName,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : sortDir === 'desc'
                          ? 'descending'
                          : 'none'
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'flex-row-reverse',
                      col.align === 'center' && 'justify-center',
                    )}
                  >
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        direction={sortKey === col.key ? sortDir : null}
                        active={sortKey === col.key}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex justify-center">
                    <Spinner size="lg" label="Carregando..." />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    compact
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-border/60 last:border-0',
                    'transition-colors duration-100',
                    striped && rowIndex % 2 === 1 && 'bg-surface-1',
                    hoverable && 'hover:bg-surface-2',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        cellPad,
                        'text-sm text-text-primary',
                        alignClass[col.align ?? 'left'],
                        col.hideOnMobile && 'hidden md:table-cell',
                        col.cellClassName,
                      )}
                    >
                      {col.cell(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
