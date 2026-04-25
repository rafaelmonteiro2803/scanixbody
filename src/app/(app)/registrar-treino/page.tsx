'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Trophy,
  Dumbbell,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { SessionExerciseCard, type SetRow } from './components/SessionExerciseCard'
import {
  workoutDayService,
  workoutSessionService,
  type WorkoutDayWithExercises,
} from '@/services/workout.service'
import { detectPR } from '@/domain/workout-calculations'
import type { WorkoutSet } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2

interface ExerciseSetsMap {
  [exerciseId: string]: SetRow[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialSets(exercise: WorkoutDayWithExercises['exercises'][number]): SetRow[] {
  return Array.from({ length: exercise.sets }, (_, i) => ({
    setNumber: i + 1,
    weight: exercise.load != null ? String(exercise.load) : '',
    reps: '',
    isPR: false,
  }))
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDurationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegistrarTreinoPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDayWithExercises[]>([])
  const [loadingDays, setLoadingDays] = useState(true)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [sessionDate, setSessionDate] = useState(today())
  const [durationMinutes, setDurationMinutes] = useState<string>('')

  // Sets state: exerciseId → SetRow[]
  const [setsMap, setSetsMap] = useState<ExerciseSetsMap>({})

  // Best lifts per exercise (for PR detection)
  const [bestLifts, setBestLifts] = useState<Record<string, WorkoutSet | null>>({})

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // ── Load workout days ────────────────────────────────────────────────

  const loadDays = useCallback(async () => {
    setLoadingDays(true)
    const { data, error } = await workoutDayService.list()
    if (!error) setWorkoutDays(data)
    setLoadingDays(false)
  }, [])

  useEffect(() => {
    void loadDays()
  }, [loadDays])

  // ── Load best lifts when a day is selected ───────────────────────────

  const selectedDay = workoutDays.find((d) => d.id === selectedDayId) ?? null

  useEffect(() => {
    if (!selectedDay) return

    const fetchBests = async () => {
      const results: Record<string, WorkoutSet | null> = {}
      await Promise.all(
        selectedDay.exercises.map(async (ex) => {
          const { data: sets } = await workoutSessionService.getBestSetsForExercise(ex.id)
          if (sets.length === 0) {
            results[ex.id] = null
          } else {
            const best = sets.reduce<typeof sets[0]>((b, c) => {
              const bw = b.weight ?? 0
              const cw = c.weight ?? 0
              if (cw > bw) return c
              if (cw === bw && (c.reps ?? 0) > (b.reps ?? 0)) return c
              return b
            }, sets[0])
            results[ex.id] = {
              set_number: best.set_number,
              weight: best.weight ?? 0,
              reps: best.reps ?? 0,
            }
          }
        }),
      )
      setBestLifts(results)
    }
    void fetchBests()
  }, [selectedDay])

  // ── Initialize sets map when day changes ────────────────────────────

  useEffect(() => {
    if (!selectedDay) return
    const initial: ExerciseSetsMap = {}
    selectedDay.exercises.forEach((ex) => {
      initial[ex.id] = buildInitialSets(ex)
    })
    setSetsMap(initial)
  }, [selectedDay])

  // ── Set change handler with PR detection ───────────────────────────

  function handleSetChange(
    exerciseId: string,
    setNumber: number,
    field: 'weight' | 'reps',
    value: string,
  ) {
    setSetsMap((prev) => {
      const exerciseSets = [...(prev[exerciseId] ?? [])]
      const idx = exerciseSets.findIndex((s) => s.setNumber === setNumber)
      if (idx === -1) return prev

      const updated = { ...exerciseSets[idx], [field]: value }

      const w = parseFloat(updated.weight)
      const r = parseInt(updated.reps, 10)
      if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
        const best = bestLifts[exerciseId]
        updated.isPR = detectPR(
          { set_number: setNumber, weight: w, reps: r },
          best ?? null,
        )
      } else {
        updated.isPR = false
      }

      exerciseSets[idx] = updated
      return { ...prev, [exerciseId]: exerciseSets }
    })
  }

  function handleAddSet(exerciseId: string) {
    setSetsMap((prev) => {
      const current = prev[exerciseId] ?? []
      const nextNum = current.length > 0 ? current[current.length - 1].setNumber + 1 : 1
      const ex = selectedDay?.exercises.find((e) => e.id === exerciseId)
      const newSet: SetRow = {
        setNumber: nextNum,
        weight: ex?.load != null ? String(ex.load) : '',
        reps: '',
        isPR: false,
      }
      return { ...prev, [exerciseId]: [...current, newSet] }
    })
  }

  function handleRemoveSet(exerciseId: string, setNumber: number) {
    setSetsMap((prev) => {
      const filtered = (prev[exerciseId] ?? [])
        .filter((s) => s.setNumber !== setNumber)
        .map((s, i) => ({ ...s, setNumber: i + 1 }))
      return { ...prev, [exerciseId]: filtered }
    })
  }

  // ── Step navigation ──────────────────────────────────────────────────

  function goToStep2() {
    if (!selectedDayId) return
    setStep(2)
  }

  function goToStep1() {
    setStep(1)
  }

  // ── Save session ─────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedDay) return

    // Client-side validation: reject negative or non-numeric weight/reps
    for (const ex of selectedDay.exercises) {
      const sets = setsMap[ex.id] ?? []
      for (const s of sets) {
        if (s.weight === '' && s.reps === '') continue // empty set → filtered out later
        const w = parseFloat(s.weight)
        const r = parseInt(s.reps, 10)
        if (s.weight !== '' && (isNaN(w) || w < 0)) {
          setSaveError(`Peso inválido em "${ex.name}" (série ${s.setNumber}): use um valor ≥ 0.`)
          return
        }
        if (s.reps !== '' && (isNaN(r) || r < 0)) {
          setSaveError(`Reps inválidas em "${ex.name}" (série ${s.setNumber}): use um valor ≥ 0.`)
          return
        }
      }
    }

    setSaving(true)
    setSaveError(null)

    const now = new Date()
    const mins = parseInt(durationMinutes, 10)
    const hasDuration = !isNaN(mins) && mins > 0

    const finishedAt = hasDuration ? now.toISOString() : undefined
    const startedAt = hasDuration
      ? new Date(now.getTime() - mins * 60_000).toISOString()
      : undefined

    const exercises = selectedDay.exercises.map((ex, idx) => ({
      exercise_id: ex.id,
      exercise_name: ex.name,
      order_index: idx,
      sets: (setsMap[ex.id] ?? [])
        .filter((s) => s.weight !== '' || s.reps !== '')
        .map((s) => ({
          set_number: s.setNumber,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps, 10) || 0,
          is_pr: s.isPR,
        })),
    }))

