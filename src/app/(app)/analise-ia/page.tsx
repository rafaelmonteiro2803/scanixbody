'use client';

import React, { useState, useRef } from 'react';
import {
  Dumbbell,
  Salad,
  Moon,
  Droplets,
  HeartPulse,
  Pill,
  FlaskConical,
  Sparkles,
  Loader2,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button, ScoreRing, ProgressBar, Badge } from '@/components/ui';
import { ChecklistItem, type ChecklistStatus } from './components/ChecklistItem';
import { AnalysisReport, type MacroAdjustments } from './components/AnalysisReport';
import type { ScoreBreakdown } from '@/types/domain.types';
import type { AnalysisResult } from '@/services/ai.service';
import { cn } from '@/lib/utils';

// ── Mock data ─────────────────────────────────────────────────

const MOCK_SCORES: ScoreBreakdown = {
  training: 82,
  diet: 67,
  sleep: 55,
  hydration: 73,
  cardio: 60,
  overall: 70,
};

const MOCK_RESULT: AnalysisResult = {
  summary:
    'Seu perfil apresenta boa base de treinamento com consistência acima da média. A dieta está adequada mas com oportunidades de melhoria na distribuição proteica. O sono é o principal ponto de atenção, impactando diretamente a recuperação muscular e os resultados.',
  strengths: [
    'Frequência de treino consistente — 3+ sessões por semana',
    'Ingestão calórica alinhada ao TDEE estimado',
    'Hidratação acima de 90% da meta diária',
    'Perfil de cardio bem estruturado com foco em queima de gordura',
  ],
  improvements: [
    'Qualidade e duração do sono precisam de atenção urgente',
    'Distribuição proteica ao longo do dia pode ser otimizada',
    'Gordura visceral em nível de atenção — monitorar de perto',
    'Ausência de exames laboratoriais recentes dificulta análise completa',
  ],
  recommendations: [
    'Priorize 7–9 horas de sono por noite — estabeleça horários fixos para dormir e acordar',
    'Distribua a proteína em 4–5 refeições para maximizar a síntese proteica',
    'Adicione 2 sessões de cardio LISS de 40 min por semana para redução da gordura visceral',
    'Realize bioimpedância mensal para acompanhar evolução da composição corporal',
    'Considere exames laboratoriais trimestrais para monitorar marcadores metabólicos',
  ],
  weeklyFocus:
    'Esta semana: foque em regularizar o sono. Apague as telas 1 hora antes de dormir e mantenha temperatura do quarto abaixo de 22°C. Sono adequado tem impacto direto em GH, cortisol e recuperação muscular.',
  estimatedProgressTimeline:
    'Com aderência ao plano atual, espera-se redução de 2–3% de gordura corporal e ganho de 0.5–1 kg de massa magra em 8–12 semanas.',
  generatedAt: new Date().toISOString(),
};

const MOCK_MACRO_ADJUSTMENTS: MacroAdjustments = {
  calories: 2600,
  protein_g: 165,
  carbs_g: 280,
  fat_g: 72,
  water_ml: 2800,
};

// ── Checklist config ──────────────────────────────────────────

interface ModuleChecklistConfig {
  module: string;
  icon: React.ElementType;
  status: ChecklistStatus;
  text: string;
}

const MODULE_CHECKLIST: ModuleChecklistConfig[] = [
  {
    module: 'Treinos',
    icon: Dumbbell,
    status: 'complete',
    text: '3 dias configurados, 12 sessões nos últimos 30 dias.',
  },
  {
    module: 'Dieta',
    icon: Salad,
    status: 'incomplete',
    text: 'Refeições registradas em 5 dos últimos 7 dias.',
  },
  {
    module: 'Corpo',
    icon: TrendingUp,
    status: 'complete',
    text: 'Perfil completo com bioimpedância recente.',
  },
  {
    module: 'Cardio',
    icon: HeartPulse,
    status: 'complete',
    text: 'HIIT 3x/semana, 30 min, pós-treino.',
  },
  {
    module: 'Medicamentos',
    icon: Pill,
    status: 'incomplete',
    text: '2 suplementos cadastrados, sem hormônios registrados.',
  },
  {
    module: 'Exames',
    icon: FlaskConical,
    status: 'empty',
    text: 'Nenhum exame laboratorial cadastrado.',
  },
];

