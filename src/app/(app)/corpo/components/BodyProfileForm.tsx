'use client';

import React, { useEffect, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Weight,
  Ruler,
  Activity,
  Droplets,
  Target,
  Moon,
  Heart,
  Save,
  Loader2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  CardHeader,
  ProgressBar,
} from '@/components/ui';
import {
  calculateBMI,
  classifyBMI,
  calculateBMR,
  calculateTDEE,
  calculateIdealWeight,
  calculateWaistHipRatio,
  classifyWaistHipRatio,
  calculateDailyWater,
  readBodyState,
} from '@/domain/body-calculations';
import type { ActivityLevel } from '@/types/domain.types';
import type { AthleteProfilesRow, BodySegmentsRow } from '@/types/database.types';
import { cn } from '@/lib/utils';

// ── Zod Schema ────────────────────────────────────────────────

const schema = z.object({
  // Section 1: Personal data
  full_name: z.string().max(100).optional().nullable(),
  weight: z.coerce.number().min(20).max(500).optional().nullable(),
  height: z.coerce.number().min(50).max(300).optional().nullable(),
  age: z.coerce.number().int().min(1).max(150).optional().nullable(),
  sex: z.enum(['M', 'F']).optional().nullable(),

  // Section 2: Body composition
  body_fat_percentage: z.coerce.number().min(1).max(70).optional().nullable(),
  fat_mass: z.coerce.number().min(0).max(400).optional().nullable(),
  skeletal_muscle_mass: z.coerce.number().min(0).max(200).optional().nullable(),
  lean_mass: z.coerce.number().min(0).max(400).optional().nullable(),
  body_water: z.coerce.number().min(0).max(300).optional().nullable(),
  protein_mass: z.coerce.number().min(0).max(100).optional().nullable(),
  minerals_mass: z.coerce.number().min(0).max(50).optional().nullable(),

  // Section 3: Indices
  visceral_fat: z.coerce.number().min(1).max(20).optional().nullable(),
  waist: z.coerce.number().min(40).max(250).optional().nullable(),
  hip: z.coerce.number().min(40).max(250).optional().nullable(),
  inbody_score: z.coerce.number().min(0).max(100).optional().nullable(),

  // Section 4: Goals & lifestyle
  goal: z.string().optional().nullable(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional().nullable(),
  goal_period_weeks: z.coerce.number().int().min(1).max(104).optional().nullable(),
  water_per_day: z.coerce.number().min(0).max(20000).optional().nullable(),
  sleep_hours: z.coerce.number().min(0).max(24).optional().nullable(),
  sleep_quality: z.enum(['Ótima', 'Boa', 'Regular', 'Ruim']).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Section 5: Segments
  seg_right_arm_lean: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_right_arm_fat: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_left_arm_lean: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_left_arm_fat: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_trunk_lean: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_trunk_fat: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_right_leg_lean: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_right_leg_fat: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_left_leg_lean: z.coerce.number().min(0).max(200).optional().nullable(),
  seg_left_leg_fat: z.coerce.number().min(0).max(200).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────

interface BodyProfileFormProps {
  initialProfile: AthleteProfilesRow | null;
  initialSegments: BodySegmentsRow[];
  onSave: (data: FormValues) => Promise<void>;
}

// ── Constants ─────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Perda de gordura' },
  { value: 'muscle_gain', label: 'Ganho de massa' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'performance', label: 'Performance' },
  { value: 'body_recomposition', label: 'Recomposição corporal' },
];

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentário (×1.2)' },
  { value: 'light', label: 'Levemente ativo (×1.375)' },
  { value: 'moderate', label: 'Moderadamente ativo (×1.55)' },
  { value: 'active', label: 'Muito ativo (×1.725)' },
  { value: 'very_active', label: 'Extremamente ativo (×1.9)' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 'Ótima', label: 'Ótima' },
  { value: 'Boa', label: 'Boa' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Ruim', label: 'Ruim' },
];

const SEGMENT_CONFIG = [
  { key: 'right_arm', label: 'Braço D' },
  { key: 'left_arm', label: 'Braço E' },
  { key: 'trunk', label: 'Tronco' },
  { key: 'right_leg', label: 'Perna D' },
  { key: 'left_leg', label: 'Perna E' },
] as const;

// ── Helpers ───────────────────────────────────────────────────

function safeNum(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function getBMIBadgeColor(classification: string): 'success' | 'warning' | 'danger' | 'default' {
  if (classification === 'Normal') return 'success';
  if (classification === 'Sobrepeso') return 'warning';
  if (classification.startsWith('Obesidade')) return 'danger';
  return 'default';
}

function getVisceralColor(val: number): string {
  if (val <= 9) return '#00ff88';
  if (val <= 14) return '#ffaa00';
  return '#ff4444';
}

function getWHRBadgeColor(classification: string): 'success' | 'warning' | 'danger' {
  if (classification === 'Baixo risco') return 'success';
  if (classification === 'Risco moderado') return 'warning';
  return 'danger';
}

// ── Section Heading ───────────────────────────────────────────

function SectionHeading({ icon, title, number }: { icon: React.ReactNode; title: string; number: number }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#2a2a2a]">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#00ff88]/10 flex-shrink-0">
        <span className="text-[#00ff88] text-xs font-bold">{number}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#00ff88] flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h3>
      </div>
    </div>
  );
}

// ── Calculated Field Display ──────────────────────────────────

function CalcField({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2.5">
      <p className="text-2xs text-[#666] uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-[#00ff88] font-mono">{value}</span>
        {unit && <span className="text-xs text-[#666]">{unit}</span>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function BodyProfileForm({ initialProfile, initialSegments, onSave }: BodyProfileFormProps) {
  const segmentByKey = useCallback(
    (key: string): BodySegmentsRow | undefined =>
      initialSegments.find((s) => s.segment === key),
    [initialSegments],
  );

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
      full_name: '',
      weight: initialProfile?.weight ?? null,
      height: initialProfile?.height ?? null,
      age: initialProfile?.age ?? null,
      sex: (initialProfile?.sex as 'M' | 'F') ?? null,
      body_fat_percentage: initialProfile?.body_fat_percentage ?? null,
      fat_mass: initialProfile?.fat_mass ?? null,
      skeletal_muscle_mass: initialProfile?.skeletal_muscle_mass ?? null,
      lean_mass: initialProfile?.lean_mass ?? null,
      body_water: initialProfile?.body_water ?? null,
      protein_mass: initialProfile?.protein_mass ?? null,
      minerals_mass: initialProfile?.minerals_mass ?? null,
      visceral_fat: initialProfile?.visceral_fat ?? null,
      waist: null,
      hip: null,
      inbody_score: initialProfile?.inbody_score ?? null,
      goal: initialProfile?.goal ?? null,
      activity_level: (initialProfile?.activity_level as FormValues['activity_level']) ?? null,
      goal_period_weeks: null,
      water_per_day: initialProfile?.water_per_day ?? null,
      sleep_hours: initialProfile?.sleep_hours ?? null,
      sleep_quality: null,
      notes: initialProfile?.notes ?? null,
      seg_right_arm_lean: segmentByKey('right_arm')?.lean_mass ?? null,
      seg_right_arm_fat: segmentByKey('right_arm')?.fat_mass ?? null,
      seg_left_arm_lean: segmentByKey('left_arm')?.lean_mass ?? null,
      seg_left_arm_fat: segmentByKey('left_arm')?.fat_mass ?? null,
      seg_trunk_lean: segmentByKey('trunk')?.lean_mass ?? null,
      seg_trunk_fat: segmentByKey('trunk')?.fat_mass ?? null,
      seg_right_leg_lean: segmentByKey('right_leg')?.lean_mass ?? null,
      seg_right_leg_fat: segmentByKey('right_leg')?.fat_mass ?? null,
      seg_left_leg_lean: segmentByKey('left_leg')?.lean_mass ?? null,
      seg_left_leg_fat: segmentByKey('left_leg')?.fat_mass ?? null,
    },
  });

  // Watch live values for auto-calculations
  const weight = safeNum(useWatch({ control, name: 'weight' }));
  const height = safeNum(useWatch({ control, name: 'height' }));
  const age = safeNum(useWatch({ control, name: 'age' }));
  const sex = useWatch({ control, name: 'sex' });
  const activity_level = useWatch({ control, name: 'activity_level' });
  const visceral_fat_val = safeNum(useWatch({ control, name: 'visceral_fat' }));
  const waist_val = safeNum(useWatch({ control, name: 'waist' }));
  const hip_val = safeNum(useWatch({ control, name: 'hip' }));
  const inbody_score_val = safeNum(useWatch({ control, name: 'inbody_score' }));
  const water_per_day_val = safeNum(useWatch({ control, name: 'water_per_day' }));
  const sleep_hours_val = safeNum(useWatch({ control, name: 'sleep_hours' }));

  // Derived calculations
  const bmi = weight && height ? (() => { try { return calculateBMI(weight, height); } catch { return null; } })() : null;
  const bmiClass = bmi ? classifyBMI(bmi) : null;
  const bmr = weight && height && age && sex ? (() => { try { return calculateBMR(weight, height, age, sex as 'M' | 'F'); } catch { return null; } })() : null;
  const tdee = bmr && activity_level ? (() => { try { return calculateTDEE(bmr, activity_level as ActivityLevel); } catch { return null; } })() : null;
  const idealWeight = height && sex ? calculateIdealWeight(height, sex as 'M' | 'F') : null;
  const whr = waist_val && hip_val ? (() => { try { return calculateWaistHipRatio(waist_val, hip_val); } catch { return null; } })() : null;
  const whrClass = whr && sex ? classifyWaistHipRatio(whr, sex as 'M' | 'F') : null;
  const suggestedWater = weight ? calculateDailyWater(weight) : null;

  // Auto-suggest water when weight changes
  useEffect(() => {
    if (suggestedWater && !water_per_day_val) {
      setValue('water_per_day', suggestedWater);
    }
  }, [suggestedWater, water_per_day_val, setValue]);

  // Build a partial profile for body state narrative
  const liveProfile: AthleteProfilesRow = {
    id: initialProfile?.id ?? '',
    user_id: initialProfile?.user_id ?? '',
    weight: weight,
    height: height,
    age: age,
    sex: sex as 'M' | 'F' | null,
    bmi: bmi,
    bmr: bmr,
    tdee: tdee,
    body_fat_percentage: safeNum(watch('body_fat_percentage')),
    fat_mass: safeNum(watch('fat_mass')),
    skeletal_muscle_mass: safeNum(watch('skeletal_muscle_mass')),
    lean_mass: safeNum(watch('lean_mass')),
    body_water: safeNum(watch('body_water')),
    protein_mass: safeNum(watch('protein_mass')),
    minerals_mass: safeNum(watch('minerals_mass')),
    visceral_fat: visceral_fat_val,
    waist_hip_ratio: whr,
    obesity_grade: bmiClass,
    inbody_score: inbody_score_val,
    ideal_weight: idealWeight,
    goal: watch('goal') ?? null,
    activity_level: (activity_level as typeof initialProfile.activity_level) ?? null,
    sleep_hours: sleep_hours_val,
    sleep_quality: null,
    water_per_day: water_per_day_val,
    notes: watch('notes') ?? null,
    created_at: initialProfile?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const bodyStateNarrative = readBodyState(liveProfile);

  const onSubmit = async (data: FormValues) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── SECTION 1: DADOS PESSOAIS ── */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
        <SectionHeading number={1} icon={<User className="w-4 h-4" />} title="Dados Pessoais" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
          </div>
          <Input
            label="Peso"
            type="number"
            step="0.1"
            placeholder="80"
            suffix={<span className="text-xs text-[#666] pr-3">kg</span>}
            error={errors.weight?.message}
            {...register('weight')}
          />
          <Input
            label="Altura"
            type="number"
            step="1"
            placeholder="175"
            suffix={<span className="text-xs text-[#666] pr-3">cm</span>}
            error={errors.height?.message}
            {...register('height')}
          />
          <Input
            label="Idade"
            type="number"
            step="1"
            placeholder="30"
            suffix={<span className="text-xs text-[#666] pr-3">anos</span>}
            error={errors.age?.message}
            {...register('age')}
          />

          {/* Sex radio */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider mb-2">
              Sexo biológico
            </label>
            <Controller
              control={control}
              name="sex"
              render={({ field }) => (
                <div className="flex gap-3">
                  {[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }].map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-150',
                        field.value === opt.value
                          ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                          : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#a0a0a0] hover:border-[#3a3a3a]',
                      )}
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        checked={field.value === opt.value}
                        onChange={() => field.onChange(opt.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.sex && <p className="mt-1 text-xs text-red-400">{errors.sex.message}</p>}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: COMPOSIÇÃO CORPORAL ── */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
        <SectionHeading number={2} icon={<Weight className="w-4 h-4" />} title="Composição Corporal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Gordura corporal"
            type="number"
            step="0.1"
            placeholder="18.5"
            suffix={<span className="text-xs text-[#666] pr-3">%</span>}
            error={errors.body_fat_percentage?.message}
            {...register('body_fat_percentage')}
          />
          <Input
            label="Massa gorda"
            type="number"
            step="0.1"
            placeholder="15.2"
            suffix={<span className="text-xs text-[#666] pr-3">kg</span>}
            error={errors.fat_mass?.message}
            {...register('fat_mass')}
          />
          <Input
            label="Massa muscular esq."
            type="number"
            step="0.1"
            placeholder="35.4"
            suffix={<span className="text-xs text-[#666] pr-3">kg</span>}
            error={errors.skeletal_muscle_mass?.message}
            {...register('skeletal_muscle_mass')}
          />
          <Input
            label="Massa magra"
            type="number"
            step="0.1"
            placeholder="64.8"
            suffix={<span className="text-xs text-[#666] pr-3">kg</span>}
            error={errors.lean_mass?.message}
            {...register('lean_mass')}
          />
          <Input
            label="Água corporal"
            type="number"
            step="0.1"
            placeholder="47.4"
            suffix={<span className="text-xs text-[#666] pr-3">L</span>}
            error={errors.body_water?.message}
            {...register('body_water')}
          />
          <Input
            label="Massa proteica"
            type="number"
            step="0.1"
            placeholder="12.6"
            suffix={<span className="text-xs text-[#666] pr-3">kg</span>}
            error={errors.protein_mass?.message}
            {...register('protein_mass')}
          />
          <Input
            label="Massa mineral"
            type="number"
            step="0.1"
            placeholder="3.8"
            suffix={<span className="text-xs text-[#666] pr-3">kg</span>}
            error={errors.minerals_mass?.message}
            {...register('minerals_mass')}
          />
        </div>
      </div>

      {/* ── SECTION 3: ÍNDICES E MARCADORES ── */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
        <SectionHeading number={3} icon={<TrendingUp className="w-4 h-4" />} title="Índices e Marcadores" />

        {/* Calculated Fields Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2.5">
            <p className="text-2xs text-[#666] uppercase tracking-wider mb-1">IMC</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[#00ff88] font-mono">
                {bmi !== null ? bmi.toFixed(1) : '—'}
              </span>
            </div>
            {bmiClass && (
              <div className="mt-1.5">
                <Badge variant={getBMIBadgeColor(bmiClass)} size="sm">{bmiClass}</Badge>
              </div>
            )}
          </div>
          <CalcField label="TMB (Harris-Benedict)" value={bmr !== null ? bmr.toLocaleString('pt-BR') : '—'} unit="kcal/dia" />
          <CalcField label="TDEE" value={tdee !== null ? tdee.toLocaleString('pt-BR') : '—'} unit="kcal/dia" />
          <CalcField label="Peso ideal (Devine)" value={idealWeight !== null ? idealWeight.toFixed(1) : '—'} unit="kg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Visceral fat */}
          <div>
            <Input
              label="Gordura visceral"
              type="number"
              step="1"
              min="1"
              max="20"
              placeholder="8"
              suffix={<span className="text-xs text-[#666] pr-3">1–20</span>}
              error={errors.visceral_fat?.message}
              {...register('visceral_fat')}
            />
            {visceral_fat_val !== null && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getVisceralColor(visceral_fat_val) }}
                />
                <span className="text-xs" style={{ color: getVisceralColor(visceral_fat_val) }}>
                  {visceral_fat_val <= 9 ? 'Nível saudável' : visceral_fat_val <= 14 ? 'Atenção' : 'Alto risco'}
                </span>
              </div>
            )}
          </div>

          {/* Waist */}
          <Input
            label="Cintura"
            type="number"
            step="0.5"
            placeholder="85"
            suffix={<span className="text-xs text-[#666] pr-3">cm</span>}
            error={errors.waist?.message}
            {...register('waist')}
          />

          {/* Hip */}
          <div>
            <Input
              label="Quadril"
              type="number"
              step="0.5"
              placeholder="96"
              suffix={<span className="text-xs text-[#666] pr-3">cm</span>}
              error={errors.hip?.message}
              {...register('hip')}
            />
            {whr !== null && whrClass && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[#666]">C/Q: <span className="text-white font-semibold">{whr.toFixed(2)}</span></span>
                <Badge variant={getWHRBadgeColor(whrClass)} size="sm">{whrClass}</Badge>
              </div>
            )}
          </div>

          {/* InBody Score */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              label="Score InBody"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="80"
              suffix={<span className="text-xs text-[#666] pr-3">/ 100</span>}
              error={errors.inbody_score?.message}
              {...register('inbody_score')}
            />
            {inbody_score_val !== null && (
              <div className="mt-2">
                <ProgressBar
                  value={inbody_score_val}
                  max={100}
                  variant={inbody_score_val >= 70 ? 'success' : inbody_score_val >= 40 ? 'warning' : 'danger'}
                  size="sm"
                  showLabel
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: META E ESTILO DE VIDA ── */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
        <SectionHeading number={4} icon={<Target className="w-4 h-4" />} title="Meta e Estilo de Vida" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Controller
            control={control}
            name="goal"
            render={({ field }) => (
              <Select
                label="Objetivo"
                options={GOAL_OPTIONS}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.goal?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="activity_level"
            render={({ field }) => (
              <Select
                label="Nível de atividade"
                options={ACTIVITY_OPTIONS}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.activity_level?.message}
              />
            )}
          />
          <Input
            label="Período da meta"
            type="number"
            step="1"
            min="1"
            max="104"
            placeholder="12"
            suffix={<span className="text-xs text-[#666] pr-3">semanas</span>}
            error={errors.goal_period_weeks?.message}
            {...register('goal_period_weeks')}
          />
          <div>
            <Input
              label="Água diária"
              type="number"
              step="50"
              placeholder={suggestedWater?.toString() ?? '2800'}
              suffix={<span className="text-xs text-[#666] pr-3">ml</span>}
              helperText={suggestedWater ? `Sugerido: ${suggestedWater} ml (peso × 35 ml)` : undefined}
              error={errors.water_per_day?.message}
              {...register('water_per_day')}
            />
          </div>
          <Input
            label="Horas de sono"
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="8"
            suffix={<span className="text-xs text-[#666] pr-3">h/noite</span>}
            error={errors.sleep_hours?.message}
            {...register('sleep_hours')}
          />
          <Controller
            control={control}
            name="sleep_quality"
            render={({ field }) => (
              <Select
                label="Qualidade do sono"
                options={SLEEP_QUALITY_OPTIONS}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.sleep_quality?.message}
              />
            )}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label="Observações"
              placeholder="Informações adicionais, lesões, restrições..."
              rows={3}
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 5: ANÁLISE SEGMENTAR ── */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
        <SectionHeading number={5} icon={<Ruler className="w-4 h-4" />} title="Análise Segmentar" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SEGMENT_CONFIG.map((seg) => (
            <div key={seg.key} className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-3">
              <p className="text-xs font-bold text-[#00ff88] uppercase tracking-wider mb-3">{seg.label}</p>
              <div className="space-y-2">
                <Input
                  label="Massa magra"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  suffix={<span className="text-xs text-[#666] pr-2">kg</span>}
                  size="sm"
                  error={(errors as Record<string, { message?: string }>)[`seg_${seg.key}_lean`]?.message}
                  {...register(`seg_${seg.key}_lean` as keyof FormValues)}
                />
                <Input
                  label="Massa gorda"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  suffix={<span className="text-xs text-[#666] pr-2">kg</span>}
                  size="sm"
                  error={(errors as Record<string, { message?: string }>)[`seg_${seg.key}_fat`]?.message}
                  {...register(`seg_${seg.key}_fat` as keyof FormValues)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 6: PAINEL CORPORAL ── */}
      <div className="rounded-xl bg-[#1e1e1e] border border-[#00ff88]/20 p-5">
        <SectionHeading number={6} icon={<Zap className="w-4 h-4" />} title="Painel Corporal" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4 text-center">
            <Zap className="w-5 h-5 text-[#00ff88] mx-auto mb-1" />
            <p className="text-2xs text-[#666] uppercase tracking-wider mb-1">TDEE</p>
            <p className="text-2xl font-black text-[#00ff88] font-mono">
              {tdee !== null ? tdee.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-xs text-[#666]">kcal / dia</p>
          </div>
          <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4 text-center">
            <Droplets className="w-5 h-5 text-[#00d4ff] mx-auto mb-1" />
            <p className="text-2xs text-[#666] uppercase tracking-wider mb-1">Água recomendada</p>
            <p className="text-2xl font-black text-[#00d4ff] font-mono">
              {suggestedWater !== null ? suggestedWater.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-xs text-[#666]">ml / dia</p>
          </div>
          <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4 text-center">
            <Activity className="w-5 h-5 text-[#ffaa00] mx-auto mb-1" />
            <p className="text-2xs text-[#666] uppercase tracking-wider mb-1">IMC atual</p>
            <p className="text-2xl font-black text-[#ffaa00] font-mono">
              {bmi !== null ? bmi.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-[#666]">{bmiClass ?? '—'}</p>
          </div>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4">
          <p className="text-2xs text-[#666] uppercase tracking-wider mb-2">Estado Corporal</p>
          <p className="text-sm text-[#a0a0a0] leading-relaxed">{bodyStateNarrative}</p>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex justify-end pt-2 pb-6">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          leftIcon={isSubmitting ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        >
          Salvar Perfil Corporal
        </Button>
      </div>
    </form>
  );
}

export default BodyProfileForm;
