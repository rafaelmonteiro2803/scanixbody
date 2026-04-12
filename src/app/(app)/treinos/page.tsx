'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Upload,
  Dumbbell,
  AlertCircle,
  FileUp,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { WorkoutDayCard } from './components/WorkoutDayCard'
import { WorkoutDayForm } from './components/WorkoutDayForm'
import { ExerciseForm } from './components/ExerciseForm'
import {
  workoutDayService,
  workoutExerciseService,
  type WorkoutDayWithExercises,
} from '@/services/workout.service'
import type { WorkoutDaysRow, WorkoutExercisesRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModalState =
  | { type: 'none' }
  | { type: 'create-day' }
  | { type: 'edit-day'; day: WorkoutDayWithExercises }
  | { type: 'create-exercise'; dayId: string }
  | { type: 'edit-exercise'; exercise: WorkoutExercisesRow }
  | { type: 'import' }

// ---------------------------------------------------------------------------
// Import modal (stub – accepts JSON file)
// ---------------------------------------------------------------------------

function ImportModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/json') {
      setError('Apenas arquivos JSON são suportados.')
      return
    }
    setError(null)
    setFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-[#161616] shadow-card-xl animate-modal-content">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Importar Treino</h2>
              <p className="text-xs text-text-secondary">Carregue um arquivo JSON de treino</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-2 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Upload area */}
          <label className="block cursor-pointer">
            <div className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 text-center">
              <FileUp className="w-8 h-8 text-text-muted mx-auto mb-3" />
              {file ? (
                <p className="text-sm font-medium text-primary">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-text-secondary">
                    Arraste ou clique para selecionar
                  </p>
                  <p className="text-xs text-text-muted mt-1">Somente arquivos .json</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <p className="text-xs text-text-muted">
            A importação via arquivo JSON está disponível. Para integração com planilhas, use a exportação em formato JSON compatível com o SCANIX BODY.
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              disabled={!file}
              onClick={onClose}
            >
              Importar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm delete modal
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-[#161616] shadow-card-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-sm text-text-secondary mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" size="md" className="flex-1" onClick={onConfirm} loading={isLoading}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TreinosPage() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDayWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'day'; id: string; name: string }
    | { kind: 'exercise'; id: string; name: string }
    | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────

  const loadDays = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await workoutDayService.list()
    if (err) {
      setError(err)
    } else {
      setWorkoutDays(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDays()
  }, [loadDays])

  // ── Day handlers ───────────────────────────────────────────────────────

  async function handleCreateDay(values: { name: string; muscle_groups: string[] }) {
    setIsSubmitting(true)
    const { error: err } = await workoutDayService.create(values)
    setIsSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setModal({ type: 'none' })
    await loadDays()
  }

  async function handleUpdateDay(values: { name: string; muscle_groups: string[] }) {
    if (modal.type !== 'edit-day') return
    setIsSubmitting(true)
    const { error: err } = await workoutDayService.update(modal.day.id, values)
    setIsSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setModal({ type: 'none' })
    await loadDays()
  }

  async function handleDeleteDay() {
    if (!deleteTarget || deleteTarget.kind !== 'day') return
    setIsDeleting(true)
    const { error: err } = await workoutDayService.delete(deleteTarget.id)
    setIsDeleting(false)
    if (err) {
      setError(err)
    } else {
      setDeleteTarget(null)
      await loadDays()
    }
  }

  // ── Exercise handlers ──────────────────────────────────────────────────

  async function handleCreateExercise(values: {
    name: string
    sets: number
    target_reps?: string
    load?: number
    rest_seconds?: number
    notes?: string
  }) {
    if (modal.type !== 'create-exercise') return
    setIsSubmitting(true)
    const { error: err } = await workoutExerciseService.create({
      workout_day_id: modal.dayId,
      name: values.name,
      sets: values.sets,
      target_reps: values.target_reps,
      load: values.load,
      rest_seconds: values.rest_seconds,
      notes: values.notes,
    })
    setIsSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setModal({ type: 'none' })
    await loadDays()
  }

  async function handleUpdateExercise(values: {
    name: string
    sets: number
    target_reps?: string
    load?: number
    rest_seconds?: number
    notes?: string
  }) {
    if (modal.type !== 'edit-exercise') return
    setIsSubmitting(true)
    const { error: err } = await workoutExerciseService.update(modal.exercise.id, values)
    setIsSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setModal({ type: 'none' })
    await loadDays()
  }

  async function handleDeleteExercise() {
    if (!deleteTarget || deleteTarget.kind !== 'exercise') return
    setIsDeleting(true)
    const { error: err } = await workoutExerciseService.delete(deleteTarget.id)
    setIsDeleting(false)
    if (err) {
      setError(err)
    } else {
      setDeleteTarget(null)
      await loadDays()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-white">
              TREINOS
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Gerencie seus dias e exercícios de treino
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setModal({ type: 'import' })}
            >
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setModal({ type: 'create-day' })}
            >
              Novo Dia
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-danger/70 hover:text-danger transition-colors"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" label="Carregando treinos..." />
          </div>
        ) : workoutDays.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="Nenhum dia de treino"
            description="Crie seu primeiro dia de treino para começar a organizar seus exercícios."
            action={{
              label: 'Criar Dia de Treino',
              onClick: () => setModal({ type: 'create-day' }),
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="space-y-3">
            {workoutDays.map((day) => (
              <WorkoutDayCard
                key={day.id}
                day={day}
                onEdit={(d) => setModal({ type: 'edit-day', day: d })}
                onDelete={(id) =>
                  setDeleteTarget({
                    kind: 'day',
                    id,
                    name: workoutDays.find((d) => d.id === id)?.name ?? 'treino',
                  })
                }
                onAddExercise={(dayId) => setModal({ type: 'create-exercise', dayId })}
                onEditExercise={(exercise) => setModal({ type: 'edit-exercise', exercise })}
                onDeleteExercise={(exerciseId) => {
                  const ex = workoutDays
                    .flatMap((d) => d.exercises)
                    .find((e) => e.id === exerciseId)
                  setDeleteTarget({
                    kind: 'exercise',
                    id: exerciseId,
                    name: ex?.name ?? 'exercício',
                  })
                }}
              />
            ))}
          </div>
        )}

        {/* Floating add button (mobile) */}
        {!loading && workoutDays.length > 0 && (
          <div className="fixed bottom-6 right-6 sm:hidden">
            <button
              onClick={() => setModal({ type: 'create-day' })}
              className="w-14 h-14 rounded-full bg-primary text-background shadow-glow flex items-center justify-center transition-transform active:scale-95"
              aria-label="Novo dia de treino"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Create day */}
      {modal.type === 'create-day' && (
        <WorkoutDayForm
          onSubmit={handleCreateDay}
          onCancel={() => setModal({ type: 'none' })}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Edit day */}
      {modal.type === 'edit-day' && (
        <WorkoutDayForm
          initialData={modal.day as WorkoutDaysRow}
          onSubmit={handleUpdateDay}
          onCancel={() => setModal({ type: 'none' })}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Create exercise */}
      {modal.type === 'create-exercise' && (
        <ExerciseForm
          onSubmit={handleCreateExercise}
          onCancel={() => setModal({ type: 'none' })}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Edit exercise */}
      {modal.type === 'edit-exercise' && (
        <ExerciseForm
          initialData={modal.exercise}
          onSubmit={handleUpdateExercise}
          onCancel={() => setModal({ type: 'none' })}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Import */}
      {modal.type === 'import' && (
        <ImportModal onClose={() => setModal({ type: 'none' })} />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={
            deleteTarget.kind === 'day'
              ? 'Excluir dia de treino?'
              : 'Excluir exercício?'
          }
          message={
            deleteTarget.kind === 'day'
              ? `"${deleteTarget.name}" e todos os seus exercícios serão removidos. Esta ação não pode ser desfeita.`
              : `"${deleteTarget.name}" será removido do treino.`
          }
          onConfirm={
            deleteTarget.kind === 'day' ? handleDeleteDay : handleDeleteExercise
          }
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
