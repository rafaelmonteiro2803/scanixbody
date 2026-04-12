'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Password requirements ─────────────────────────────────────────────────────

const passwordRequirements = [
  { id: 'length', label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
  { id: 'upper', label: 'Letra maiúscula (A-Z)', regex: /[A-Z]/ },
  { id: 'number', label: 'Número (0-9)', regex: /[0-9]/ },
  {
    id: 'special',
    label: 'Caractere especial (!@#$%)',
    regex: /[^a-zA-Z0-9]/,
  },
]

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter letra maiúscula')
      .regex(/[0-9]/, 'Deve conter número')
      .regex(/[^a-zA-Z0-9]/, 'Deve conter caractere especial'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// ── Component ─────────────────────────────────────────────────────────────────

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const passwordValue = watch('password', '')

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    // Update password via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setServerError(
        'Não foi possível atualizar a senha. Tente novamente ou entre em contato com o suporte.',
      )
      return
    }

    // Update profile status from first_access → active
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('user_id', user.id)
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1800)
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="w-full animate-scale-in">
        <div className="rounded-2xl border border-[#00ff88]/30 bg-[#111111] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#00ff88]/30 bg-[#00ff88]/10">
            <CheckCircle2 className="h-8 w-8 text-[#00ff88]" />
          </div>
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          >
            Senha definida!
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            Redirecionando para o dashboard…
          </p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#00ff88]" />
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full animate-slide-up">
      {/* Card */}
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start gap-1">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10">
            <ShieldCheck className="h-5 w-5 text-[#00ff88]" />
          </div>
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            Primeiro Acesso
          </h2>
          <p className="text-sm text-[#666666]">
            Defina uma senha segura para proteger sua conta. Você precisará
            usá-la nos próximos acessos.
          </p>
        </div>

        {/* Error banner */}
        {serverError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#ff4444]/30 bg-[#ff4444]/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff4444]" />
            <p className="text-sm text-[#ff4444]">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[#a0a0a0]"
            >
              Nova senha
            </label>
            <div
              className={`relative flex h-11 items-center rounded-xl border transition-all duration-150 ${
                errors.password
                  ? 'border-[#ff4444] bg-[#ff4444]/5 focus-within:ring-1 focus-within:ring-[#ff4444]'
                  : 'border-[#2a2a2a] bg-[#0a0a0a] focus-within:border-[#00ff88] focus-within:ring-1 focus-within:ring-[#00ff88]'
              }`}
            >
              <Lock className="ml-3 h-4 w-4 flex-shrink-0 text-[#444444]" aria-hidden />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nova senha"
                {...register('password')}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#444444] focus:outline-none"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="mr-3 text-[#444444] transition-colors hover:text-[#a0a0a0]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="text-xs text-[#ff4444]">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Password requirements */}
          <div className="rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
              Requisitos da senha
            </p>
            <ul className="space-y-2">
              {passwordRequirements.map((req) => {
                const met = req.regex.test(passwordValue)
                return (
                  <li key={req.id} className="flex items-center gap-2.5">
                    <div
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        met
                          ? 'bg-[#00ff88]/20 text-[#00ff88]'
                          : 'bg-[#1e1e1e] text-[#444444]'
                      }`}
                    >
                      {met ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#444444]" />
                      )}
                    </div>
                    <span
                      className={`text-xs transition-colors duration-200 ${
                        met ? 'text-[#a0a0a0]' : 'text-[#555555]'
                      }`}
                    >
                      {req.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-[#a0a0a0]"
            >
              Confirmar senha
            </label>
            <div
              className={`relative flex h-11 items-center rounded-xl border transition-all duration-150 ${
                errors.confirmPassword
                  ? 'border-[#ff4444] bg-[#ff4444]/5 focus-within:ring-1 focus-within:ring-[#ff4444]'
                  : 'border-[#2a2a2a] bg-[#0a0a0a] focus-within:border-[#00ff88] focus-within:ring-1 focus-within:ring-[#00ff88]'
              }`}
            >
              <Lock className="ml-3 h-4 w-4 flex-shrink-0 text-[#444444]" aria-hidden />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a senha"
                {...register('confirmPassword')}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#444444] focus:outline-none"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                className="mr-3 text-[#444444] transition-colors hover:text-[#a0a0a0]"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p role="alert" className="text-xs text-[#ff4444]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] ${
              isSubmitting
                ? 'cursor-wait bg-[#00ff88]/60 text-[#0a0a0a]/70'
                : 'bg-[#00ff88] text-[#0a0a0a] shadow-[0_0_16px_rgba(0,255,136,0.3)] hover:bg-[#00e67a] hover:shadow-[0_0_24px_rgba(0,255,136,0.45)] disabled:opacity-50'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Salvando…</span>
              </>
            ) : (
              'Definir Senha'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
