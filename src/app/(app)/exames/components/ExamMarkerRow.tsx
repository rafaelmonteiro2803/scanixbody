'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ExamMarkerStatus } from '@/types/domain.types';
import type { ExamMarker } from '@/services/exames.service';

// ── Status config ──────────────────────────────────────────────

interface StatusConfig {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  blink?: boolean;
}

const STATUS_CONFIG: Record<ExamMarkerStatus, StatusConfig> = {
  normal: {
    label: 'Normal',
    colorClass: 'text-[#00ff88]',
    bgClass: 'bg-[#00ff88]/10',
    borderClass: 'border-[#00ff88]/30',
  },
  alto: {
    label: 'Alto',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
  },
  baixo: {
    label: 'Baixo',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
  },
  critico: {
    label: 'Crítico',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/50',
    blink: true,
  },
};

// ── Props ──────────────────────────────────────────────────────

export interface ExamMarkerRowProps {
  marker: ExamMarker;
  isEven?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export function ExamMarkerRow({ marker, isEven = false }: ExamMarkerRowProps) {
  const status = marker.status as ExamMarkerStatus | null;
  const cfg = status ? STATUS_CONFIG[status] : null;

  return (
    <tr
      className={cn(
        'border-b border-white/5 transition-colors',
        isEven ? 'bg-white/[0.01]' : '',
        'hover:bg-white/[0.04]',
      )}
    >
      {/* Marker name */}
      <td className="px-4 py-3 text-sm font-medium text-white">
        {marker.marker_name}
      </td>

      {/* Value */}
      <td className="px-4 py-3 text-sm font-mono font-semibold text-white/90">
        {marker.value ?? '—'}
        {marker.unit && (
          <span className="ml-1 text-xs font-normal text-white/40">{marker.unit}</span>
        )}
      </td>

      {/* Reference range */}
      <td className="px-4 py-3 text-xs text-white/40 font-mono">
        {marker.reference_range ?? '—'}
      </td>

      {/* Status badge */}
      <td className="px-4 py-3">
        {cfg ? (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
              cfg.colorClass,
              cfg.bgClass,
              cfg.borderClass,
              cfg.blink && 'animate-pulse',
            )}
          >
            {cfg.blink && (
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full mr-1.5 inline-block',
                  'bg-red-400 animate-ping',
                )}
                aria-hidden
              />
            )}
            {cfg.label}
          </span>
        ) : (
          <span className="text-xs text-white/25">—</span>
        )}
      </td>
    </tr>
  );
}

export default ExamMarkerRow;
