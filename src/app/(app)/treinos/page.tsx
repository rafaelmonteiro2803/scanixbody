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
import { importWorkout, type WorkoutImportData } from '@/services/import.service'
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

const IMPORT_ACCEPTED_EXTENSIONS = ['json', 'pdf', 'xlsx', 'docx']

function ImportModal({
  onClose,
  onImportComplete,
}: {
  onClose: () => void
  onImportComplete: () => Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedData, setImportedData] = useState<WorkoutImportData | null>(null)
  const [jsonPreview, setJsonPreview] = useState('')

  function normalizeWorkoutImport(data: unknown): WorkoutImportData {
    if (!data || typeof data !== 'object') {
      throw new Error('Estrutura JSON inválida para treinos.')
    }

    const candidate = data as { days?: unknown[] }
    if (!Array.isArray(candidate.days) || candidate.days.length === 0) {
      throw new Error('Nenhum dia de treino foi encontrado no arquivo.')
    }

    return {
      days: candidate.days.map((day, dayIndex) => {
        if (!day || typeof day !== 'object') {
          throw new Error(`Dia ${dayIndex + 1} inválido.`)
        }
        const d = day as {
          name?: unknown
          muscleGroups?: unknown
          muscle_groups?: unknown
          exercises?: unknown
        }
        const name = typeof d.name === 'string' && d.name.trim() ? d.name.trim() : `Dia ${dayIndex + 1}`
        const groupsRaw = Array.isArray(d.muscleGroups) ? d.muscleGroups : Array.isArray(d.muscle_groups) ? d.muscle_groups : []
        const muscleGroups = groupsRaw.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)

        if (!Array.isArray(d.exercises) || d.exercises.length === 0) {
          throw new Error(`O dia "${name}" não possui exercícios.`)
        }

        return {
          name,
          muscleGroups,
          exercises: d.exercises.map((exercise, exerciseIndex) => {
            if (!exercise || typeof exercise !== 'object') {
              throw new Error(`Exercício ${exerciseIndex + 1} inválido no dia "${name}".`)
            }
            const ex = exercise as {
              name?: unknown
              sets?: unknown
              targetReps?: unknown
              target_reps?: unknown
              load?: unknown
              restSeconds?: unknown
              rest_seconds?: unknown
              notes?: unknown
            }
            const exerciseName = typeof ex.name === 'string' && ex.name.trim() ? ex.name.trim() : `Exercício ${exerciseIndex + 1}`
            const setsNumber = Number(ex.sets)
            return {
              name: exerciseName,
              sets: Number.isFinite(setsNumber) && setsNumber > 0 ? Math.floor(setsNumber) : 3,
              targetReps: typeof ex.targetReps === 'string' || typeof ex.targetReps === 'number'
                ? ex.targetReps
                : typeof ex.target_reps === 'string' || typeof ex.target_reps === 'number'
                  ? ex.target_reps
                  : '',
              load: typeof ex.load === 'number' && Number.isFinite(ex.load) ? ex.load : undefined,
              restSeconds: typeof ex.restSeconds === 'number' && Number.isFinite(ex.restSeconds)
                ? ex.restSeconds
                : typeof ex.rest_seconds === 'number' && Number.isFinite(ex.rest_seconds)
                  ? ex.rest_seconds
                  : undefined,
              notes: typeof ex.notes === 'string' ? ex.notes : undefined,
            }
          }),
        }
      }),
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    const extension = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!IMPORT_ACCEPTED_EXTENSIONS.includes(extension)) {
      setError('Apenas arquivos JSON, PDF, XLSX e DOCX são suportados.')
      return
    }

    setError(null)
    setImportedData(null)
    setJsonPreview('')
    setFile(f)
  }

  async function handleProcessFile() {
    if (!file) return
    setIsProcessing(true)
    setError(null)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
      let normalized: WorkoutImportData

      if (extension === 'json') {
        const rawText = await file.text()
        const parsed = JSON.parse(rawText) as unknown
        normalized = normalizeWorkoutImport(parsed)
      } else {
        const result = await importWorkout(file)
        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Não foi possível processar o arquivo.')
        }
        normalized = normalizeWorkoutImport(result.data)
      }

      setImportedData(normalized)
      setJsonPreview(JSON.stringify(normalized, null, 2))
    } catch (err) {
      setImportedData(null)
      setJsonPreview('')
      setError(err instanceof Error ? err.message : 'Erro ao processar importação.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleLoadImportedWorkouts() {
    if (!importedData) return
    setIsImporting(true)
    setError(null)

    try {
      for (const day of importedData.days) {
        const createDayRes = await workoutDayService.create({
          name: day.name,
          muscle_groups: day.muscleGroups,
        })
        if (createDayRes.error || !createDayRes.data) {
          throw new Error(createDayRes.error ?? `Erro ao criar dia "${day.name}".`)
        }

        for (const exercise of day.exercises) {
          const exerciseRes = await workoutExerciseService.create({
            workout_day_id: createDayRes.data.id,
            name: exercise.name,
            sets: exercise.sets,
            target_reps: exercise.targetReps ? String(exercise.targetReps) : undefined,
            load: exercise.load,
            rest_seconds: exercise.restSeconds,
            notes: exercise.notes,
          })
          if (exerciseRes.error) {
            throw new Error(exerciseRes.error)
          }
        }
      }

      await onImportComplete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer carga dos treinos.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-background-card shadow-card-xl animate-modal-content">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Importar Treino</h2>
              <p className="text-xs text-text-secondary">Carregue um arquivo JSON, PDF, XLSX ou DOCX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-title"
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
                  <p className="text-xs text-text-muted mt-1">Arquivos .json, .pdf, .xlsx e .docx</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".json,.pdf,.xlsx,.docx,application/json,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={!file || isProcessing || isImporting}
            loading={isProcessing}
            onClick={handleProcessFile}
          >
            Processar arquivo
          </Button>

          {jsonPreview && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">
                JSON estruturado para carga
              </p>
              <textarea
                className="h-48 w-full rounded-xl border border-border bg-[#101010] p-3 font-mono text-xs text-text-secondary"
                value={jsonPreview}
                onChange={(e) => setJsonPreview(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={isProcessing || isImporting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              disabled={!importedData || isProcessing || isImporting}
              loading={isImporting}
              onClick={handleLoadImportedWorkouts}
            >
              Fazer carga dos treinos
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
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-background-card shadow-card-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3 className="font-bold text-text-title">{title}</h3>
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
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-text-title">
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
        <ImportModal
          onClose={() => setModal({ type: 'none' })}
          onImportComplete={loadDays}
        />
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
