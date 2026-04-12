'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { WorkoutDaysRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Pernas',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Panturrilha',
  'Core',
  'Full Body',
  'Cardio',
] as const

const workoutDaySchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(60, 'Máximo de 60 caracteres'),
  muscle_groups: z
    .array(z.string())
    .min(1, 'Selecione pelo menos 1 grupo muscular'),
})

type WorkoutDayFormValues = z.infer<typeof workoutDaySchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkoutDayFormProps {
  /** If provided, form will be in edit mode */
  initialData?: WorkoutDaysRow
  onSubmit: (values: WorkoutDayFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkoutDayForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WorkoutDayFormProps) {
  const isEdit = Boolean(initialData)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkoutDayFormValues>({
    resolver: zodResolver(workoutDaySchema),
    defaultValues: {
      name: initialData?.name ?? '',
      muscle_groups: initialData?.muscle_groups ?? [],
    },
  })

  const selectedGroups = watch('muscle_groups')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-[#161616] shadow-card-xl animate-modal-content">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                {isEdit ? 'Editar Dia de Treino' : 'Novo Dia de Treino'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isEdit ? 'Altere as informações do treino' : 'Configure o dia e grupos musculares'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-2 hover:text-white"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Name field */}
          <Input
            label="Nome do Treino"
            placeholder="Ex: Treino A — Peito e Tríceps"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          {/* Muscle groups */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Grupos Musculares
              <span className="ml-1 text-danger" aria-hidden>*</span>
            </label>
            <Controller
              name="muscle_groups"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((group) => {
                    const isSelected = field.value.includes(group)
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            field.onChange(field.value.filter((g) => g !== group))
                          } else {
                            field.onChange([...field.value, group])
                          }
                        }}
                        className={`
                          badge-base cursor-pointer transition-all duration-150
                          ${
                            isSelected
                              ? 'bg-primary/20 text-primary border border-primary/50 shadow-glow-sm'
                              : 'bg-surface-2 text-text-secondary border border-border hover:border-border-strong hover:text-white'
                          }
                        `}
                      >
                        {group}
                      </button>
                    )
                  })}
                </div>
              )}
            />
            {errors.muscle_groups && (
              <p className="text-xs text-danger" role="alert">
                {errors.muscle_groups.message}
              </p>
            )}
            {selectedGroups.length > 0 && (
              <p className="text-xs text-text-secondary">
                {selectedGroups.length} grupo{selectedGroups.length > 1 ? 's' : ''} selecionado{selectedGroups.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

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
              {isEdit ? 'Salvar Alterações' : 'Criar Treino'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkoutDayForm
