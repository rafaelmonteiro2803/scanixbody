'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'
import type { WorkoutExercisesRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(80, 'Máximo de 80 caracteres'),
  sets: z
    .number({ invalid_type_error: 'Informe o número de séries' })
    .int('Deve ser inteiro')
    .min(1, 'Mínimo 1 série')
    .max(20, 'Máximo 20 séries'),
  target_reps: z.string().max(20, 'Máximo 20 caracteres').optional(),
  load: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || (typeof v === 'number' && isNaN(v)) ? undefined : Number(v)),
    z.number().min(0, 'Mínimo 0 kg').max(1000, 'Máximo 1000 kg').optional()
  ),
  load_type: z.enum(['total', 'per_side']).default('total'),
  rest_seconds: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || (typeof v === 'number' && isNaN(v)) ? undefined : Number(v)),
    z.number().int('Deve ser inteiro').min(0, 'Mínimo 0 segundos').max(600, 'Máximo 600 segundos').optional()
  ),
  notes: z.string().max(300, 'Máximo de 300 caracteres').optional(),
})

type ExerciseFormValues = z.infer<typeof exerciseSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExerciseFormProps {
  /** If provided, form is in edit mode */
  initialData?: WorkoutExercisesRow
  onSubmit: (values: ExerciseFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExerciseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExerciseFormProps) {
  const isEdit = Boolean(initialData)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      sets: initialData?.sets ?? 3,
      target_reps: initialData?.target_reps ?? '',
      load: initialData?.load ?? undefined,
      load_type: (initialData?.load_type as 'total' | 'per_side') ?? 'total',
      rest_seconds: initialData?.rest_seconds ?? 60,
      notes: initialData?.notes ?? '',
    },
  })

  const loadType = watch('load_type')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background-card shadow-card-xl animate-modal-content max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-text-title">
                {isEdit ? 'Editar Exercício' : 'Novo Exercício'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isEdit ? 'Altere os dados do exercício' : 'Configure o exercício para este treino'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-title"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <Input
            label="Nome do Exercício"
            placeholder="Ex: Supino Reto com Barra"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          {/* Sets + Target Reps */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Séries"
              type="number"
              placeholder="3"
              error={errors.sets?.message}
              required
              {...register('sets', { valueAsNumber: true })}
            />
            <Input
              label="Repetições alvo"
              placeholder="Ex: 8-12 ou 10"
              error={errors.target_reps?.message}
              {...register('target_reps')}
            />
          </div>

          {/* Load */}
          <div className="space-y-2">
            <Input
              label="Carga (kg)"
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder="Ex: 17.5"
              error={errors.load?.message}
              suffix={<span className="text-xs">kg</span>}
              {...register('load', { valueAsNumber: true })}
            />

            {/* Per side / total toggle — only shown when load is set */}
            <Controller
              name="load_type"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Carga informada é:</span>
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => field.onChange('total')}
                      className={cn(
                        'px-3 py-1.5 font-medium transition-colors',
                        loadType === 'total'
                          ? 'bg-primary text-black'
                          : 'bg-transparent text-text-muted hover:text-text-secondary',
                      )}
                    >
                      Total
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('per_side')}
                      className={cn(
                        'px-3 py-1.5 font-medium transition-colors border-l border-border',
                        loadType === 'per_side'
                          ? 'bg-primary text-black'
                          : 'bg-transparent text-text-muted hover:text-text-secondary',
                      )}
                    >
                      Por lado
                    </button>
                  </div>
                  {loadType === 'per_side' && (
                    <span className="text-xs text-primary/70">
                      (cada lado)
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Rest */}
          <Input
            label="Descanso (seg)"
            type="number"
            placeholder="60"
            error={errors.rest_seconds?.message}
            suffix={<span className="text-xs">s</span>}
            {...register('rest_seconds', { valueAsNumber: true })}
          />

          {/* Notes */}
          <Textarea
            label="Observações"
            placeholder="Anotações, técnica, variações..."
            rows={3}
            error={errors.notes?.message}
            showCount
            maxLength={300}
            {...register('notes')}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              loading={isSubmitting}
            >
              {isEdit ? 'Salvar Alterações' : 'Adicionar Exercício'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExerciseForm
