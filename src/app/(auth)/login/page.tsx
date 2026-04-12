'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Metadata } from 'next'

// ── Schema ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'
  const accountError = searchParams.get('error')

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(
    accountError === 'account_disabled'
      ? 'Sua conta está desativada. Entre em contato com o suporte.'
      : null,
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (signInError) {
      if (
        signInError.message.includes('Invalid login credentials') ||
        signInError.message.includes('invalid_credentials')
      ) {
        setServerError('E-mail ou senha incorretos. Verifique e tente novamente.')
      } else if (signInError.message.includes('Email not confirmed')) {
        setServerError('Por favor, confirme seu e-mail antes de entrar.')
      } else {
        setServerError('Ocorreu um erro ao entrar. Tente novamente.')
      }
      return
    }

    // Fetch profile to check first_access status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setServerError('Não foi possível obter os dados do usuário.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', user.id)
      .single()

    if (profile?.status === 'first_access') {
      router.push('/primeiro-acesso')
      return
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="w-full animate-slide-up">
      {/* Card */}
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2
            className="font-heading text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            Bem-vindo de volta
          </h2>
          <p className="mt-1.5 text-sm text-[#666666]">
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Error banner */}
        {serverError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#ff4444]/30 bg-[#ff4444]/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff4444]" />
            <p className="text-sm text-[#ff4444]">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[#a0a0a0]"
            >
              E-mail
            </label>
            <div
              className={`relative flex h-11 items-center rounded-xl border transition-all duration-150 ${
                errors.email
                  ? 'border-[#ff4444] bg-[#ff4444]/5 focus-within:ring-1 focus-within:ring-[#ff4444]'
                  : 'border-[#2a2a2a] bg-[#0a0a0a] focus-within:border-[#00ff88] focus-within:ring-1 focus-within:ring-[#00ff88]'
              }`}
            >
              <Mail className="ml-3 h-4 w-4 flex-shrink-0 text-[#444444]" aria-hidden />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoCapitalize="off"
                placeholder="seu@email.com"
                {...register('email')}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#444444] focus:outline-none"
              />
            </div>
            {errors.email && (
              <p role="alert" className="text-xs text-[#ff4444]">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#a0a0a0]"
              >
                Senha
              </label>
              <Link
                href="/recuperar-senha"
                className="text-xs text-[#00ff88] transition-colors hover:text-[#00e67a]"
              >
                Esqueci minha senha
              </Link>
            </div>
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
                autoComplete="current-password"
                placeholder="••••••••"
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
                <span>Entrando…</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#1e1e1e]" />
          <span className="text-xs text-[#444444]">SCANIX BODY v1.0</span>
          <div className="h-px flex-1 bg-[#1e1e1e]" />
        </div>
      </div>

      {/* Bottom hint */}
      <p className="mt-4 text-center text-xs text-[#444444]">
        Acesso restrito a usuários cadastrados pela plataforma.
      </p>
    </div>
  )
}
