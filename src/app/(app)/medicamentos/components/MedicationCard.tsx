'use client';

import React from 'react';
import {
  Pencil,
  Trash2,
  Pill,
  Calendar,
  Clock,
  Route,
  StickyNote,
  FlaskConical,
  Dna,
  Leaf,
  ShieldAlert,
  Atom,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { MedicationEntry } from '@/services/medicamentos.service';
import type { MedicationCategory } from '@/types/domain.types';

// ── Category config ────────────────────────────────────────────

interface CategoryConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG: Record<MedicationCategory, CategoryConfig> = {
  hormonio: {
    label: 'Hormônio',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
  },
  peptideo: {
    label: 'Peptídeo',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <Dna className="w-3.5 h-3.5" />,
  },
  suplemento: {
    label: 'Suplemento',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: <Leaf className="w-3.5 h-3.5" />,
  },
  medicamento: {
    label: 'Medicamento',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: <Pill className="w-3.5 h-3.5" />,
  },
  sarm: {
    label: 'SARM',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <Atom className="w-3.5 h-3.5" />,
  },
  outro: {
    label: 'Outro',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    icon: <MoreHorizontal className="w-3.5 h-3.5" />,
  },
};

// Route display labels
const ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  im: 'Intramuscular',
  sc: 'Subcutânea',
  sublingual: 'Sublingual',
  transdérmica: 'Transdérmica',
  outro: 'Outro',
};

// ── Props ─────────────────────────────────────────────────────

export interface MedicationCardProps {
  medication: MedicationEntry;
  onEdit: (medication: MedicationEntry) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export function MedicationCard({
  medication,
  onEdit,
  onDelete,
  isDeleting = false,
}: MedicationCardProps) {
  const category = medication.category as MedicationCategory;
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.outro;

  const formattedDate = medication.start_date
    ? new Date(medication.start_date + 'T00:00:00').toLocaleDateString('pt-BR')
    : null;

  const routeLabel = medication.route
    ? ROUTE_LABELS[medication.route] ?? medication.route
    : null;

  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all duration-200 group',
        'bg-[#161616] hover:border-white/15',
        cfg.border,
      )}
    >
      {/* Top accent line */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] rounded-t-xl', cfg.bg)} />

      <div className="p-4 pt-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Category icon bubble */}
            <div
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5',
                cfg.bg,
              )}
            >
              <span className={cfg.color}>{cfg.icon}</span>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white leading-tight truncate">
                {medication.name}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                  cfg.color,
                  cfg.bg,
                  cfg.border,
                )}
              >
                {cfg.icon}
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onEdit(medication)}
              aria-label={`Editar ${medication.name}`}
              className="text-white/40 hover:text-white hover:bg-white/10"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete(medication.id)}
              loading={isDeleting}
              aria-label={`Excluir ${medication.name}`}
              className="text-red-400/60 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Detail pills */}
        <div className="flex flex-wrap gap-1.5">
          {medication.dose && (
            <DetailPill icon={<Pill className="w-3 h-3" />} label={medication.dose} />
          )}
          {medication.frequency && (
            <DetailPill icon={<Clock className="w-3 h-3" />} label={medication.frequency} />
          )}
          {routeLabel && (
            <DetailPill icon={<Route className="w-3 h-3" />} label={routeLabel} />
          )}
          {formattedDate && (
            <DetailPill
              icon={<Calendar className="w-3 h-3" />}
              label={`Início: ${formattedDate}`}
            />
          )}
        </div>

        {/* Notes */}
        {medication.notes && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-white/40">
            <StickyNote className="w-3 h-3 flex-shrink-0 mt-0.5 text-white/25" />
            <p className="leading-relaxed line-clamp-2">{medication.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[11px] text-white/55">
      <span className="text-white/35">{icon}</span>
      {label}
    </span>
  );
}

export default MedicationCard;
