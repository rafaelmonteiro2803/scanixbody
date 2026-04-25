'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Activity,
  Bike,
  Waves,
  Flame,
  Footprints,
  Zap,
  HelpCircle,
  Save,
  Loader2,
  ChevronRight,
  HeartPulse,
  Timer,
  BarChart2,
  Target,
  Plus,
  Trash2,
  Upload,
  FileText,
  CalendarDays,
  TrendingUp,
  MoveUp,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button, Input, Select, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { CardioProfilesRow, CardioSessionsRow } from '@/types/database.types';
import { importCardio } from '@/services/import.service';

// ── Schema ────────────────────────────────────────────────────

const profileSchema = z.object({
  practices: z.boolean(),
  type: z.string().optional().nullable(),
  intensity: z.enum(['low', 'moderate', 'high']).optional().nullable(),
  duration_minutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  frequency_per_week: z.coerce.number().int().min(1).max(14).optional().nullable(),
  timing: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
});

const sessionSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  type: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  intensity: z.enum(['low', 'moderate', 'high']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

type ProfileValues = z.infer<typeof profileSchema>;
type SessionValues = z.infer<typeof sessionSchema>;

// ── Options ───────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'Corrida', label: 'Corrida' },
  { value: 'Ciclismo', label: 'Ciclismo' },
  { value: 'Natação', label: 'Natação' },
  { value: 'Elíptico', label: 'Elíptico' },
  { value: 'Caminhada', label: 'Caminhada' },
  { value: 'Escada', label: 'Escada' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'Outro', label: 'Outro' },
];

const TIMING_OPTIONS = [
  { value: 'pre_workout', label: 'Pré-treino' },
  { value: 'post_workout', label: 'Pós-treino' },
  { value: 'fasted_morning', label: 'Manhã em jejum' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noite' },
  { value: 'separate_day', label: 'Dia separado' },
];

const GOAL_OPTIONS = [
  { value: 'fat_burn', label: 'Queima de gordura' },
  { value: 'conditioning', label: 'Condicionamento' },
  { value: 'cardiovascular_health', label: 'Saúde cardiovascular' },
  { value: 'performance', label: 'Performance' },
  { value: 'active_recovery', label: 'Recuperação ativa' },
];

const INTENSITY_OPTIONS: Array<{
  value: 'low' | 'moderate' | 'high';
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'low',
    label: 'Baixa',
    description: 'Ritmo leve, conversa possível',
    color: '#00ff88',
    bgColor: 'bg-[#00ff88]/5',
    borderColor: 'border-[#00ff88]',
    icon: <Footprints className="w-5 h-5" />,
  },
  {
    value: 'moderate',
    label: 'Moderada',
    description: 'Ritmo médio, leve esforço',
    color: '#ffaa00',
    bgColor: 'bg-[#ffaa00]/5',
    borderColor: 'border-[#ffaa00]',
    icon: <Bike className="w-5 h-5" />,
  },
  {
    value: 'high',
    label: 'Alta',
    description: 'Alta intensidade, difícil falar',
    color: '#ff4444',
    bgColor: 'bg-[#ff4444]/5',
    borderColor: 'border-[#ff4444]',
    icon: <Flame className="w-5 h-5" />,
  },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Corrida: <Activity className="w-4 h-4" />,
  Ciclismo: <Bike className="w-4 h-4" />,
  Natação: <Waves className="w-4 h-4" />,
  HIIT: <Zap className="w-4 h-4" />,
  Caminhada: <Footprints className="w-4 h-4" />,
  Elíptico: <Activity className="w-4 h-4" />,
  Escada: <MoveUp className="w-4 h-4" />,
  Outro: <HelpCircle className="w-4 h-4" />,
};

const INTENSITY_LABEL: Record<string, string> = {
  low: 'Baixa',
  moderate: 'Moderada',
  high: 'Alta',
};

const INTENSITY_COLOR: Record<string, string> = {
  low: '#00ff88',
  moderate: '#ffaa00',
  high: '#ff4444',
};

// ── Summary Banner ────────────────────────────────────────────

function SummaryBanner({ data }: { data: ProfileValues }) {
  if (!data.practices) return null;

  const intensityLabel = INTENSITY_OPTIONS.find((o) => o.value === data.intensity)?.label;
  const timingLabel = TIMING_OPTIONS.find((o) => o.value === data.timing)?.label;
  const goalLabel = GOAL_OPTIONS.find((o) => o.value === data.goal)?.label;

  const parts = [
    data.frequency_per_week ? `${data.frequency_per_week}x por semana` : null,
    data.type ?? null,
    data.duration_minutes ? `${data.duration_minutes} min` : null,
    intensityLabel ? `Intensidade ${intensityLabel}` : null,
    timingLabel ?? null,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/5 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
          <HeartPulse className="w-5 h-5 text-[#00ff88]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#00ff88] uppercase tracking-wider mb-1.5">
            Plano de Cardio Atual
          </p>
          <div className="flex flex-wrap gap-2">
            {parts.map((part, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
              >
                {part}
              </span>
            ))}
          </div>
          {goalLabel && (
            <p className="text-xs text-text-secondary mt-2">
              Objetivo: <span className="text-text-title font-semibold">{goalLabel}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────

function SessionCard({
  session,
  onDelete,
}: {
  session: CardioSessionsRow;
  onDelete: (id: string) => void;
}) {
  const dateLabel = new Date(session.session_date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0 text-[#00ff88]">
        {TYPE_ICONS[session.type ?? 'Outro'] ?? <Activity className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-title">
          {session.type ?? 'Cardio'}
          {session.duration_minutes ? (
            <span className="ml-2 text-xs font-normal text-text-muted">{session.duration_minutes} min</span>
          ) : null}
        </p>
        <p className="text-xs text-text-muted">{dateLabel}</p>
        {session.notes && (
          <p className="text-xs text-text-secondary mt-0.5 truncate">{session.notes}</p>
        )}
      </div>
      {session.intensity && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            color: INTENSITY_COLOR[session.intensity],
            backgroundColor: `${INTENSITY_COLOR[session.intensity]}15`,
          }}
        >
          {INTENSITY_LABEL[session.intensity]}
        </span>
      )}
      <button
        type="button"
        onClick={() => onDelete(session.id)}
        className="p-1.5 rounded-lg text-text-faint hover:text-red-400 hover:bg-red-400/10 transition-colors"
        aria-label="Remover sessão"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

type Tab = 'perfil' | 'sessoes' | 'importar';

export default function CardioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [saved, setSaved] = useState(false);

  // ── Profile state ─────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      practices: false,
      type: null,
      intensity: null,
      duration_minutes: null,
      frequency_per_week: null,
      timing: null,
      goal: null,
    },
  });

  const practices = watch('practices');
  const watchedData = watch();

  // ── Sessions state ────────────────────
  const [sessions, setSessions] = useState<CardioSessionsRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const {
    register: registerSession,
    handleSubmit: handleSubmitSession,
    control: controlSession,
    reset: resetSession,
    formState: { isSubmitting: isSessionSubmitting },
  } = useForm<SessionValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      session_date: new Date().toISOString().split('T')[0],
      type: null,
      duration_minutes: null,
      intensity: null,
      notes: null,
    },
  });

  // ── Import state ──────────────────────
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedSessions, setImportedSessions] = useState<Array<{
    sessionDate: string | null;
    type: string | null;
    durationMinutes: number | null;
    intensity: 'low' | 'moderate' | 'high' | null;
    notes: string | null;
  }>>([]);
  const [savingImport, setSavingImport] = useState(false);
  const [importSaved, setImportSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load profile on mount ─────────────
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/v1/cardio');
        const json = await res.json() as { profile?: CardioProfilesRow | null };
        const p = json.profile;
        if (p) {
          setValue('practices', p.practices);
          setValue('type', p.type ?? null);
          setValue('intensity', (p.intensity as ProfileValues['intensity']) ?? null);
          setValue('duration_minutes', p.duration_minutes ?? null);
          setValue('frequency_per_week', p.frequency_per_week ?? null);
          setValue('timing', p.timing ?? null);
          setValue('goal', p.goal ?? null);
        }
      } catch {
        // non-fatal
      }
    })();
  }, [setValue]);

  // ── Load sessions ─────────────────────
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/v1/cardio/sessions');
      const json = await res.json() as { sessions?: CardioSessionsRow[] };
      setSessions(json.sessions ?? []);
    } catch {
      // non-fatal
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  // ── Handlers ──────────────────────────

  const onSubmitProfile = async (data: ProfileValues) => {
    try {
      await fetch('/api/v1/cardio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practices: data.practices,
          type: data.type ?? null,
          intensity: data.intensity ?? null,
          durationMinutes: data.duration_minutes ?? null,
          frequencyPerWeek: data.frequency_per_week ?? null,
          timing: data.timing ?? null,
          goal: data.goal ?? null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // surface error via UI if needed
    }
  };

  const onSubmitSession = async (data: SessionValues) => {
    try {
      await fetch('/api/v1/cardio/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: data.session_date,
          type: data.type ?? null,
          durationMinutes: data.duration_minutes ?? null,
          intensity: data.intensity ?? null,
          notes: data.notes ?? null,
        }),
      });
      resetSession({
        session_date: new Date().toISOString().split('T')[0],
        type: null,
        duration_minutes: null,
        intensity: null,
        notes: null,
      });
      setShowSessionForm(false);
      void loadSessions();
    } catch {
      // non-fatal
    }
  };

  const handleDeleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/v1/cardio/sessions/${id}`, { method: 'DELETE' });
    } catch {
      void loadSessions();
    }
  };

  const handleExtract = async () => {
    setImportError(null);
    setImportedSessions([]);
    setImporting(true);
    try {
      const input = importFile ?? importText;
      if (!input) {
        setImportError('Cole um texto ou selecione um arquivo para importar.');
        return;
      }
      const result = await importCardio(input);
      if (!result.success || !result.data) {
        setImportError(result.error ?? 'Falha na extração');
        return;
      }
      setImportedSessions(result.data.sessions ?? []);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveImported = async () => {
    setSavingImport(true);
    setSaveError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const results = await Promise.all(
        importedSessions.map((s) =>
          fetch('/api/v1/cardio/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionDate: s.sessionDate ?? today,
              type: s.type ?? null,
              durationMinutes: s.durationMinutes ?? null,
              intensity: s.intensity ?? null,
              notes: s.notes ?? null,
            }),
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        throw new Error(`${failed} sessão(ões) não puderam ser salvas. Verifique os dados e tente novamente.`);
      }
      setImportedSessions([]);
      setImportText('');
      setImportFile(null);
      setImportSaved(true);
      setTimeout(() => setImportSaved(false), 3000);
      void loadSessions();
      setActiveTab('sessoes');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar sessões.');
    } finally {
      setSavingImport(false);
    }
  };

  const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'perfil', label: 'Perfil', icon: <HeartPulse className="w-4 h-4" /> },
    { key: 'sessoes', label: 'Sessões', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'importar', label: 'Importar', icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background-card px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-text-title uppercase tracking-widest font-display">
              CARDIO
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Perfil e histórico de atividade cardiovascular
            </p>
          </div>
          {(saved || importSaved) && (
            <Badge variant="success" dot>Salvo</Badge>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-background-card border border-border rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150',
                activeTab === tab.key
                  ? 'bg-[#00ff88] text-black'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-1',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PERFIL ── */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
            {/* Practices Toggle */}
            <div className="rounded-xl bg-background-card border border-border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-text-title">Pratica cardio regularmente?</h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    Ative para configurar seu perfil de cardio
                  </p>
                </div>
                <Controller
                  control={control}
                  name="practices"
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        'relative inline-flex w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616]',
                        field.value
                          ? 'bg-[#00ff88] shadow-[0_0_16px_rgba(0,255,136,0.4)]'
                          : 'bg-surface-3',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-1 w-6 h-6 rounded-full transition-all duration-300 shadow-md',
                          field.value ? 'left-9 bg-background' : 'left-1 bg-text-secondary',
                        )}
                      />
                    </button>
                  )}
                />
              </div>
            </div>

            {/* No Cardio State */}
            {!practices && (
              <div className="rounded-xl border border-dashed border-border bg-background-card p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-background-card flex items-center justify-center mx-auto mb-4">
                  <HeartPulse className="w-7 h-7 text-text-faint" />
                </div>
                <p className="text-base font-bold text-text-secondary">Nenhum cardio cadastrado</p>
                <p className="text-sm text-text-muted mt-1.5 max-w-xs mx-auto">
                  Ative o toggle acima para configurar sua rotina de cardio e melhorar seu score.
                </p>
                <button
                  type="button"
                  onClick={() => setValue('practices', true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00ff88]/30 text-[#00ff88] text-sm font-semibold hover:bg-[#00ff88]/10 transition-colors"
                >
                  Adicionar cardio
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cardio Config */}
            {practices && (
              <>
                <div className="rounded-xl bg-background-card border border-border p-5 space-y-5">
                  <h3 className="text-sm font-bold text-text-title uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00ff88]" />
                    Configuração
                  </h3>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Tipo de cardio
                    </label>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {TYPE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-150 text-center',
                                field.value === opt.value
                                  ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                                  : 'border-border bg-background text-text-muted hover:border-border-strong hover:text-text-secondary',
                              )}
                            >
                              <span>{TYPE_ICONS[opt.value]}</span>
                              <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  {/* Intensity */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Intensidade
                    </label>
                    <Controller
                      control={control}
                      name="intensity"
                      render={({ field }) => (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {INTENSITY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                'flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-150 text-left',
                                field.value === opt.value
                                  ? `${opt.borderColor} ${opt.bgColor}`
                                  : 'border-border bg-background hover:border-border-strong',
                              )}
                            >
                              <span
                                style={{ color: field.value === opt.value ? opt.color : '#666' }}
                                className="mt-0.5 flex-shrink-0"
                              >
                                {opt.icon}
                              </span>
                              <div>
                                <p
                                  className="text-sm font-bold"
                                  style={{ color: field.value === opt.value ? opt.color : '#a0a0a0' }}
                                >
                                  {opt.label}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">{opt.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  {/* Duration + Frequency */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Duração"
                      type="number"
                      step="5"
                      min="1"
                      max="600"
                      placeholder="30"
                      prefix={<Timer className="w-4 h-4 text-text-muted" />}
                      suffix={<span className="text-xs text-text-muted pr-3">minutos</span>}
                      error={errors.duration_minutes?.message}
                      {...register('duration_minutes')}
                    />
                    <Input
                      label="Frequência"
                      type="number"
                      step="1"
                      min="1"
                      max="14"
                      placeholder="3"
                      prefix={<BarChart2 className="w-4 h-4 text-text-muted" />}
                      suffix={<span className="text-xs text-text-muted pr-3">vezes/sem.</span>}
                      error={errors.frequency_per_week?.message}
                      {...register('frequency_per_week')}
                    />
                  </div>

                  {/* Timing + Goal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name="timing"
                      render={({ field }) => (
                        <Select
                          label="Momento"
                          options={TIMING_OPTIONS}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          error={errors.timing?.message}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="goal"
                      render={({ field }) => (
                        <Select
                          label="Objetivo do cardio"
                          options={GOAL_OPTIONS}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          error={errors.goal?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                <SummaryBanner data={watchedData} />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    leftIcon={isSubmitting ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  >
                    Salvar Perfil de Cardio
                  </Button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ── TAB: SESSÕES ── */}
        {activeTab === 'sessoes' && (
          <div className="space-y-5">
            {/* Add session button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00ff88]" />
                <span className="text-sm font-bold text-text-title">Histórico (últimos 90 dias)</span>
                <span className="text-xs text-text-muted">({sessions.length} sessões)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88] text-black text-xs font-bold hover:bg-[#00e87a] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Sessão
              </button>
            </div>

            {/* Add session form */}
            {showSessionForm && (
              <form
                onSubmit={handleSubmitSession(onSubmitSession)}
                className="rounded-xl bg-background-card border border-[#00ff88]/30 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-title flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#00ff88]" />
                    Registrar Sessão
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSessionForm(false)}
                    className="p-1 rounded text-text-faint hover:text-text-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Data"
                    type="date"
                    {...registerSession('session_date')}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Tipo
                    </label>
                    <Controller
                      control={controlSession}
                      name="type"
                      render={({ field }) => (
                        <div className="grid grid-cols-4 gap-1.5">
                          {TYPE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                'flex flex-col items-center gap-1 px-1 py-2 rounded-lg border text-center transition-all',
                                field.value === opt.value
                                  ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                                  : 'border-border bg-background text-text-muted hover:border-border-strong',
                              )}
                            >
                              <span className="[&>svg]:w-3 [&>svg]:h-3">{TYPE_ICONS[opt.value]}</span>
                              <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Duração (min)"
                    type="number"
                    step="1"
                    min="1"
                    max="600"
                    placeholder="30"
                    prefix={<Timer className="w-4 h-4 text-text-muted" />}
                    {...registerSession('duration_minutes')}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Intensidade
                    </label>
                    <Controller
                      control={controlSession}
                      name="intensity"
                      render={({ field }) => (
                        <div className="flex gap-2">
                          {INTENSITY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                'flex-1 py-2 px-2 rounded-lg border-2 text-xs font-semibold transition-all',
                                field.value === opt.value
                                  ? `${opt.borderColor} ${opt.bgColor}`
                                  : 'border-border bg-background text-text-muted',
                              )}
                              style={{ color: field.value === opt.value ? opt.color : undefined }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                </div>

                <Input
                  label="Notas (opcional)"
                  placeholder="Ex: percurso, ritmo, como me senti..."
                  {...registerSession('notes')}
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSessionForm(false)}
                    className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary border border-border hover:border-border-strong transition-colors"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isSessionSubmitting}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Salvar Sessão
                  </Button>
                </div>
              </form>
            )}

            {/* Sessions list */}
            <div className="rounded-xl bg-background-card border border-border overflow-hidden">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center">
                  <HeartPulse className="w-10 h-10 text-text-faint mx-auto mb-3" />
                  <p className="text-sm font-semibold text-text-secondary">Nenhuma sessão registrada</p>
                  <p className="text-xs text-text-muted mt-1">
                    Clique em &ldquo;Nova Sessão&rdquo; ou importe um plano de treino.
                  </p>
                </div>
              ) : (
                <div className="px-4 divide-y-0">
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} onDelete={handleDeleteSession} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: IMPORTAR ── */}
        {activeTab === 'importar' && (
          <div className="space-y-5">
            <div className="rounded-xl bg-background-card border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00ff88]" />
                <h3 className="text-sm font-bold text-text-title">Importar Plano de Cardio</h3>
              </div>
              <p className="text-xs text-text-muted">
                Cole o texto de um plano de corrida, cycling, crossfit ou qualquer treino aeróbico.
                A IA vai extrair automaticamente as sessões (data, tipo, duração, intensidade).
              </p>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Arquivo (PDF, DOCX, TXT)
                </label>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border hover:border-border-strong transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="w-5 h-5 text-text-faint flex-shrink-0" />
                  <span className="text-sm text-text-muted flex-1">
                    {importFile ? importFile.name : 'Clique para selecionar arquivo'}
                  </span>
                  {importFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                      className="text-text-faint hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setImportFile(f); setImportText(''); }
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-faint">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Text paste */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Cole o texto aqui
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => { setImportText(e.target.value); setImportFile(null); }}
                  placeholder="Ex: Segunda - Corrida 45min leve, Quarta - HIIT 30min alta intensidade..."
                  rows={5}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder:text-text-faint resize-none focus:outline-none focus:border-[#00ff88]/50 transition-colors"
                />
              </div>

              {importError && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{importError}</p>
              )}

              <Button
                type="button"
                variant="primary"
                loading={importing}
                onClick={handleExtract}
                leftIcon={<Zap className="w-4 h-4" />}
                className="w-full"
              >
                Extrair com IA
              </Button>
            </div>

            {/* Extracted sessions preview */}
            {importedSessions.length > 0 && (
              <div className="rounded-xl bg-background-card border border-[#00ff88]/20 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                  <h3 className="text-sm font-bold text-text-title">
                    {importedSessions.length} sessões encontradas
                  </h3>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {importedSessions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] flex-shrink-0">
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-title truncate">
                          {s.type ?? 'Cardio'}
                          {s.durationMinutes ? <span className="ml-1 text-xs font-normal text-text-muted">{s.durationMinutes} min</span> : null}
                        </p>
                        {s.sessionDate && (
                          <p className="text-xs text-text-muted">{s.sessionDate}</p>
                        )}
                        {s.notes && (
                          <p className="text-xs text-text-secondary truncate">{s.notes}</p>
                        )}
                      </div>
                      {s.intensity && (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: INTENSITY_COLOR[s.intensity] }}
                        >
                          {INTENSITY_LABEL[s.intensity]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {saveError && (
                  <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{saveError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setImportedSessions([]); setSaveError(null); }}
                    className="flex-1 py-2 rounded-lg border border-border text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Descartar
                  </button>
                  <Button
                    type="button"
                    variant="primary"
                    loading={savingImport}
                    onClick={handleSaveImported}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Salvar {importedSessions.length} sessões
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
