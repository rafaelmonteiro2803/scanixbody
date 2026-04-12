'use client';

import React from 'react';
import { Flame, Beef, Wheat, Droplets, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────

export interface MacroSummaryProps {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────

function pct(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((value / target) * 100), 100);
}

function progressColor(p: number): string {
  if (p >= 100) return 'bg-danger';
  if (p >= 80) return 'bg-primary';
  if (p >= 50) return 'bg-warning';
  return 'bg-text-tertiary';
}

// ── MacroRow ──────────────────────────────────────────────────

interface MacroRowProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  target?: number;
  unit: string;
  barColor: string;
  iconColor: string;
}

function MacroRow({ label, icon, value, target, unit, barColor, iconColor }: MacroRowProps) {
  const percentage = target ? pct(value, target) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('flex-shrink-0', iconColor)}>{icon}</span>
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-sm font-bold text-text-primary tabular-nums">
            {value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-text-muted ml-0.5">{unit}</span>
          </span>
          {target && (
            <span className="text-xs text-text-tertiary tabular-nums">
              / {target.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}{unit}
            </span>
          )}
        </div>
      </div>
      {target ? (
        <div className="w-full h-2 rounded-full bg-background-elevated overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
        <div className="w-full h-2 rounded-full bg-background-elevated" />
      )}
      {target && (
        <div className="flex justify-between">
          <span className="text-2xs text-text-tertiary">{percentage}% da meta</span>
          {percentage >= 100 && (
            <span className="text-2xs text-danger font-semibold">Meta atingida</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function MacroSummary({
  calories,
  protein_g,
  carbs_g,
  fat_g,
  target_calories,
  target_protein_g,
  target_carbs_g,
  target_fat_g,
  className,
}: MacroSummaryProps) {
  const calPct = target_calories ? pct(calories, target_calories) : 0;
  const calColor = progressColor(calPct);

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background-card shadow-card p-4 space-y-5',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Resumo do Dia
          </h3>
        </div>
        {target_calories && (
          <span
            className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full border',
              calPct >= 100
                ? 'text-danger bg-danger/10 border-danger/25'
                : calPct >= 80
                  ? 'text-primary bg-primary/10 border-primary/25'
                  : 'text-text-secondary bg-surface-2 border-border',
            )}
          >
            {calPct}% da meta calórica
          </span>
        )}
      </div>

      {/* Total Calories — large display */}
      <div className="rounded-xl bg-background-elevated border border-border p-4">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Calorias Totais</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary tabular-nums font-display">
                {calories.toLocaleString('pt-BR')}
              </span>
              <span className="text-sm text-text-muted">kcal</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
        </div>
        {target_calories && (
          <>
            <div className="w-full h-2.5 rounded-full bg-background overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', calColor)}
                style={{ width: `${calPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-2xs text-text-tertiary">0</span>
              <span className="text-2xs text-text-tertiary">{target_calories.toLocaleString('pt-BR')} kcal meta</span>
            </div>
          </>
        )}
      </div>

      {/* Macros */}
      <div className="space-y-4">
        <MacroRow
          label="Proteína"
          icon={<Beef className="w-4 h-4" />}
          value={protein_g}
          target={target_protein_g}
          unit="g"
          barColor="bg-blue-500"
          iconColor="text-blue-400"
        />
        <MacroRow
          label="Carboidratos"
          icon={<Wheat className="w-4 h-4" />}
          value={carbs_g}
          target={target_carbs_g}
          unit="g"
          barColor="bg-yellow-400"
          iconColor="text-yellow-400"
        />
        <MacroRow
          label="Gorduras"
          icon={<Droplets className="w-4 h-4" />}
          value={fat_g}
          target={target_fat_g}
          unit="g"
          barColor="bg-orange-500"
          iconColor="text-orange-400"
        />
      </div>

      {/* Macro distribution */}
      {(protein_g > 0 || carbs_g > 0 || fat_g > 0) && (
        <div>
          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Distribuição</p>
          <div className="flex rounded-full overflow-hidden h-2.5">
            {(() => {
              const totalCal = protein_g * 4 + carbs_g * 4 + fat_g * 9;
              if (totalCal === 0) return null;
              const protPct = Math.round((protein_g * 4 / totalCal) * 100);
              const carbPct = Math.round((carbs_g * 4 / totalCal) * 100);
              const fatPct = 100 - protPct - carbPct;
              return (
                <>
                  <div className="bg-blue-500 transition-all duration-500" style={{ width: `${protPct}%` }} title={`Proteína ${protPct}%`} />
                  <div className="bg-yellow-400 transition-all duration-500" style={{ width: `${carbPct}%` }} title={`Carb ${carbPct}%`} />
                  <div className="bg-orange-500 transition-all duration-500" style={{ width: `${fatPct}%` }} title={`Gordura ${fatPct}%`} />
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {[
              { label: 'Prot', color: 'bg-blue-500', cal: protein_g * 4 },
              { label: 'Carb', color: 'bg-yellow-400', cal: carbs_g * 4 },
              { label: 'Gord', color: 'bg-orange-500', cal: fat_g * 9 },
            ].map(({ label, color, cal }) => {
              const total = protein_g * 4 + carbs_g * 4 + fat_g * 9;
              const p = total > 0 ? Math.round((cal / total) * 100) : 0;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color)} />
                  <span className="text-2xs text-text-muted">{label} <span className="text-text-secondary font-semibold">{p}%</span></span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MacroSummary;
