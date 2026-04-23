'use client';

import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T = unknown> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hideOnMobile?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

export interface TableProps<T = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  onRowClick?: (row: T) => void;
  sortKey?: string | null;
  sortDir?: SortDirection;
  onSort?: (key: string, dir: SortDirection) => void;
  dense?: boolean;
}

function SortIcon({ direction, active }: { direction: SortDirection; active: boolean }) {
  if (!active || direction === null) return <ChevronsUpDown className="w-3.5 h-3.5 text-text-muted" aria-hidden />;
  return direction === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-primary" aria-hidden />
    : <ChevronDown className="w-3.5 h-3.5 text-primary" aria-hidden />;
}

export function Table<T = unknown>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = 'No results',
  emptyDescription = 'No data to display.',
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

  const alignClass: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  const headPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('w-full rounded-xl overflow-hidden border border-border', className)} {...props}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
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
                    col.sortable && 'cursor-pointer hover:text-text-primary transition-colors',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.headerClassName,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={cn('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse', col.align === 'center' && 'justify-center')}>
                    {col.header}
                    {col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} active={sortKey === col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex justify-center">
                    <Spinner size="lg" label="Loading..." />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} compact />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-border/60 last:border-0 transition-colors duration-100',
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
