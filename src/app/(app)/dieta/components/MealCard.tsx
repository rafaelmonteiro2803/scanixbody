'use client';

import React from 'react';
import {
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Pencil,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MealsRow } from '@/types/database.types';

// ── Types ─────────────────────────────────────────────────────

export interface MealCardProps {
  meal: MealsRow;
  onEdit?: (meal: MealsRow) => void;
  onDelete?: (meal: MealsRow) => void;
  className?: string;
}

// ── Meal label map ─────────────────────────────────────────────

const MEAL_LABELS: Record<string, string> = {
  'café da manhã': 'Café da Manhã',
  cafe_da_manha: 'Café da Manhã',
  almoço: 'Almoço',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  'pré-treino': 'Pré-Treino',
  pre_treino: 'Pré-Treino',
  'pós-treino': 'Pós-Treino',
  pos_treino: 'Pós-Treino',
  suplemento: 'Suplemento',
  outro: 'Outro',
};

const MEAL_COLORS: Record<string, string> = {
  'café da manhã': 'text-warning border-warning/30 bg-warning/10',
  cafe_da_manha: 'text-warning border-warning/30 bg-warning/10',
  almoço: 'text-primary border-primary/30 bg-primary/10',
  almoco: 'text-primary border-primary/30 bg-primary/10',
  jantar: 'text-accent border-accent/30 bg-accent/10',
  lanche: 'text-warning border-warning/30 bg-warning/10',
  'pré-treino': 'text-success border-success/30 bg-success/10',
  pre_treino: 'text-success border-success/30 bg-success/10',
  'pós-treino': 'text-primary border-primary/30 bg-primary/10',
  pos_treino: 'text-primary border-primary/30 bg-primary/10',
  suplemento: 'text-accent border-accent/30 bg-accent/10',
  outro: 'text-text-secondary border-border bg-surface-2',
};

// ── Component ──────────────────────────────────────────────────

export function MealCard({ meal, onEdit, onDelete, className }: MealCardProps) {
  const normalizedName = meal.meal_name.toLowerCase();
  const displayLabel = MEAL_LABELS[normalizedName] ?? meal.meal_name;
  const colorClass = MEAL_COLORS[normalizedName] ?? 'text-text-secondary border-border bg-surface-2';

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border bg-background-card',
        'shadow-card transition-all duration-200',
        'hover:border-border-strong hover:shadow-card-lg',
        className,
      )}
    >
      {/* Green left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary/50" />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Meal type badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                'shrink-0',
                colorClass,
              )}
            >
              <UtensilsCrossed className="w-3 h-3" />
              {displayLabel}
            </span>

            {/* Time badge */}
            {meal.time && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-text-secondary border border-border bg-surface-2 shrink-0">
                <Clock className="w-3 h-3" />
                {meal.time}
              </span>
            )}
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(meal)}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    'text-text-muted hover:text-text-primary hover:bg-surface-3',
                    'transition-colors duration-150',
                  )}
                  aria-label={`Editar ${displayLabel}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(meal)}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    'text-text-muted hover:text-danger hover:bg-danger/10',
                    'transition-colors duration-150',
                  )}
                  aria-label={`Excluir ${displayLabel}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Food items description */}
        {meal.items && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-2">
            {meal.items}
          </p>
        )}

        {/* Macro badges */}
        <div className="flex flex-wrap gap-2">
          {meal.calories != null && (
            <MacroBadge
              icon={<Flame className="w-3 h-3" />}
              value={`${meal.calories}`}
              unit="kcal"
              color="text-orange-400 bg-orange-400/10 border-orange-400/25"
            />
          )}
          {meal.protein_g != null && (
            <MacroBadge
              icon={<Beef className="w-3 h-3" />}
              value={`${meal.protein_g}g`}
              unit="prot"
              color="text-blue-400 bg-blue-400/10 border-blue-400/25"
            />
          )}
          {meal.carbs_g != null && (
            <MacroBadge
              icon={<Wheat className="w-3 h-3" />}
              value={`${meal.carbs_g}g`}
              unit="carb"
              color="text-yellow-400 bg-yellow-400/10 border-yellow-400/25"
            />
          )}
          {meal.fat_g != null && (
            <MacroBadge
              icon={<Droplets className="w-3 h-3" />}
              value={`${meal.fat_g}g`}
              unit="gord"
              color="text-orange-500 bg-orange-500/10 border-orange-500/25"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── MacroBadge sub-component ───────────────────────────────────

interface MacroBadgeProps {
  icon: React.ReactNode;
  value: string;
  unit: string;
  color: string;
}

function MacroBadge({ icon, value, unit, color }: MacroBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border',
        color,
      )}
    >
      {icon}
      <span>{value}</span>
      <span className="opacity-70 font-normal">{unit}</span>
    </span>
  );
}

export default MealCard;
