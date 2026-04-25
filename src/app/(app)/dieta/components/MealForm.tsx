'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UtensilsCrossed, Clock, FileText, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { MealsRow } from '@/types/database.types';
import type { CreateMealDTO } from '@/types/domain.types';
import { cn } from '@/lib/utils';

// ── Zod schema ─────────────────────────────────────────────────

const mealFormSchema = z.object({
  meal_name: z.string().min(1, 'Selecione o tipo de refeição'),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de horário inválido (HH:MM)')
    .optional()
    .or(z.literal('')),
  items: z.string().optional(),
  calories: z
    .number({ invalid_type_error: 'Insira um número válido' })
    .min(0, 'Valor mínimo: 0')
    .max(9999, 'Valor máximo: 9999')
    .optional()
    .or(z.nan())
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
  protein_g: z
    .number({ invalid_type_error: 'Insira um número válido' })
    .min(0)
    .max(999)
    .optional()
    .or(z.nan())
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
  carbs_g: z
    .number({ invalid_type_error: 'Insira um número válido' })
    .min(0)
    .max(999)
    .optional()
    .or(z.nan())
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
  fat_g: z
    .number({ invalid_type_error: 'Insira um número válido' })
    .min(0)
    .max(999)
    .optional()
    .or(z.nan())
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined)),
});

export type MealFormValues = z.infer<typeof mealFormSchema>;

// ── Options ────────────────────────────────────────────────────

const MEAL_SUGGESTIONS = [
  'Café da Manhã',
  'Almoço',
  'Jantar',
  'Lanche da Manhã',
  'Lanche da Tarde',
  'Pré-Treino',
  'Pós-Treino',
  'Ceia',
  'Suplemento',
];

// ── Props ──────────────────────────────────────────────────────

export interface MealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMealDTO) => void | Promise<void>;
  defaultValues?: Partial<MealsRow>;
  mealDate: string;
  loading?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export function MealForm({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  mealDate,
  loading = false,
}: MealFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      meal_name: defaultValues?.meal_name ?? '',
      time: defaultValues?.time ?? '',
      items: defaultValues?.items ?? '',
      calories: defaultValues?.calories ?? undefined,
      protein_g: defaultValues?.protein_g ?? undefined,
      carbs_g: defaultValues?.carbs_g ?? undefined,
      fat_g: defaultValues?.fat_g ?? undefined,
    },
  });


  // Reset form when opened with new defaults
  useEffect(() => {
    if (isOpen) {
      reset({
        meal_name: defaultValues?.meal_name ?? '',
        time: defaultValues?.time ?? '',
        items: defaultValues?.items ?? '',
        calories: defaultValues?.calories ?? undefined,
        protein_g: defaultValues?.protein_g ?? undefined,
        carbs_g: defaultValues?.carbs_g ?? undefined,
        fat_g: defaultValues?.fat_g ?? undefined,
      });
    }
  }, [isOpen, defaultValues, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    const dto: CreateMealDTO = {
      meal_date: mealDate,
      meal_name: data.meal_name,
      time: data.time || undefined,
      items: data.items || undefined,
      calories: data.calories,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fat_g: data.fat_g,
      source: 'manual',
    };
    await onSubmit(dto);
  });

  const isEditing = Boolean(defaultValues?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Refeição' : 'Adicionar Refeição'}
      subtitle={`Data: ${mealDate}`}
      size="lg"
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="meal-form"
            variant="primary"
            size="md"
            loading={loading}
            className="flex-1"
          >
            {isEditing ? 'Salvar Alterações' : 'Adicionar Refeição'}
          </Button>
        </div>
      }
    >
      <form id="meal-form" onSubmit={handleFormSubmit} className="space-y-4">
        {/* Meal name — free text with quick-pick datalist */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Nome da Refeição <span className="text-danger">*</span>
          </label>
          <input
            {...register('meal_name')}
            list="meal-suggestions"
            placeholder="Ex: Café da Manhã, Pré-Treino, Lanche..."
            autoComplete="off"
            className={cn(
              'w-full h-10 rounded-lg border bg-background-secondary px-3 text-sm text-text-title placeholder:text-text-faint transition-colors focus:outline-none focus:ring-1',
              errors.meal_name
                ? 'border-danger focus:border-danger focus:ring-danger'
                : 'border-border hover:border-border-strong focus:border-primary focus:ring-primary',
            )}
          />
          <datalist id="meal-suggestions">
            {MEAL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {errors.meal_name && (
            <p className="mt-1 text-xs text-danger">{errors.meal_name.message}</p>
          )}
        </div>

        {/* Time picker */}
        <div>
          <Input
            {...register('time')}
            label="Horário"
            type="time"
            error={errors.time?.message}
            prefix={<Clock className="w-4 h-4" />}
            placeholder="HH:MM"
          />
        </div>

        {/* Food items */}
        <div>
          <Textarea
            {...register('items')}
            label="Alimentos"
            rows={3}
            placeholder="Ex: 3 ovos mexidos, 2 fatias de pão integral, 1 xícara de café preto..."
            error={errors.items?.message}
          />
        </div>

        {/* Macros grid */}
        <div>
          <p className="text-sm font-medium text-text-secondary mb-3">
            Informações Nutricionais
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <div className="col-span-2">
              <Input
                {...register('calories', { valueAsNumber: true })}
                label="Calorias"
                type="number"
                min={0}
                max={9999}
                step={1}
                placeholder="0"
                error={errors.calories?.message}
                prefix={
                  <span className="text-orange-400">
                    <Flame className="w-4 h-4" />
                  </span>
                }
                suffix={<span className="text-xs text-text-muted">kcal</span>}
              />
            </div>

            {/* Protein */}
            <Input
              {...register('protein_g', { valueAsNumber: true })}
              label="Proteína"
              type="number"
              min={0}
              max={999}
              step={0.1}
              placeholder="0"
              error={errors.protein_g?.message}
              prefix={
                <span className="text-blue-400">
                  <Beef className="w-4 h-4" />
                </span>
              }
              suffix={<span className="text-xs text-text-muted">g</span>}
            />

            {/* Carbs */}
            <Input
              {...register('carbs_g', { valueAsNumber: true })}
              label="Carboidratos"
              type="number"
              min={0}
              max={999}
              step={0.1}
              placeholder="0"
              error={errors.carbs_g?.message}
              prefix={
                <span className="text-yellow-400">
                  <Wheat className="w-4 h-4" />
                </span>
              }
              suffix={<span className="text-xs text-text-muted">g</span>}
            />

            {/* Fat */}
            <div className="col-span-2 sm:col-span-1">
              <Input
                {...register('fat_g', { valueAsNumber: true })}
                label="Gorduras"
                type="number"
                min={0}
                max={999}
                step={0.1}
                placeholder="0"
                error={errors.fat_g?.message}
                prefix={
                  <span className="text-orange-500">
                    <Droplets className="w-4 h-4" />
                  </span>
                }
                suffix={<span className="text-xs text-text-muted">g</span>}
              />
            </div>
          </div>
        </div>

        {/* Macro quick-calc hint */}
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="text-primary font-semibold">Dica: </span>
            Se não souber os valores exatos, preencha apenas a descrição dos alimentos. A estimativa nutricional pode ser feita pela aba{' '}
            <span className="text-text-secondary font-medium">Análise IA</span>.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default MealForm;