    const { error } = await workoutSessionService.log({
      workout_day_id: selectedDay.id,
      session_date: sessionDate,
      started_at: startedAt,
      finished_at: finishedAt,
      exercises,
    })

    setSaving(false)

    if (error) {
      setSaveError(error)
    } else {
      setSaved(true)
    }
  }

  // ── Total PR count ───────────────────────────────────────────────────

  const totalPRs = Object.values(setsMap)
    .flat()
    .filter((s) => s.isPR).length

  const parsedDuration = parseInt(durationMinutes, 10)
  const hasDuration = !isNaN(parsedDuration) && parsedDuration > 0

  // ── Saved state ──────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_32px_rgba(0,255,136,0.15)]">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black text-text-title mb-2">
            Treino Registrado!
          </h2>
          <p className="text-text-secondary text-sm mb-2">
            Seu treino foi salvo com sucesso.
          </p>
          {totalPRs > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">
                {totalPRs} PR{totalPRs > 1 ? 's' : ''} batido{totalPRs > 1 ? 's' : ''}!
              </span>
            </div>
          )}
          {hasDuration && (
            <p className="text-xs text-text-muted mb-6">
              Duração: {formatDurationLabel(parsedDuration)}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push('/historico')}
            >
              Ver Histórico
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setSaved(false)
                setStep(1)
                setSelectedDayId(null)
                setSetsMap({})
                setSessionDate(today())
                setDurationMinutes('')
              }}
            >
              Novo Treino
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1: Select day + date ────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-text-title">
              REGISTRAR TREINO
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Selecione o treino e preencha os dados da sessão
            </p>
          </div>

          {loadingDays ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : workoutDays.length === 0 ? (
            <div className="rounded-xl border border-border bg-background-card p-8 text-center">
              <Dumbbell className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="font-semibold text-text-title mb-1">Nenhum treino cadastrado</p>
              <p className="text-sm text-text-secondary mb-4">
                Crie seus dias de treino antes de registrar uma sessão.
              </p>
              <Button variant="primary" size="sm" onClick={() => router.push('/treinos')}>
                Ir para Treinos
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background-card p-6 space-y-5">
              {/* Day selector */}
              <Select
                label="Dia de Treino"
                placeholder="Selecione um dia..."
                value={selectedDayId ?? undefined}
                onChange={(v) => setSelectedDayId(v)}
                options={workoutDays.map((d) => ({
                  value: d.id,
                  label: d.name,
                  description: d.muscle_groups.join(', ') || undefined,
                }))}
              />

              {/* Date picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Data da Sessão
                </label>
                <div className="relative flex items-center h-10 rounded-lg border border-border bg-background-secondary hover:border-border-strong transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <Calendar className="w-4 h-4 text-text-muted ml-3 flex-shrink-0" />
                  <input
                    type="date"
                    value={sessionDate}
                    max={today()}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="flex-1 h-full bg-transparent px-3 text-sm text-text-title focus:outline-none"
                  />
                </div>
              </div>

              {/* Duration field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Duração do treino{' '}
                  <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <div className="relative flex items-center h-10 rounded-lg border border-border bg-background-secondary hover:border-border-strong transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <Timer className="w-4 h-4 text-text-muted ml-3 flex-shrink-0" />
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="600"
                    step="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="Ex: 60"
                    className="flex-1 h-full bg-transparent px-3 text-sm text-text-title focus:outline-none placeholder:text-text-faint"
                  />
                  <span className="text-xs text-text-muted pr-3">min</span>
                </div>
                {hasDuration && (
                  <p className="text-xs text-text-muted">
                    {formatDurationLabel(parsedDuration)}
                  </p>
                )}
              </div>

              {/* Selected day preview */}
              {selectedDay && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-semibold text-primary mb-1">
                    {selectedDay.exercises.length} exercício{selectedDay.exercises.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDay.exercises.slice(0, 5).map((ex) => (
                      <span
                        key={ex.id}
                        className="text-xs text-text-secondary bg-surface-2 rounded-md px-2 py-0.5"
                      >
                        {ex.name}
                      </span>
                    ))}
                    {selectedDay.exercises.length > 5 && (
                      <span className="text-xs text-text-muted">
                        +{selectedDay.exercises.length - 5} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!selectedDayId}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={goToStep2}
              >
                Registrar Exercícios
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 2: Log sets ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3">
          <button
            onClick={goToStep1}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-title transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold text-primary">{selectedDay?.name}</p>
            <p className="text-xs text-text-muted">{sessionDate}</p>
          </div>

          {/* Duration badge (static) */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Clock className="w-4 h-4 text-primary" />
            {hasDuration ? formatDurationLabel(parsedDuration) : '—'}
          </div>
        </div>
      </div>

      {/* Exercise cards */}
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* PR counter */}
        {totalPRs > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-primary font-semibold">
              {totalPRs} PR{totalPRs > 1 ? 's' : ''} batido{totalPRs > 1 ? 's' : ''} nesta sessão!
            </span>
          </div>
        )}

        {selectedDay?.exercises.map((exercise) => (
          <SessionExerciseCard
            key={exercise.id}
            exercise={exercise}
            sets={setsMap[exercise.id] ?? buildInitialSets(exercise)}
            bestLift={bestLifts[exercise.id]}
            onSetChange={handleSetChange}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
          />
        ))}

        {/* Error */}
        {saveError && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {saveError}
          </div>
        )}
      </div>

      {/* Bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
            onClick={handleSave}
          >
            Salvar Sessão
          </Button>
        </div>
      </div>
    </div>
  )
}
