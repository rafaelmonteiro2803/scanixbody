'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  type LucideIcon,
} from 'lucide-react';
import { Button, ScoreRing, ProgressBar, Badge } from '@/components/ui';
import { ChecklistItem, type ChecklistStatus as ModuleChecklistStatus } from './components/ChecklistItem';
import { AnalysisReport, type MacroAdjustments, type CurrentMacros } from './components/AnalysisReport';
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
  icon: LucideIcon;
  status: ModuleChecklistStatus;
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
    Baixa: { variant: 'neutral' as const, icon: <ChevronDown className="w-3 h-3" /> },
  };
  const { variant, icon } = config[priority];
  return (
    <Badge variant={variant} size="sm" icon={icon}>
      {priority}
    </Badge>
  );
}

// ── Main Page ─────────────────────────────────────────────────

interface ApiChecklistStatus {
  hasProfile: boolean;
  hasWorkoutDays: boolean;
  hasMeals: boolean;
  hasCardio: boolean;
  hasMedications: boolean;
  hasExams: boolean;
}

interface ApiReport {
  score_training: number | null;
  score_diet: number | null;
  score_sleep: number | null;
  score_hydration: number | null;
  score_cardio: number | null;
  score_overall: number | null;
  recommendations: string[] | null;
  report_data: Record<string, unknown> | null;
  generated_at: string;
}

// ── Macro food examples (view-layer: practical suggestions by macro + direction) ──

interface MacroExample {
  threshold: number
  example: string
}

const MACRO_EXAMPLES: Record<string, { increase: MacroExample[]; decrease: MacroExample[] }> = {
  calories: {
    increase: [
      { threshold: 100, example: '1 banana média' },
      { threshold: 200, example: '1 iogurte grego + fruta' },
      { threshold: 300, example: '1 banana + pasta de amendoim' },
      { threshold: 500, example: 'refeição extra leve' },
    ],
    decrease: [
      { threshold: 100, example: 'remover 1 suco industrializado' },
      { threshold: 200, example: 'remover snack processado' },
      { threshold: 300, example: 'reduzir porção de carboidrato no jantar' },
      { threshold: 500, example: 'eliminar refeição extra desnecessária' },
    ],
  },
  protein: {
    increase: [
      { threshold: 10, example: '2 claras de ovo' },
      { threshold: 20, example: '1 dose de whey' },
      { threshold: 35, example: '1 dose de whey + 1 ovo' },
      { threshold: 55, example: '200g de frango grelhado' },
      { threshold: 80, example: '300g de frango grelhado' },
    ],
    decrease: [
      { threshold: 15, example: 'remover 1 dose de whey' },
      { threshold: 30, example: 'reduzir carne/ovos no jantar' },
    ],
  },
  carbs: {
    increase: [
      { threshold: 15, example: '1 fatia de pão integral' },
      { threshold: 30, example: '1 banana média' },
      { threshold: 50, example: '½ xícara de arroz cozido' },
      { threshold: 80, example: '1 xícara de arroz cozido' },
    ],
    decrease: [
      { threshold: 15, example: 'remover 1 fatia de pão' },
      { threshold: 30, example: 'remover 1 banana' },
      { threshold: 50, example: 'reduzir ½ xícara de arroz' },
      { threshold: 80, example: 'remover doce de leite do cardápio' },
    ],
  },
  fat: {
    increase: [
      { threshold: 10, example: '1 col. chá de azeite extra' },
      { threshold: 20, example: '1 col. sopa de azeite' },
      { threshold: 30, example: '1 porção de castanhas (30g)' },
    ],
    decrease: [
      { threshold: 10, example: 'reduzir 1 col. de azeite/dia' },
      { threshold: 20, example: 'remover castanhas do lanche' },
      { threshold: 30, example: 'remover doce de leite' },
    ],
  },
  water: {
    increase: [
      { threshold: 250, example: '1 copo extra ao dia' },
      { threshold: 500, example: '1 garrafinha extra (500ml)' },
      { threshold: 1000, example: '2 garrafinhas extras ao dia' },
    ],
    decrease: [
      { threshold: 500, example: 'reduzir 1 garrafinha' },
    ],
  },
}

