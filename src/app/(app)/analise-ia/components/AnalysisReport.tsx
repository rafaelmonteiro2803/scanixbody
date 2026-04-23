'use client';

import React, { forwardRef } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Droplets,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import type { ScoreBreakdown } from '@/types/domain.types';
import type { AnalysisResult } from '@/services/ai.service';

// ── Types ─────────────────────────────────────────────────────

export interface MacroAdjustments {
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  water_ml?: number | null;
}

export interface AnalysisReportProps {
  scores: ScoreBreakdown;
  result: AnalysisResult;
  macroAdjustments?: MacroAdjustments;
  athleteName?: string;
}

// ── Helpers ───────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Atenção';
}

function scoreColor(score: number): string {
  if (score >= 70) return '#00ff88';
  if (score >= 40) return '#ffaa00';
  return '#ff4444';
}

// ── Score Row ─────────────────────────────────────────────────

function ScoreRow({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-text-secondary w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-1 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-12 text-right" style={{ color }}>
        {score}/100
      </span>
      <span className="text-xs text-text-muted w-16">{scoreLabel(score)}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

export const AnalysisReport = forwardRef<HTMLDivElement, AnalysisReportProps>(
  ({ scores, result, macroAdjustments, athleteName }, ref) => {
    const formattedDate = new Date(result.generatedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #analysis-report, #analysis-report * { visibility: visible; }
            #analysis-report { position: fixed; top: 0; left: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>

        <div
          id="analysis-report"
          ref={ref}
          className="bg-background-card rounded-xl border border-border overflow-hidden"
        >
          {/* Report Header */}
          <div className="bg-[#0a0a0a] border-b border-border px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#00ff88] mb-1">
                  SCANIX BODY
                </p>
                <h2 className="text-xl font-black uppercase tracking-wide text-text-title">
                  Relatório de Análise IA
                </h2>
                {athleteName && (
                  <p className="text-text-muted text-sm mt-0.5">{athleteName}</p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-4xl font-black text-[#00ff88]">{scores.overall}</span>
                  <span className="text-text-muted text-sm">/100</span>
                </div>
                <p className="text-xs text-text-muted">Score Geral</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">

            {/* Summary */}
            <section>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00ff88]" />
                Resumo
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed bg-surface-1 rounded-lg p-4 border border-border">
                {result.summary}
              </p>
            </section>

            {/* Scores */}
            <section>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00ff88]" />
                Scores por Dimensão
              </h3>
              <div className="bg-surface-1 rounded-lg p-4 space-y-1 border border-border">
                <ScoreRow label="Treino" score={scores.training} />
                <ScoreRow label="Dieta" score={scores.diet} />
                <ScoreRow label="Sono" score={scores.sleep} />
                <ScoreRow label="Hidratação" score={scores.hydration} />
                <ScoreRow label="Cardio" score={scores.cardio} />
                <div className="pt-2 mt-2 border-t border-border">
                  <ScoreRow label="Score Geral" score={scores.overall} />
                </div>
              </div>
            </section>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                  Pontos Fortes
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-[#00ff88] flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Pontos de Melhoria
                </h3>
                <ul className="space-y-2">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Recomendações
                </h3>
                <ol className="space-y-2 list-none">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00ff88]/15 text-[#00ff88] text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Weekly focus */}
            {result.weeklyFocus && (
              <section>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                  Foco da Semana
                </h3>
                <div className="rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/20 p-4">
                  <p className="text-sm font-semibold text-text-title leading-relaxed">{result.weeklyFocus}</p>
                </div>
              </section>
            )}

            {/* Macro adjustments */}
            {macroAdjustments && (
              <section>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Ajustes Sugeridos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Calorias', value: macroAdjustments.calories, unit: 'kcal' },
                    { label: 'Proteína', value: macroAdjustments.protein_g, unit: 'g' },
                    { label: 'Carboidrato', value: macroAdjustments.carbs_g, unit: 'g' },
                    { label: 'Gordura', value: macroAdjustments.fat_g, unit: 'g' },
                    { label: 'Água', value: macroAdjustments.water_ml, unit: 'ml' },
                  ]
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item) => (
                      <div key={item.label} className="rounded-lg bg-surface-1 border border-border p-3 text-center">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-lg font-black text-text-title">{item.value}</p>
                        <p className="text-xs text-text-faint">{item.unit}/dia</p>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Timeline */}
            {result.estimatedProgressTimeline && (
              <section>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Projeção de Progresso
                </h3>
                <p className="text-sm text-text-secondary bg-surface-1 rounded-lg p-3 border border-border italic">
                  {result.estimatedProgressTimeline}
                </p>
              </section>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-faint">
                Gerado por SCANIX BODY IA em {formattedDate}
              </p>
              <p className="text-xs text-text-faint">
                Análise de uso exclusivo informativo.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  },
);

AnalysisReport.displayName = 'AnalysisReport';

export default AnalysisReport;
