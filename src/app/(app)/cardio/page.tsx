'use client';

import React, { useState } from 'react';
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
  Clock,
  Target,
} from 'lucide-react';
import { Button, Input, Select, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  practices: z.boolean(),
  type: z.string().optional().nullable(),
  intensity: z.enum(['low', 'moderate', 'high']).optional().nullable(),
  duration_minutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  frequency_per_week: z.coerce.number().int().min(1).max(14).optional().nullable(),
  timing: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ── Options ───────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'Corrida', label: 'Corrida' },
  { value: 'Ciclismo', label: 'Ciclismo' },
  { value: 'Natação', label: 'Natação' },
  { value: 'Elíptico', label: 'Elíptico' },
  { value: 'Caminhada', label: 'Caminhada' },
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
  Outro: <HelpCircle className="w-4 h-4" />,
};

// ── Summary Banner ────────────────────────────────────────────

function SummaryBanner({ data }: { data: FormValues }) {
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
            <p className="text-xs text-[#a0a0a0] mt-2">
              Objetivo: <span className="text-white font-semibold">{goalLabel}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function CardioPage() {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  const onSubmit = async (_data: FormValues) => {
    // In production: call cardio service
    await new Promise((r) => setTimeout(r, 600));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] bg-[#161616] px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest font-display">
              CARDIO
            </h1>
            <p className="text-xs text-[#666] mt-0.5">
              Perfil de atividade cardiovascular
            </p>
          </div>
          {saved && (
            <Badge variant="success" dot>Salvo</Badge>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Practices Toggle ── */}
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Pratica cardio regularmente?</h2>
                <p className="text-sm text-[#666] mt-0.5">
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
                    onClick={() => {
                      field.onChange(!field.value);
                    }}
                    className={cn(
                      'relative inline-flex w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616]',
                      field.value
                        ? 'bg-[#00ff88] shadow-[0_0_16px_rgba(0,255,136,0.4)]'
                        : 'bg-[#2a2a2a]',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-6 h-6 rounded-full transition-all duration-300 shadow-md',
                        field.value
                          ? 'left-9 bg-[#0a0a0a]'
                          : 'left-1 bg-[#666]',
                      )}
                    />
                  </button>
                )}
              />
            </div>
          </div>

          {/* ── No Cardio State ── */}
          {!practices && (
            <div className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#161616] p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1e1e1e] flex items-center justify-center mx-auto mb-4">
                <HeartPulse className="w-7 h-7 text-[#3a3a3a]" />
              </div>
              <p className="text-base font-bold text-[#a0a0a0]">Nenhum cardio cadastrado</p>
              <p className="text-sm text-[#666] mt-1.5 max-w-xs mx-auto">
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

          {/* ── Cardio Form ── */}
          {practices && (
            <>
              <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5 space-y-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00ff88]" />
                  Configuração
                </h3>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider mb-2">
                    Tipo de cardio
                  </label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={cn(
                              'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-150 text-center',
                              field.value === opt.value
                                ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                                : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#666] hover:border-[#3a3a3a] hover:text-[#a0a0a0]',
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
                  <label className="block text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider mb-2">
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
                                : 'border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#3a3a3a]',
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
                              <p className="text-xs text-[#666] mt-0.5">{opt.description}</p>
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
                    leftElement={<Timer className="w-4 h-4 text-[#666]" />}
                    rightElement={<span className="text-xs text-[#666] pr-3">minutos</span>}
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
                    leftElement={<BarChart2 className="w-4 h-4 text-[#666]" />}
                    rightElement={<span className="text-xs text-[#666] pr-3">vezes/sem.</span>}
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

              {/* Summary Banner */}
              <SummaryBanner data={watchedData} />

              {/* Submit */}
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
      </div>
    </div>
  );
}
