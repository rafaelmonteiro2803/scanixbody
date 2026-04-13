'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Plus,
  Dumbbell,
  Clock,
  Weight,
  RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { WorkoutDayWithExercises } from '@/services/workout.service'
import type { WorkoutExercisesRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkoutDayCardProps {
  day: WorkoutDayWithExercises
  onEdit: (day: WorkoutDayWithExercises) => void
  onDelete: (dayId: string) => void
  onAddExercise: (dayId: string) => void
  onEditExercise: (exercise: WorkoutExercisesRow) => void
  onDeleteExercise: (exerciseId: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRestTime(seconds: number | null): string {
  if (!seconds) return '–'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

// ---------------------------------------------------------------------------
// ExerciseRow
// ---------------------------------------------------------------------------

function ExerciseRow({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: WorkoutExercisesRow
  onEdit: (ex: WorkoutExercisesRow) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg bg-background border border-border px-4 py-3 transition-colors hover:border-border-strong">
      {/* Order bullet */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Dumbbell className="w-3 h-3 text-primary" />
      </div>

      {/* Name + notes */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-title truncate">{exercise.name}</p>
        {exercise.notes && (
          <p className="text-xs text-text-muted truncate mt-0.5">{exercise.notes}</p>
        )}
      </div>

      {/* Stats chips */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-surface-2 text-text-secondary rounded-md px-2 py-1">
          <Weight className="w-3 h-3" />
          {exercise.sets}×{exercise.target_reps ?? '–'}
        </span>
        {exercise.load != null && (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary rounded-md px-2 py-1">
            {exercise.load} kg
          </span>
        )}
        {exercise.rest_seconds != null && (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-surface-2 text-text-secondary rounded-md px-2 py-1">
            <Clock className="w-3 h-3" />
            {formatRestTime(exercise.rest_seconds)}
          </span>
        )}
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden flex-shrink-0 text-xs text-text-secondary">
        {exercise.sets}×{exercise.target_reps ?? '–'}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(exercise)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label={`Editar ${exercise.name}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(exercise.id)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          aria-label={`Excluir ${exercise.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WorkoutDayCard
// ---------------------------------------------------------------------------

export function WorkoutDayCard({
  day,
  onEdit,
  onDelete,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}: WorkoutDayCardProps) {
  const exerciseCount = day.exercises.length
  // Start expanded when there are no exercises so the add button is immediately visible
  const [expanded, setExpanded] = useState(exerciseCount === 0)

  return (
    <div className="rounded-xl border border-border bg-background-card overflow-hidden transition-all duration-200 hover:border-border-strong">
      {/* Card Header */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-text-title leading-tight truncate">
              {day.name}
            </h3>

            {/* Muscle group badges */}
            {day.muscle_groups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {day.muscle_groups.map((group) => (
                  <Badge key={group} variant="primary" size="sm">
                    {group}
                  </Badge>
                ))}
              </div>
            )}

            {/* Exercise count */}
            <p className="text-xs text-text-muted mt-2">
              {exerciseCount === 0
                ? 'Nenhum exercício'
                : `${exerciseCount} exercício${exerciseCount > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Add exercise — always visible */}
            <button
              onClick={() => {
                onAddExercise(day.id)
                setExpanded(true)
              }}
              className="hidden sm:flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label={`Adicionar exercício em ${day.name}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Exercício
            </button>
            {/* Mobile: icon only */}
            <button
              onClick={() => {
                onAddExercise(day.id)
                setExpanded(true)
              }}
              className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label={`Adicionar exercício em ${day.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(day)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label={`Editar ${day.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(day.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              aria-label={`Excluir ${day.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-title hover:bg-surface-2 transition-colors"
              aria-label={expanded ? 'Recolher exercícios' : 'Expandir exercícios'}
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable exercise list */}
      {expanded && (
        <div className="border-t border-border px-5 pb-4">
          {/* Column headers */}
          {exerciseCount > 0 && (
            <div className="hidden sm:flex items-center gap-3 py-2 px-4 text-xs font-medium text-text-muted">
              <div className="w-6" />
              <div className="flex-1">Exercício</div>
              <div className="w-24 text-center">Séries × Reps</div>
              <div className="w-16 text-center">Carga</div>
              <div className="w-16 text-center">Descanso</div>
              <div className="w-16" />
            </div>
          )}

          {/* Exercise list */}
          <div className="space-y-2 mt-2">
            {day.exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
                  <RotateCcw className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-sm text-text-secondary">Nenhum exercício ainda</p>
                <p className="text-xs text-text-muted mt-1">
                  Adicione exercícios para montar seu treino
                </p>
              </div>
            ) : (
              day.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={onEditExercise}
                  onDelete={onDeleteExercise}
                />
              ))
            )}
          </div>

          {/* Add exercise button */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onAddExercise(day.id)}
              className="w-full"
            >
              Adicionar Exercício
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutDayCard
