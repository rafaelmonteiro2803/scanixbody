'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  Dumbbell,
  BarChart2,
  Activity,
  Trophy,
  AlertCircle,
} from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { SkeletonStatRow, SkeletonCard } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { workoutSessionService } from '@/services/workout.service'
import {
  groupSessionsByExercise,
  buildProgressionChart,
  calculateSessionVolume,
} from '@/domain/workout-calculations'
import { formatDate } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: boolean
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border bg-background-card p-4 flex flex-col gap-3 ${
        accent ? 'border-primary/30' : 'border-border'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          accent ? 'bg-primary/10' : 'bg-surface-2'
        }`}
      >
        <span className={accent ? 'text-primary' : 'text-text-secondary'}>{icon}</span>
      </div>
      <div>
        <p
          className={`text-2xl font-black font-heading tracking-tight ${
            accent ? 'text-primary' : 'text-text-title'
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; payload: { label?: string } }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  return (
    <div className="rounded-lg border border-border bg-background-card shadow-card-lg px-3 py-2.5 text-xs">
      <p className="text-text-muted mb-1">{formatDate(label ?? '', 'dd/MM/yyyy')}</p>
      <p className="font-bold text-primary">{entry.payload.label ?? `${entry.value} kg`}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProgressoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Raw progress data from service
  const [rawData, setRawData] = useState<
    Array<{
      session_date: string
      exercise_name: string
      exercise_id: string
      sets: Array<{ set_number: number; weight: number; reps: number }>
    }>
  >([])

  // Selected exercise for chart
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  // ── Load data ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await workoutSessionService.getExerciseProgressData()
    if (err) {
      setError(err)
    } else {
      setRawData(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // ── Derived data ─────────────────────────────────────────────────────

  const exerciseHistories = useMemo(() => {
    return groupSessionsByExercise(rawData)
  }, [rawData])

  // Exercise options for selector
  const exerciseOptions = useMemo(
    () =>
      exerciseHistories.map((h) => ({
        value: h.exercise_name,
        label: h.exercise_name,
      })),
    [exerciseHistories],
  )

  // Auto-select first exercise
  useEffect(() => {
    if (!selectedExercise && exerciseOptions.length > 0) {
      setSelectedExercise(exerciseOptions[0].value)
    }
  }, [exerciseOptions, selectedExercise])

  // Chart data for selected exercise
  const chartData = useMemo(() => {
    const history = exerciseHistories.find((h) => h.exercise_name === selectedExercise)
    if (!history) return []
    return buildProgressionChart(history)
  }, [exerciseHistories, selectedExercise])

  // Aggregate stats
  const stats = useMemo(() => {
    // Total unique sessions (by date)
    const allDates = new Set(rawData.map((r) => r.session_date))
    const totalSessions = allDates.size

    // Total series
    const totalSeries = rawData.reduce((sum, r) => sum + r.sets.length, 0)

    // Total volume
    const totalVolume = rawData.reduce(
      (sum, r) =>
        sum +
        calculateSessionVolume([{ sets: r.sets.map((s) => ({ set_number: s.set_number, weight: s.weight, reps: s.reps })) }]),
      0,
    )

    // Unique exercises
    const uniqueExercises = new Set(rawData.map((r) => r.exercise_name)).size

    return { totalSessions, totalSeries, totalVolume, uniqueExercises }
  }, [rawData])

  // Current best for selected exercise
  const selectedBest = useMemo(() => {
    const history = exerciseHistories.find((h) => h.exercise_name === selectedExercise)
    if (!history || history.sessions.length === 0) return null
    return history.sessions.reduce((best, s) =>
      s.best_weight > best.best_weight ? s : best,
    )
  }, [exerciseHistories, selectedExercise])

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text-title">
            PROGRESSO
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Evolução de cargas e volume ao longo do tempo
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonStatRow count={4} />
            <SkeletonCard lines={5} className="h-56" />
            <SkeletonCard lines={5} className="h-56" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Sessões"
                value={stats.totalSessions}
                icon={<Activity className="w-4 h-4" />}
              />
              <StatCard
                label="Total Séries"
                value={stats.totalSeries}
                icon={<Dumbbell className="w-4 h-4" />}
              />
              <StatCard
                label="Volume Total"
                value={
                  stats.totalVolume >= 1000
                    ? `${(stats.totalVolume / 1000).toFixed(1)}t`
                    : `${Math.round(stats.totalVolume)} kg`
                }
                icon={<BarChart2 className="w-4 h-4" />}
                accent
              />
              <StatCard
                label="Exercícios"
                value={stats.uniqueExercises}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>

            {/* Chart section */}
            {rawData.length === 0 ? (
              <div className="rounded-xl border border-border bg-background-card p-16 text-center">
                <Dumbbell className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="font-semibold text-text-title mb-1">Sem dados de progresso ainda</p>
                <p className="text-sm text-text-secondary">
                  Registre suas sessões de treino para visualizar a evolução das cargas.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background-card p-5 space-y-5">
                {/* Chart header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-text-title text-sm">Evolução de Carga</h2>
                  </div>
                  <div className="w-full sm:w-64">
                    <Select
                      placeholder="Selecionar exercício..."
                      value={selectedExercise ?? undefined}
                      onChange={(v) => setSelectedExercise(v)}
                      options={exerciseOptions}
                    />
                  </div>
                </div>

                {/* Best lift badge */}
                {selectedBest && (
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                    <span className="text-text-secondary">Melhor marca:</span>
                    <span className="font-bold text-primary">
                      {selectedBest.best_weight} kg × {selectedBest.best_reps} reps
                    </span>
                    <span className="text-text-muted">
                      em {formatDate(selectedBest.session_date, 'dd/MM/yy')}
                    </span>
                  </div>
                )}

                {/* Chart */}
                {chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-sm text-text-muted">
                    Nenhum dado para este exercício
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1a1a1a"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) => formatDate(v, 'dd/MM')}
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}`}
                          width={36}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#00ff88"
                          strokeWidth={2}
                          fill="url(#progressGradient)"
                          dot={{
                            fill: '#00ff88',
                            strokeWidth: 0,
                            r: 3,
                          }}
                          activeDot={{
                            fill: '#00ff88',
                            stroke: '#00ff88',
                            strokeWidth: 3,
                            r: 5,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Data points count */}
                {chartData.length > 0 && (
                  <p className="text-xs text-text-muted text-right">
                    {chartData.length} sessão{chartData.length !== 1 ? 'ões' : ''} registrada{chartData.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* All exercises list */}
            {exerciseHistories.length > 0 && (
              <div className="rounded-xl border border-border bg-background-card p-5">
                <h2 className="font-bold text-text-title text-sm mb-4 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  Resumo por Exercício
                </h2>
                <div className="space-y-2">
                  {exerciseHistories.map((history) => {
                    const best = history.sessions.reduce(
                      (b, s) => (s.best_weight > b.best_weight ? s : b),
                      history.sessions[0],
                    )
                    return (
                      <div
                        key={history.exercise_name}
                        className="flex items-center justify-between gap-3 rounded-lg bg-background border border-border px-4 py-3 hover:border-border-strong transition-colors cursor-pointer"
                        onClick={() => setSelectedExercise(history.exercise_name)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-title truncate">
                            {history.exercise_name}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {history.sessions.length} sessão{history.sessions.length !== 1 ? 'ões' : ''}
                          </p>
                        </div>
                        {best && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Trophy className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-bold text-primary">
                              {best.best_weight} kg
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
