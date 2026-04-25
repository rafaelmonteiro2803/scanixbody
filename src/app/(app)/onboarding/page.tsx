'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  User,
  Target,
  Moon,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOAL_OPTIONS = [
  { value: 'Ganho de massa muscular', label: 'Ganho de massa muscular', emoji: '💪' },
  { value: 'Perda de gordura', label: 'Perda de gordura', emoji: '🔥' },
  { value: 'Recomposição corporal', label: 'Recomposição corporal', emoji: '⚖️' },
  { value: 'Performance atlética', label: 'Performance atlética', emoji: '🏋️' },
  { value: 'Manutenção', label: 'Manutenção', emoji: '🎯' },
  { value: 'Saúde geral', label: 'Saúde geral', emoji: '❤️' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentário', description: 'Pouca ou nenhuma atividade' },
  { value: 'light', label: 'Levemente ativo', description: '1–2 treinos por semana' },
  { value: 'moderate', label: 'Moderadamente ativo', description: '3–4 treinos por semana' },
  { value: 'active', label: 'Muito ativo', description: '5–6 treinos por semana' },
  { value: 'very_active', label: 'Extremamente ativo', description: 'Treino diário ou atleta' },
]

const STEPS = [
  { number: 1, label: 'Dados básicos', icon: User },
  { number: 2, label: 'Objetivo', icon: Target },
  { number: 3, label: 'Estilo de vida', icon: Moon },
  { number: 4, label: 'Tudo pronto!', icon: Zap },
]

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-text-secondary block mb-1.5">
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-danger mt-1">{message}</p>
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  min,
  max,
  step,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm text-text-title placeholder:text-text-faint outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
    />
  )
}

// ---------------------------------------------------------------------------
// Step indicators
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step) => (
        <div key={step.number} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step.number < current
                ? 'bg-primary text-background'
                : step.number === current
                ? 'bg-primary/20 border-2 border-primary text-primary'
                : 'bg-surface-2 border border-border text-text-muted'
            }`}
          >
            {step.number < current ? <CheckCircle2 className="w-4 h-4" /> : step.number}
          </div>
          {step.number < STEPS.length && (
            <div
              className={`w-8 h-0.5 rounded transition-all ${
                step.number < current ? 'bg-primary' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)

  // Step 1 — dados básicos
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'M' | 'F' | ''>('')

  // Step 2 — objetivo
  const [goal, setGoal] = useState('')

  // Step 3 — estilo de vida
  const [activityLevel, setActivityLevel] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [waterPerDay, setWaterPerDay] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Skip wizard if already set up ──────────────────────────────────────

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/v1/corpo')
        const json = await res.json() as { data?: { profile?: { weight?: number; sex?: string } | null } }
        const p = json.data?.profile
        if (p?.weight && p?.sex) {
          router.replace('/dashboard')
          return
        }
      } catch {
        // non-fatal, show wizard
      }
      setChecking(false)
    }
    void checkProfile()
  }, [router])

  // ── Save to /api/v1/corpo ───────────────────────────────────────────────

  const savePartial = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/v1/corpo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json() as { error?: string }
      throw new Error(json.error ?? 'Erro ao salvar dados')
    }
  }, [])

  // ── Validation ──────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseInt(age, 10)
    if (!weight || isNaN(w) || w < 20 || w > 500) e.weight = 'Peso deve estar entre 20 e 500 kg'
    if (!height || isNaN(h) || h < 50 || h > 300) e.height = 'Altura deve estar entre 50 e 300 cm'
    if (!age || isNaN(a) || a < 1 || a > 150) e.age = 'Idade deve estar entre 1 e 150 anos'
    if (!sex) e.sex = 'Selecione o sexo biológico'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    if (!goal) {
      setErrors({ goal: 'Selecione um objetivo' })
      return false
    }
    setErrors({})
    return true
  }

  function validateStep3(): boolean {
    const e: Record<string, string> = {}
    if (!activityLevel) e.activityLevel = 'Selecione o nível de atividade'
    const s = parseFloat(sleepHours)
    if (sleepHours && (isNaN(s) || s < 0 || s > 24)) e.sleepHours = 'Horas de sono: 0–24'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Step handlers ───────────────────────────────────────────────────────

  async function handleStep1() {
    if (!validateStep1()) return
    setSaving(true)
    setServerError(null)
    try {
      await savePartial({ weight: parseFloat(weight), height: parseFloat(height), age: parseInt(age, 10), sex })
      setStep(2)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  async function handleStep2() {
    if (!validateStep2()) return
    setSaving(true)
    setServerError(null)
    try {
      await savePartial({ goal })
      setStep(3)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  async function handleStep3() {
    if (!validateStep3()) return
    setSaving(true)
    setServerError(null)
    try {
      const payload: Record<string, unknown> = { activityLevel }
      if (sleepHours) payload.sleepHours = parseFloat(sleepHours)
      if (waterPerDay) payload.waterPerDay = parseFloat(waterPerDay) * 1000 // convert L → ml
      await savePartial(payload)
      setStep(4)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  function handleFinish() {
    router.push('/dashboard')
  }

  // ── Loading state ───────────────────────────────────────────────────────

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl font-black tracking-tight text-text-title">
            BEM-VINDO AO SCANIX
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure seu perfil em 3 passos para desbloquear análises personalizadas
          </p>
        </div>

        <StepIndicator current={step} />

        {/* Error banner */}
        {serverError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {serverError}
          </div>
        )}

        {/* ── STEP 1: Dados básicos ── */}
        {step === 1 && (
          <div className="rounded-2xl border border-border bg-background-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-text-title">Dados básicos</h2>
                <p className="text-xs text-text-muted">Para calcular seu IMC, TDEE e metas</p>
              </div>
            </div>

            {/* Peso + Altura (side by side) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Peso (kg)</FieldLabel>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={setWeight}
                  placeholder="Ex: 85"
                  min={20}
                  max={500}
                  step={0.1}
                />
                <FieldError message={errors.weight} />
              </div>
              <div>
                <FieldLabel>Altura (cm)</FieldLabel>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  value={height}
                  onChange={setHeight}
                  placeholder="Ex: 178"
                  min={50}
                  max={300}
                />
                <FieldError message={errors.height} />
              </div>
            </div>

            {/* Idade */}
            <div>
              <FieldLabel>Idade (anos)</FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                value={age}
                onChange={setAge}
                placeholder="Ex: 28"
                min={1}
                max={150}
              />
              <FieldError message={errors.age} />
            </div>

            {/* Sexo biológico */}
            <div>
              <FieldLabel>Sexo biológico</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                {(['M', 'F'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`h-11 rounded-xl border font-semibold text-sm transition-all ${
                      sex === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    {s === 'M' ? '♂ Masculino' : '♀ Feminino'}
                  </button>
                ))}
              </div>
              <FieldError message={errors.sex} />
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={handleStep1}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* ── STEP 2: Objetivo ── */}
        {step === 2 && (
          <div className="rounded-2xl border border-border bg-background-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-bold text-text-title">Seu objetivo</h2>
                <p className="text-xs text-text-muted">O que você quer alcançar?</p>
              </div>
            </div>

            <div className="space-y-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGoal(opt.value)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all text-left ${
                    goal === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-secondary hover:border-border-strong hover:bg-surface-2/50'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {goal === opt.value && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
            <FieldError message={errors.goal} />

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(1)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                Voltar
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                loading={saving}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={handleStep2}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Estilo de vida ── */}
        {step === 3 && (
          <div className="rounded-2xl border border-border bg-background-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 border border-warning/20">
                <Moon className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="font-bold text-text-title">Estilo de vida</h2>
                <p className="text-xs text-text-muted">Para calibrar seu TDEE e recomendações</p>
              </div>
            </div>

            {/* Nível de atividade */}
            <div>
              <FieldLabel>Nível de atividade</FieldLabel>
              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActivityLevel(opt.value)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all text-left ${
                      activityLevel === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-border-strong hover:bg-surface-2/50'
                    }`}
                  >
                    <div>
                      <span className={`font-medium ${activityLevel === opt.value ? 'text-primary' : 'text-text-secondary'}`}>
                        {opt.label}
                      </span>
                      <p className="text-xs text-text-muted mt-0.5">{opt.description}</p>
                    </div>
                    {activityLevel === opt.value && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <FieldError message={errors.activityLevel} />
            </div>

            {/* Sono + Hidratação (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>
                  Sono diário{' '}
                  <span className="text-text-muted font-normal">(h, opcional)</span>
                </FieldLabel>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={sleepHours}
                  onChange={setSleepHours}
                  placeholder="Ex: 7.5"
                  min={0}
                  max={24}
                  step={0.5}
                />
                <FieldError message={errors.sleepHours} />
              </div>
              <div>
                <FieldLabel>
                  Água/dia{' '}
                  <span className="text-text-muted font-normal">(L, opcional)</span>
                </FieldLabel>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={waterPerDay}
                  onChange={setWaterPerDay}
                  placeholder="Ex: 2.5"
                  min={0}
                  max={20}
                  step={0.5}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(2)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                Voltar
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                loading={saving}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={handleStep3}
              >
                Finalizar
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Conclusão ── */}
        {step === 4 && (
          <div className="rounded-2xl border border-primary/30 bg-background-card p-8 text-center shadow-[0_0_40px_rgba(0,255,136,0.08)]">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <h2 className="font-heading text-2xl font-black text-text-title mb-2">
              Perfil configurado!
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
              Seus dados foram salvos. O SCANIX BODY já pode calcular sua análise personalizada de performance.
            </p>

            <div className="flex flex-col gap-2 mb-6 text-sm text-text-secondary">
              {weight && <div className="flex justify-between px-4 py-2 rounded-lg bg-surface-2 border border-border">
                <span className="text-text-muted">Peso</span>
                <span className="font-semibold text-text-title">{weight} kg</span>
              </div>}
              {goal && <div className="flex justify-between px-4 py-2 rounded-lg bg-surface-2 border border-border">
                <span className="text-text-muted">Objetivo</span>
                <span className="font-semibold text-text-title">{goal}</span>
              </div>}
              {activityLevel && <div className="flex justify-between px-4 py-2 rounded-lg bg-surface-2 border border-border">
                <span className="text-text-muted">Atividade</span>
                <span className="font-semibold text-text-title">
                  {ACTIVITY_OPTIONS.find((o) => o.value === activityLevel)?.label}
                </span>
              </div>}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<Zap className="w-4 h-4" />}
              onClick={handleFinish}
            >
              Acessar o dashboard
            </Button>
          </div>
        )}

        {/* Skip link (not on step 4) */}
        {step < 4 && (
          <p className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2"
            >
              Pular por agora e configurar depois
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
