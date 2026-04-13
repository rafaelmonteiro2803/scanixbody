'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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
  load: z
    .number({ invalid_type_error: 'Informe a carga' })
    .min(0, 'Mínimo 0 kg')
    .max(1000, 'Máximo 1000 kg')
    .optional(),
  rest_seconds: z
    .number({ invalid_type_error: 'Informe o descanso' })
    .int('Deve ser inteiro')
    .min(0, 'Mínimo 0 segundos')
    .max(600, 'Máximo 600 segundos')
    .optional(),
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
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      sets: initialData?.sets ?? 3,
      target_reps: initialData?.target_reps ?? '',
      load: initialData?.load ?? undefined,
      rest_seconds: initialData?.rest_seconds ?? 60,
      notes: initialData?.notes ?? '',
    },
  })

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

          {/* Load + Rest */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Carga (kg)"
              type="number"
              placeholder="Ex: 80"
              error={errors.load?.message}
              suffix={<span className="text-xs">kg</span>}
              {...register('load', { valueAsNumber: true })}
            />
            <Input
              label="Descanso (seg)"
              type="number"
              placeholder="60"
              error={errors.rest_seconds?.message}
              suffix={<span className="text-xs">s</span>}
              {...register('rest_seconds', { valueAsNumber: true })}
            />
          </div>

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