const SCORE_RINGS: Array<{ key: keyof ScoreBreakdown; label: string; size: 'sm' | 'md' | 'lg' }> = [
  { key: 'training', label: 'Treino', size: 'sm' },
  { key: 'diet', label: 'Dieta', size: 'sm' },
  { key: 'sleep', label: 'Sono', size: 'sm' },
  { key: 'hydration', label: 'Hidratação', size: 'sm' },
  { key: 'cardio', label: 'Cardio', size: 'sm' },
];

// ── Priority Badge ────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: 'Alta' | 'Média' | 'Baixa' }) {
  const config = {
    Alta: { variant: 'danger' as const, icon: <AlertTriangle className="w-3 h-3" /> },
    Média: { variant: 'warning' as const, icon: <ChevronUp className="w-3 h-3" /> },
    Baixa: { variant: 'default' as const, icon: <ChevronDown className="w-3 h-3" /> },
  };
  const { variant, icon } = config[priority];
  return (
    <Badge variant={variant} size="sm" leftIcon={icon}>
      {priority}
    </Badge>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function AnaliseIAPage() {
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [scores, setScores] = useState<ScoreBreakdown>({
    training: 0, diet: 0, sleep: 0, hydration: 0, cardio: 0, overall: 0,
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Completeness
  const completeCount = MODULE_CHECKLIST.filter((m) => m.status === 'complete').length;
  const completeness = Math.round((completeCount / MODULE_CHECKLIST.length) * 100);

  const handleGenerate = async () => {
    setAnalysisState('loading');
    setResult(null);
    // Simulate AI call
    await new Promise((r) => setTimeout(r, 2800));
    setScores(MOCK_SCORES);
    setResult(MOCK_RESULT);
    setAnalysisState('done');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // In production: generate PDF via html2canvas or similar
    alert('Exportação de PDF disponível na versão completa.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] bg-[#161616] px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00ff88]" />
              ANÁLISE IA
            </h1>
            <p className="text-xs text-[#666] mt-0.5">
              Diagnóstico completo com inteligência artificial
            </p>
          </div>
          {analysisState === 'done' && (
            <Badge variant="success" dot>Análise concluída</Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ── SECTION 1: CHECKLIST ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
              Checklist de Completude
            </h2>
            <span className="text-sm font-bold text-[#00ff88]">{completeness}%</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {MODULE_CHECKLIST.map((item) => (
              <ChecklistItem
                key={item.module}
                module={item.module}
                icon={item.icon}
                status={item.status}
                text={item.text}
              />
            ))}
          </div>

          {/* Completeness bar */}
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
                Completude do perfil
              </span>
              <span className="text-sm font-bold text-white">{completeness}%</span>
            </div>
            <ProgressBar
              value={completeness}
              max={100}
              variant={completeness >= 80 ? 'success' : completeness >= 50 ? 'warning' : 'danger'}
              size="md"
              showLabel={false}
            />
            <p className="text-xs text-[#666] mt-2">
              {completeCount} de {MODULE_CHECKLIST.length} módulos completos.
              {completeness < 100 && ' Complete todos os módulos para uma análise mais precisa.'}
            </p>
          </div>
        </section>

        {/* ── SECTION 2: SCORES ── */}
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#00ff88]" />
            Scores de Desempenho
          </h2>

          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6">
            {/* Overall score centered */}
            <div className="flex justify-center mb-6">
              <ScoreRing
                score={scores.overall}
                size="xl"
                label="Score Geral"
                animated
                category={scores.overall >= 70 ? 'Ótimo' : scores.overall >= 40 ? 'Regular' : 'Atenção'}
              />
            </div>

            {/* Individual scores */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 border-t border-[#2a2a2a] pt-6">
              {SCORE_RINGS.map((ring) => (
                <div key={ring.key} className="flex justify-center">
                  <ScoreRing
                    score={scores[ring.key]}
                    size="sm"
                    label={ring.label}
                    animated
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: GENERATE ── */}
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#00ff88]" />
            Gerar Análise
          </h2>

          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center">
            {analysisState === 'idle' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-[#00ff88]" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Pronto para analisar</p>
                  <p className="text-sm text-[#666] mt-1 max-w-md mx-auto">
                    Nossa IA irá processar todos os seus dados — treinos, dieta, corpo, cardio,
                    medicamentos e exames — para gerar um relatório completo e personalizado.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  onClick={handleGenerate}
                  className="mx-auto"
                >
                  Gerar Análise com IA
                </Button>
              </div>
            )}

            {analysisState === 'loading' && (
              <div className="space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-[#00ff88] animate-pulse" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Analisando seus dados...</p>
                  <p className="text-sm text-[#666] mt-1">
                    Processando treinos, dieta, composição corporal e mais
                  </p>
                </div>
                {/* Pulsing dots */}
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#00ff88]"
                      style={{
                        animation: `pulse 1.5s ease-in-out ${i * 0.25}s infinite`,
                        opacity: 0.3,
                      }}
                    />
                  ))}
                </div>
                {/* Progress steps */}
                <div className="text-left max-w-xs mx-auto space-y-2">
                  {[
                    'Calculando scores por dimensão',
                    'Processando composição corporal',
                    'Analisando padrão alimentar',
                    'Gerando recomendações personalizadas',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Loader2 className="w-3.5 h-3.5 text-[#00ff88] animate-spin flex-shrink-0" />
                      <span className="text-[#a0a0a0]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisState === 'done' && (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-[#00ff88]" />
                </div>
                <p className="text-base font-bold text-white">Análise concluída!</p>
                <p className="text-sm text-[#666]">
                  Veja os resultados detalhados abaixo
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  className="mx-auto"
                >
                  Regenerar análise
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 4: RECOMMENDATIONS ── */}
        {analysisState === 'done' && result && (
          <section>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#00ff88]" />
              Recomendações
            </h2>

            <div className="space-y-3 mb-5">
              {result.recommendations.map((rec, i) => {
                const priority: 'Alta' | 'Média' | 'Baixa' = i < 2 ? 'Alta' : i < 4 ? 'Média' : 'Baixa';
                return (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xl border p-4 flex items-start gap-3',
                      priority === 'Alta' ? 'border-[#ff4444]/20 bg-[#ff4444]/5' :
                      priority === 'Média' ? 'border-[#ffaa00]/20 bg-[#ffaa00]/5' :
                      'border-[#2a2a2a] bg-[#161616]',
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0a0a0a] text-white text-xs font-bold border border-[#2a2a2a]">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={priority} />
                      </div>
                      <p className="text-sm text-[#a0a0a0] leading-relaxed">{rec}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ajustes Sugeridos */}
            <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#00ff88]" />
                Ajustes Sugeridos
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Calorias', value: MOCK_MACRO_ADJUSTMENTS.calories, unit: 'kcal', color: '#ff9500' },
                  { label: 'Proteína', value: MOCK_MACRO_ADJUSTMENTS.protein_g, unit: 'g', color: '#5ac8fa' },
                  { label: 'Carbs', value: MOCK_MACRO_ADJUSTMENTS.carbs_g, unit: 'g', color: '#ffaa00' },
                  { label: 'Gordura', value: MOCK_MACRO_ADJUSTMENTS.fat_g, unit: 'g', color: '#ff6b6b' },
                  { label: 'Água', value: MOCK_MACRO_ADJUSTMENTS.water_ml, unit: 'ml', color: '#00d4ff' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-3 text-center"
                  >
                    <p className="text-2xs text-[#666] uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-lg font-black" style={{ color: item.color }}>
                      {item.value?.toLocaleString('pt-BR') ?? '—'}
                    </p>
                    <p className="text-2xs text-[#666]">{item.unit}/dia</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 5: REPORT ── */}
        {analysisState === 'done' && result && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Download className="w-4 h-4 text-[#00ff88]" />
                Relatório
              </h2>
              <div className="flex items-center gap-2 no-print">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handlePrint}
                >
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExport}
                >
                  Exportar PDF
                </Button>
              </div>
            </div>

            <AnalysisReport
              ref={reportRef}
              scores={scores}
              result={result}
              macroAdjustments={MOCK_MACRO_ADJUSTMENTS}
            />
          </section>
        )}
      </div>
    </div>
  );
}
