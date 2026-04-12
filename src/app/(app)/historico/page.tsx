'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Trash2,
  AlertCircle,
  Trophy,
  X,
  BarChart2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { workoutSessionService, type SessionWithDetails } from '@/services/workout.service'
import { calculateSessionVolume } from '@/domain/workout-calculations'
import { formatDate } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(started: string | null, finished: string | null): string | null {
  if (!started || !finished) return null
  const ms = new Date(finished).getTime() - new Date(started).getTime()
  if (ms <= 0) return null
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function sessionVolume(session: SessionWithDetails): number {
  return calculateSessionVolume(
    session.exercises.map((ex) => ({
      sets: ex.sets.map((s) => ({
        set_number: s.set_number,
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
      })),
    })),
  )
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-[#161616] shadow-card-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3 className="font-bold text-white">Excluir sessão?</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Esta sessão será permanentemente removida do histórico.
            </p>
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
// Session card
// ---------------------------------------------------------------------------

function SessionCard({
  session,
  onDelete,
}: {
  session: SessionWithDetails
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const volume = sessionVolume(session)
  const duration = formatDuration(session.started_at, session.finished_at)
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const hasPR = session.exercises.some((ex) => ex.sets.some((s) => s.is_pr))

  return (
    <div className="rounded-xl border border-border bg-[#161616] overflow-hidden hover:border-border-strong transition-colors">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white truncate">
                {session.workout_day_name}
              </h3>
              {hasPR && (
                <Badge variant="success" size="sm" icon={<Trophy className="w-3 h-3" />}>
                  PR
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <Calendar className="w-3 h-3" />
                {formatDate(session.session_date, 'dd/MM/yyyy')}
              </span>
              {duration && (
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <Clock className="w-3 h-3" />
                  {duration}
                </span>
              )}
              {volume > 0 && (
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <BarChart2 className="w-3 h-3" />
                  {Math.round(volume).toLocaleString('pt-BR')} kg
                </span>
              )}
              <span className="text-xs text-text-muted">
                {session.exercises.length} exercício{session.exercises.length !== 1 ? 's' : ''}
                {totalSets > 0 ? ` · ${totalSets} série${totalSets !== 1 ? 's' : ''}` : ''}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onDelete(session.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              aria-label="Excluir sessão"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
              aria-label={expanded ? 'Recolher' : 'Expandir'}
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

      {/* Expanded exercises */}
      {expanded && (
        <div className="border-t border-border px-5 pb-4">
          <div className="space-y-3 mt-3">
            {session.exercises.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Sem exercícios registrados
              </p>
            ) : (
              session.exercises.map((exercise) => {
                const exHasPR = exercise.sets.some((s) => s.is_pr)
                const exVolume = exercise.sets.reduce(
                  (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
                  0,
                )
                return (
                  <div key={exercise.id} className="rounded-lg border border-border bg-[#0a0a0a] overflow-hidden">
                    {/* Exercise name row */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                      <Dumbbell className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="text-sm font-semibold text-white flex-1 truncate">
                        {exercise.exercise_name}
                      </span>
                      {exHasPR && (
                        <Trophy className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                      {exVolume > 0 && (
                        <span className="text-xs text-text-muted flex-shrink-0">
                          {Math.round(exVolume)} kg vol.
                        </span>
                      )}
                    </div>

                    {/* Sets */}
                    <div className="px-4 py-2 space-y-1">
                      {exercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className={`flex items-center gap-3 text-xs rounded-md px-2 py-1.5 ${
                            set.is_pr
                              ? 'bg-primary/5 text-primary'
                              : 'text-text-secondary'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full text-center flex items-center justify-center font-semibold ${
                              set.is_pr ? 'bg-primary/20 text-primary' : 'bg-surface-2 text-text-muted'
                            }`}
                          >
                            {set.set_number}
                          </span>
                          <span className="font-medium">
                            {set.weight != null ? `${set.weight} kg` : '–'}
                          </span>
                          <span className="text-text-muted">×</span>
                          <span>{set.reps != null ? `${set.reps} reps` : '–'}</span>
                          {set.is_pr && (
                            <Badge variant="success" size="sm">PR</Badge>
                          )}
                        </div>
                      ))}
                      {exercise.sets.length === 0 && (
                        <p className="text-xs text-text-muted py-1">Sem séries registradas</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="mt-3 rounded-lg bg-surface-2 border border-border px-3 py-2.5 text-xs text-text-secondary">
              <span className="font-medium text-text-primary mr-1">Notas:</span>
              {session.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HistoricoPage() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await workoutSessionService.list()
    if (err) {
      setError(err)
    } else {
      setSessions(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    const { error: err } = await workoutSessionService.delete(deleteId)
    setIsDeleting(false)
    if (err) {
      setError(err)
    } else {
      setDeleteId(null)
      setSessions((prev) => prev.filter((s) => s.id !== deleteId))
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-white">
            HISTÓRICO
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Todas as suas sessões de treino registradas
          </p>
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
          <div className="flex justify-center py-24">
            <Spinner size="lg" label="Carregando histórico..." />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="Nenhuma sessão registrada"
            description="Quando você registrar treinos, eles aparecerão aqui com todos os detalhes."
            action={{
              label: 'Registrar Treino',
              href: '/registrar-treino',
              icon: <Dumbbell className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <ConfirmDeleteModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
