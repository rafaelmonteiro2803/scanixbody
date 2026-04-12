'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve ter ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve ter ao menos um número')
      .regex(/[^a-zA-Z0-9]/, 'Deve ter ao menos um caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// ── Inner component (needs useSearchParams → must be inside Suspense) ─────────

function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Exchange the token_hash from the email link for a session
  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!tokenHash) {
      setSessionError('Link inválido ou expirado. Solicite um novo link de recuperação.')
      return
    }

    const supabase = createClient()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: (type as 'recovery') ?? 'recovery' })
      .then(({ error }) => {
        if (error) {
          setSessionError('Link expirado ou já utilizado. Solicite um novo link de recuperação.')
        } else {
          setSessionReady(true)
        }
      })
  }, [searchParams])

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setError('password', { message: error.message })
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  // ── States ────────────────────────────────────────────────────────────────────

  if (sessionError) {
    return (
      <div className="w-full animate-slide-up">
        <div className="rounded-2xl border border-[#ff4444]/20 bg-[#111111] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#ff4444]/30 bg-[#ff4444]/10">
            <AlertCircle className="h-8 w-8 text-[#ff4444]" />
          </div>
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            Link inválido
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#666666]">{sessionError}</p>
          <button
            onClick={() => router.push('/recuperar-senha')}
            className="mt-6 text-sm font-medium text-[#00ff88] hover:text-[#00e67a] transition-colors"
          >
            Solicitar novo link →
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full animate-scale-in">
        <div className="rounded-2xl border border-[#00ff88]/20 bg-[#111111] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#00ff88]/30 bg-[#00ff88]/10">
            <CheckCircle2 className="h-8 w-8 text-[#00ff88]" />
          </div>
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            Senha redefinida!
          </h2>
          <p className="mt-3 text-sm text-[#666666]">
            Sua senha foi atualizada. Redirecionando para o login…
          </p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    )
  }

  return (
    <div className="w-full animate-slide-up">
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="mb-7 flex flex-col items-start gap-1">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10">
            <Lock className="h-5 w-5 text-[#00ff88]" />
          </div>
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            Criar nova senha
          </h2>
          <p className="text-sm text-[#666666]">
            Escolha uma senha forte para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Nova senha */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#a0a0a0]">
              Nova senha
            </label>
            <div
              className={`relative flex h-11 items-center rounded-xl border transition-all duration-150 ${
                errors.password
                  ? 'border-[#ff4444] bg-[#ff4444]/5'
                  : 'border-[#2a2a2a] bg-[#0a0a0a] focus-within:border-[#00ff88] focus-within:ring-1 focus-within:ring-[#00ff88]'
              }`}
            >
              <Lock className="ml-3 h-4 w-4 flex-shrink-0 text-[#444444]" aria-hidden />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#444444] focus:outline-none"
              />
            </div>
            {errors.password && (
              <p role="alert" className="text-xs text-[#ff4444]">{errors.password.message}</p>
            )}
          </div>

          {/* Confirmar senha */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[#a0a0a0]">
              Confirmar nova senha
            </label>
            <div
              className={`relative flex h-11 items-center rounded-xl border transition-all duration-150 ${
                errors.confirmPassword
                  ? 'border-[#ff4444] bg-[#ff4444]/5'
                  : 'border-[#2a2a2a] bg-[#0a0a0a] focus-within:border-[#00ff88] focus-within:ring-1 focus-within:ring-[#00ff88]'
              }`}
            >
              <Lock className="ml-3 h-4 w-4 flex-shrink-0 text-[#444444]" aria-hidden />
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#444444] focus:outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <p role="alert" className="text-xs text-[#ff4444]">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Requisitos */}
          <p className="text-xs text-[#444444]">
            Mínimo 8 caracteres · Uma maiúscula · Um número · Um caractere especial
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] ${
              isSubmitting
                ? 'cursor-wait bg-[#00ff88]/60 text-[#0a0a0a]/70'
                : 'bg-[#00ff88] text-[#0a0a0a] shadow-[0_0_16px_rgba(0,255,136,0.3)] hover:bg-[#00e67a]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Salvando…</span>
              </>
            ) : (
              'Salvar nova senha'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    }>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