function getMacroExample(macro: keyof typeof MACRO_EXAMPLES, delta: number): string {
  const direction = delta > 0 ? 'increase' : 'decrease'
  const abs = Math.abs(delta)
  const examples = MACRO_EXAMPLES[macro][direction]
  const match = examples.find((e) => abs <= e.threshold)
  return match?.example ?? examples[examples.length - 1]?.example ?? ''
}

export default function AnaliseIAPage() {
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreBreakdown>({
    training: 0, diet: 0, sleep: 0, hydration: 0, cardio: 0, overall: 0,
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checklist, setChecklist] = useState<ApiChecklistStatus | null>(null);
  const [canRerun, setCanRerun] = useState(true);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Current actual macros from today's meals
  const [currentMacros, setCurrentMacros] = useState<{
    calories: number; protein_g: number; carbs_g: number; fat_g: number; water_ml: number
  } | null>(null);

  // ── Loading progress state ────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ANALYSIS_STEPS = [
    'Calculando scores por dimensão',
    'Processando composição corporal',
    'Analisando padrão alimentar e macros',
    'Gerando recomendações personalizadas com IA',
  ] as const;

  const startLoadingTimers = useCallback(() => {
    setElapsedSeconds(0);
    setVisibleSteps(1);
    // Reveal one step every 3 s, capped at total steps
    let step = 1;
    const revealNext = () => {
      step += 1;
      if (step <= ANALYSIS_STEPS.length) {
        setVisibleSteps(step);
        stepTimerRef.current = setTimeout(revealNext, 3000);
      }
    };
    stepTimerRef.current = setTimeout(revealNext, 3000);
    // Elapsed-second counter
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopLoadingTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    timerRef.current = null;
    stepTimerRef.current = null;
  }, []);

  const applyReport = (report: ApiReport) => {
    setScores({
      training: report.score_training ?? 0,
      diet: report.score_diet ?? 0,
      sleep: report.score_sleep ?? 0,
      hydration: report.score_hydration ?? 0,
      cardio: report.score_cardio ?? 0,
      overall: report.score_overall ?? 0,
    });
    const rd = report.report_data ?? {};
    setResult({
      summary: typeof rd.summary === 'string' ? rd.summary : '',
      strengths: Array.isArray(rd.strengths) ? rd.strengths as string[] : [],
      improvements: Array.isArray(rd.improvements) ? rd.improvements as string[] : [],
      recommendations: Array.isArray(report.recommendations) ? report.recommendations as string[] : [],
      weeklyFocus: typeof rd.weeklyFocus === 'string' ? rd.weeklyFocus : '',
      estimatedProgressTimeline: typeof rd.estimatedProgressTimeline === 'string' ? rd.estimatedProgressTimeline : null,
      generatedAt: report.generated_at,
    });
    setLastGeneratedAt(report.generated_at);
    setAnalysisState('done');
  };

  // Cleanup timers on unmount
  useEffect(() => () => stopLoadingTimers(), [stopLoadingTimers]);

  // Load checklist status + today's macros on mount
  useEffect(() => {
    // Checklist + existing report
    fetch('/api/v1/analise-ia')
      .then((r) => r.json() as Promise<{ data?: { checklistStatus?: ApiChecklistStatus; report?: ApiReport | null; canRerun?: boolean } }>)
      .then(({ data }) => {
        if (data?.checklistStatus) setChecklist(data.checklistStatus);
        if (typeof data?.canRerun === 'boolean') setCanRerun(data.canRerun);
        if (data?.report) applyReport(data.report);
      })
      .catch(() => { /* non-fatal */ });

    // Today's actual macro totals from meals
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/v1/dieta?date=${today}`)
      .then((r) => r.json() as Promise<{ data?: { meals?: Array<{ calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fat_g?: number | null }> } }>)
      .then(({ data }) => {
        const meals = data?.meals ?? [];
        const totals = meals.reduce(
          (acc, m) => ({
            calories: acc.calories + (m.calories ?? 0),
            protein_g: acc.protein_g + (m.protein_g ?? 0),
            carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
            fat_g: acc.fat_g + (m.fat_g ?? 0),
            water_ml: acc.water_ml,
          }),
          { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 },
        );
        setCurrentMacros(totals);
      })
      .catch(() => { /* non-fatal */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamically build checklist from real data
  const liveChecklist: ModuleChecklistConfig[] = checklist ? [
    { module: 'Treinos', icon: Dumbbell, status: checklist.hasWorkoutDays ? 'complete' : 'incomplete', text: checklist.hasWorkoutDays ? 'Programa de treino configurado.' : 'Nenhum treino configurado.' },
    { module: 'Dieta', icon: Salad, status: checklist.hasMeals ? 'complete' : 'incomplete', text: checklist.hasMeals ? 'Refeições registradas.' : 'Nenhuma refeição registrada.' },
    { module: 'Corpo', icon: TrendingUp, status: checklist.hasProfile ? 'complete' : 'incomplete', text: checklist.hasProfile ? 'Perfil corporal preenchido.' : 'Perfil não preenchido.' },
    { module: 'Cardio', icon: HeartPulse, status: checklist.hasCardio ? 'complete' : 'incomplete', text: checklist.hasCardio ? 'Perfil de cardio cadastrado.' : 'Cardio não configurado (opcional).' },
    { module: 'Medicamentos', icon: Pill, status: checklist.hasMedications ? 'complete' : 'incomplete', text: checklist.hasMedications ? 'Medicamentos/suplementos cadastrados.' : 'Nenhum medicamento cadastrado.' },
    { module: 'Exames', icon: FlaskConical, status: checklist.hasExams ? 'complete' : 'empty', text: checklist.hasExams ? 'Exames laboratoriais importados.' : 'Nenhum exame cadastrado.' },
  ] : MODULE_CHECKLIST;

  const completeCount = liveChecklist.filter((m) => m.status === 'complete').length;
  const completeness = Math.round((completeCount / liveChecklist.length) * 100);

  const handleGenerate = async () => {
    setAnalysisState('loading');
    setAnalysisError(null);
    setResult(null);
    startLoadingTimers();
    try {
      const res = await fetch('/api/v1/analise-ia', { method: 'POST' });
      const json = await res.json() as { data?: ApiReport; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erro ao gerar análise');
      if (json.data) {
        stopLoadingTimers();
        applyReport(json.data);
        setCanRerun(false); // lock rerun until data changes
      }
    } catch (err) {
      stopLoadingTimers();
      setAnalysisError(err instanceof Error ? err.message : 'Erro desconhecido');
      setAnalysisState('error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // In production: generate PDF via html2canvas or similar
    alert('Exportação de PDF disponível na versão completa.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background-card px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-text-title uppercase tracking-widest font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00ff88]" />
              ANÁLISE IA
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
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
            <h2 className="text-sm font-bold text-text-title uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
              Checklist de Completude
            </h2>
            <span className="text-sm font-bold text-[#00ff88]">{completeness}%</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {liveChecklist.map((item) => (
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
          <div className="rounded-xl bg-background-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Completude do perfil
              </span>
              <span className="text-sm font-bold text-text-title">{completeness}%</span>
            </div>
            <ProgressBar
              value={completeness}
              max={100}
              variant={completeness >= 80 ? 'success' : completeness >= 50 ? 'warning' : 'danger'}
              size="md"
              showLabel={false}
            />
            <p className="text-xs text-text-muted mt-2">
              {completeCount} de {liveChecklist.length} módulos completos.
              {completeness < 100 && ' Complete todos os módulos para uma análise mais precisa.'}
            </p>
          </div>
        </section>

        {/* ── SECTION 2: SCORES ── */}
        <section>
          <h2 className="text-sm font-bold text-text-title uppercase tracking-widest flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#00ff88]" />
            Scores de Desempenho
          </h2>

          <div className="rounded-xl bg-background-card border border-border p-6">
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 border-t border-border pt-6">
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
          <h2 className="text-sm font-bold text-text-title uppercase tracking-widest flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#00ff88]" />
            Gerar Análise
          </h2>

          <div className="rounded-xl bg-background-card border border-border p-6 text-center">
            {analysisState === 'idle' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-[#00ff88]" />
                </div>
                <div>
                  <p className="text-base font-bold text-text-title">Pronto para analisar</p>
                  <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
                    Nossa IA irá processar todos os seus dados — treinos, dieta, corpo, cardio,
                    medicamentos e exames — para gerar um relatório completo e personalizado.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  onClick={handleGenerate}
                  disabled={!canRerun}
                  className="mx-auto"
                >
                  Gerar Análise com IA
                </Button>
                {!canRerun && (
                  <p className="text-xs text-text-muted">
                    Nenhuma alteração nos dados desde a última análise.
                  </p>
                )}
              </div>
            )}

            {analysisState === 'loading' && (
              <div className="space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-[#00ff88] animate-pulse" />
                </div>
                <div>
                  <p className="text-base font-bold text-text-title">Analisando seus dados...</p>
                  <p className="text-sm text-text-muted mt-1">
                    Isso pode levar até 15 segundos — não feche a página
                  </p>
                  {elapsedSeconds > 0 && (
                    <p className="text-xs text-text-faint mt-1">
                      {elapsedSeconds}s{elapsedSeconds >= 15 ? ' — quase lá...' : ''}
                    </p>
                  )}
                </div>

                {/* Progress steps — reveal one by one */}
                <div className="text-left max-w-xs mx-auto space-y-2.5">
                  {ANALYSIS_STEPS.map((step, i) => {
                    const revealed = i < visibleSteps;
                    const isActive = i === visibleSteps - 1;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2.5 text-xs transition-opacity duration-500',
                          revealed ? 'opacity-100' : 'opacity-0',
                        )}
                      >
                        {isActive ? (
                          <Loader2 className="w-3.5 h-3.5 text-[#00ff88] animate-spin flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88]/60 flex-shrink-0" />
                        )}
                        <span className={isActive ? 'text-text-primary font-medium' : 'text-text-muted'}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Thin animated progress bar */}
                <div className="w-48 mx-auto h-0.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00ff88] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((elapsedSeconds / 15) * 100, 95)}%` }}
                  />
                </div>
              </div>
            )}

            {analysisState === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-red-400">{analysisError ?? 'Erro ao gerar análise.'}</p>
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="mx-auto">
                  Tentar novamente
                </Button>
              </div>
            )}

            {analysisState === 'done' && (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-[#00ff88]" />
                </div>
                <p className="text-base font-bold text-text-title">Análise concluída!</p>
                {lastGeneratedAt && (
                  <p className="text-xs text-text-muted">
                    Gerada em{' '}
                    <span className="font-semibold text-text-secondary">
                      {new Date(lastGeneratedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}{' às '}
                      {new Date(lastGeneratedAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </p>
                )}
                {canRerun ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#00ff88] bg-[#00ff88]/10 rounded-lg px-3 py-2">
                      Novos dados detectados — você pode regenerar a análise.
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
                ) : (
                  <p className="text-xs text-text-muted bg-surface-2 rounded-lg px-3 py-2">
                    Nenhuma alteração nos dados desde a última análise. Atualize treinos, dieta, corpo, cardio, medicamentos ou exames para regenerar.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 4: RECOMMENDATIONS ── */}
        {analysisState === 'done' && result && (
          <section>
            <h2 className="text-sm font-bold text-text-title uppercase tracking-widest flex items-center gap-2 mb-4">
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
                      'border-border bg-background-card',
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-background text-text-title text-xs font-bold border border-border">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={priority} />
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">{rec}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ajustes Sugeridos */}
            <div className="rounded-xl bg-background-card border border-border p-5">
              <h3 className="text-xs font-bold text-text-title uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#00ff88]" />
                Ajustes Sugeridos
              </h3>

              <div className="space-y-3">
                {(
                  [
                    {
                      label: 'Calorias',
                      macroKey: 'calories' as const,
                      target: MOCK_MACRO_ADJUSTMENTS.calories,
                      current: currentMacros?.calories,
                      unit: 'kcal',
                      color: '#ff9500',
                    },
                    {
                      label: 'Proteína',
                      macroKey: 'protein' as const,
                      target: MOCK_MACRO_ADJUSTMENTS.protein_g,
                      current: currentMacros?.protein_g,
                      unit: 'g',
                      color: '#5ac8fa',
                    },
                    {
                      label: 'Carboidratos',
                      macroKey: 'carbs' as const,
                      target: MOCK_MACRO_ADJUSTMENTS.carbs_g,
                      current: currentMacros?.carbs_g,
                      unit: 'g',
                      color: '#ffaa00',
                    },
                    {
                      label: 'Gordura',
                      macroKey: 'fat' as const,
                      target: MOCK_MACRO_ADJUSTMENTS.fat_g,
                      current: currentMacros?.fat_g,
                      unit: 'g',
                      color: '#ff6b6b',
                    },
                    {
                      label: 'Água',
                      macroKey: 'water' as const,
                      target: MOCK_MACRO_ADJUSTMENTS.water_ml,
                      current: currentMacros?.water_ml,
                      unit: 'ml',
                      color: '#00d4ff',
                    },
                  ] as const
                ).map((item) => {
                  const hasCurrent = item.current != null && item.current > 0
                  const delta = hasCurrent ? (item.target ?? 0) - (item.current ?? 0) : null
                  const absDelta = delta != null ? Math.abs(delta) : null
                  const direction = delta != null ? (delta > 0 ? 'aumentar' : 'reduzir') : null
                  const example = delta != null && absDelta != null && absDelta >= 5
                    ? getMacroExample(item.macroKey, delta)
                    : null

                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-background p-4 flex items-center gap-4"
                    >
                      {/* Target value */}
                      <div className="w-20 flex-shrink-0 text-center">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className="text-xl font-black tabular-nums" style={{ color: item.color }}>
                          {item.target?.toLocaleString('pt-BR') ?? '—'}
                        </p>
                        <p className="text-[10px] text-text-faint">{item.unit}/dia</p>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-border flex-shrink-0" />

                      {/* Delta + example */}
                      <div className="flex-1 min-w-0">
                        {delta != null && absDelta != null && absDelta >= 5 ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={`text-sm font-bold ${delta > 0 ? 'text-[#00ff88]' : 'text-[#ff6b6b]'}`}
                              >
                                {delta > 0 ? '▲' : '▼'} {direction} {absDelta.toLocaleString('pt-BR')}{item.unit}/dia
                              </span>
                              <span className="text-xs text-text-muted">
                                (atual: {Math.round(item.current ?? 0).toLocaleString('pt-BR')}{item.unit})
                              </span>
                            </div>
                            {example && (
                              <p className="text-xs text-text-muted truncate">
                                ex:{' '}
                                <span className="text-text-secondary font-medium">{example}</span>
                              </p>
                            )}
                          </>
                        ) : delta != null && absDelta != null && absDelta < 5 ? (
                          <p className="text-sm text-[#00ff88] font-medium">✓ Dentro da meta</p>
                        ) : (
                          <p className="text-xs text-text-muted italic">
                            Registre suas refeições para ver o ajuste necessário
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-[10px] text-text-faint mt-3">
                Baseado nas refeições registradas hoje. Registre refeições diariamente para ajustes precisos.
              </p>
            </div>
          </section>
        )}

        {/* ── SECTION 5: REPORT ── */}
        {analysisState === 'done' && result && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text-title uppercase tracking-widest flex items-center gap-2">
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
              currentMacros={currentMacros as CurrentMacros | null}
            />
          </section>
        )}
      </div>
    </div>
  );
}
