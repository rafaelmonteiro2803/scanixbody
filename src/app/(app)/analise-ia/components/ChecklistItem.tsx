'use client';

import React from 'react';
import { LucideIcon, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────

export type ChecklistStatus = 'complete' | 'incomplete' | 'empty';

export interface ChecklistItemProps {
  module: string;
  icon: LucideIcon;
  status: ChecklistStatus;
  text: string;
}

// ── Helpers ───────────────────────────────────────────────────

const statusConfig: Record<
  ChecklistStatus,
  {
    badgeVariant: 'success' | 'warning' | 'danger' | 'default';
    badgeLabel: string;
    borderColor: string;
    bgColor: string;
    iconColor: string;
    indicatorIcon: React.ReactNode;
  }
> = {
  complete: {
    badgeVariant: 'success',
    badgeLabel: 'Completo',
    borderColor: 'border-[#00ff88]/20',
    bgColor: 'bg-[#00ff88]/5',
    iconColor: '#00ff88',
    indicatorIcon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />,
  },
  incomplete: {
    badgeVariant: 'warning',
    badgeLabel: 'Incompleto',
    borderColor: 'border-[#ffaa00]/20',
    bgColor: 'bg-[#ffaa00]/5',
    iconColor: '#ffaa00',
    indicatorIcon: <AlertTriangle className="w-4 h-4 text-[#ffaa00]" />,
  },
  empty: {
    badgeVariant: 'danger',
    badgeLabel: 'Vazio',
    borderColor: 'border-[#ff4444]/15',
    bgColor: 'bg-[#ff4444]/5',
    iconColor: '#3a3a3a',
    indicatorIcon: <XCircle className="w-4 h-4 text-[#ff4444]" />,
  },
};

// ── Component ─────────────────────────────────────────────────

export function ChecklistItem({ module, icon: Icon, status, text }: ChecklistItemProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all duration-200',
        config.borderColor,
        config.bgColor,
      )}
    >
      {/* Status indicator dot */}
      <div className="absolute top-3 right-3">
        {config.indicatorIcon}
      </div>

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${config.iconColor}15` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: config.iconColor }} />
      </div>

      {/* Module name */}
      <p className="text-sm font-bold text-white mb-1.5 pr-6">{module}</p>

      {/* Status badge */}
      <div className="mb-2">
        <Badge variant={config.badgeVariant} size="sm">
          {config.badgeLabel}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-[#666] leading-relaxed">{text}</p>
    </div>
  );
}

export default ChecklistItem;
