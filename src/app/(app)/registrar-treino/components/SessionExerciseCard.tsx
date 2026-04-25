'use client'

import React from 'react'
import { Plus, Trash2, Trophy, Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { WorkoutExercisesRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SetRow {
  setNumber: number
  weight: string
  reps: string
  isPR: boolean
}

interface SessionExerciseCardProps {
  exercise: WorkoutExercisesRow
  sets: SetRow[]
  onSetChange: (exerciseId: string, setNumber: number, field: 'weight' | 'reps', value: string) => void
  onAddSet: (exerciseId: string) => void
  onRemoveSet: (exerciseId: string, setNumber: number) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionExerciseCard({
  exercise,
  sets,
  onSetChange,
  onAddSet,
  onRemoveSet,
}: SessionExerciseCardProps) {
  const hasPR = sets.some((s) => s.isPR)

  return (
    <div
      className={`rounded-xl border bg-background-card overflow-hidden transition-all duration-200 ${
        hasPR ? 'border-primary/50 shadow-[0_0_16px_rgba(0,255,136,0.08)]' : 'border-border'
      }`}
    >
      {/* Exercise header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-text-title leading-tight">{exercise.name}</h3>
            {hasPR && (
              <Badge variant="success" size="sm" icon={<Trophy className="w-3 h-3" />}>
                PR
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Planejado: {exercise.sets} série{exercise.sets > 1 ? 's' : ''}
            {exercise.target_reps ? ` × ${exercise.target_reps} reps` : ''}
            {exercise.load ? ` @ ${exercise.load} kg${exercise.load_type === 'per_side' ? ' /lado' : ''}` : ''}
          </p>
        </div>
      </div>

      {/* Sets table */}
      <div className="px-5 py-3">
        {/* Header row */}
        <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 mb-2 px-1">
          <span className="text-xs font-medium text-text-muted text-center">#</span>
          <span className="text-xs font-medium text-text-muted">Peso (kg)</span>
          <span className="text-xs font-medium text-text-muted">Reps</span>
          <span />
        </div>

        {/* Set rows */}
        <div className="space-y-2">
          {sets.map((set) => (
            <div
              key={set.setNumber}
              className={`grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 rounded-lg px-1 py-1.5 transition-colors ${
                set.isPR
                  ? 'bg-primary/5 border border-primary/20'
                  : 'hover:bg-surface-2/50'
              }`}
            >
              {/* Set number */}
              <div className="flex items-center justify-center">
                {set.isPR ? (
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-primary" />
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-text-muted text-center w-6 h-6 flex items-center justify-center bg-surface-2 rounded-full">
                    {set.setNumber}
                  </span>
                )}
              </div>

              {/* Weight input */}
              <input
                type="number"
                inputMode="decimal"
                placeholder={exercise.load ? String(exercise.load) : '0'}
                value={set.weight}
                onChange={(e) =>
                  onSetChange(exercise.id, set.setNumber, 'weight', e.target.value)
                }
                className={`w-full h-9 rounded-lg border bg-background px-3 text-sm text-text-title placeholder:text-text-muted outline-none transition-colors focus:border-primary ${
                  set.isPR ? 'border-primary/40' : 'border-border'
                }`}
                min={0}
                step={0.5}
              />

              {/* Reps input */}
              <input
                type="number"
                inputMode="numeric"
                placeholder={exercise.target_reps ?? '0'}
                value={set.reps}
                onChange={(e) =>
                  onSetChange(exercise.id, set.setNumber, 'reps', e.target.value)
                }
                className={`w-full h-9 rounded-lg border bg-background px-3 text-sm text-text-title placeholder:text-text-muted outline-none transition-colors focus:border-primary ${
                  set.isPR ? 'border-primary/40' : 'border-border'
                }`}
                min={0}
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemoveSet(exercise.id, set.setNumber)}
                disabled={sets.length <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={`Remover série ${set.setNumber}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add extra set */}
        <button
          type="button"
          onClick={() => onAddSet(exercise.id)}
          className="mt-3 w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar série extra
        </button>
      </div>
    </div>
  )
}

export default SessionExerciseCard
