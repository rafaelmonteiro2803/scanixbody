'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
})

type FormData = z.infer<typeof schema>

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecuperarSenhaPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/redefinir-senha`
        : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/redefinir-senha`

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo,
    })

    if (error) {
      // For security: don't reveal whether the email exists or not
      // Unless it's a rate-limit or server error
      if (error.message.toLowerCase().includes('rate limit')) {
        setServerError(
          'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
        )
        return
      }
    }

    // Always show success (even if email doesn't exist, to avoid enumeration)
    setSubmittedEmail(data.email)
    setSubmitted(true)
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="w-full animate-scale-in">
        <div className="rounded-2xl border border-[#00ff88]/20 bg-[#111111] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#00ff88]/30 bg-[#00ff88]/10">
            <CheckCircle2 className="h-8 w-8 text-[#00ff88]" />
          </div>

          {/* Heading */}
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            E-mail enviado!
          </h2>

          {/* Body */}
          <p className="mt-3 text-sm leading-relaxed text-[#666666]">
            Se uma conta existir para{' '}
            <span className="font-medium text-[#a0a0a0]">{submittedEmail}</span>,
            você receberá um link de recuperação em breve.
          </p>

          <p className="mt-2 text-xs text-[#444444]">
            Verifique também a caixa de spam ou lixo eletrônico.
          </p>

          {/* Divider */}
          <div className="my-6 h-px bg-[#1e1e1e]" />

          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#00ff88] transition-colors hover:text-[#00e67a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  // ── Form state ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full animate-slide-up">
      {/* Card */}
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

        {/* Header */}
        <div className="mb-7 flex flex-col items-start gap-1">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10">
            <Mail className="h-5 w-5 text-[#00ff88]" />
          </div>
          <h2
            className="font-heading text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.02em' }}
          >
            Recuperar senha
          </h2>
          <p className="text-sm leading-relaxed text-[#666666]">
            Informe o e-mail cadastrado e enviaremos um link para você criar uma
            nova senha.
          </p>
        </div>

        {/* Error banner */}
        {serverError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#ff4444]/30 bg-[#ff4444]/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff4444]" />
            <p className="text-sm text-[#ff4444]">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[#a0a0a0]"
            >
              E-mail cadastrado
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] ${
              isSubmitting
                ? 'cursor-wait bg-[#00ff88]/60 text-[#0a0a0a]/70'
                : 'bg-[#00ff88] text-[#0a0a0a] shadow-[0_0_16px_rgba(0,255,136,0.3)] hover:bg-[#00e67a] hover:shadow-[0_0_24px_rgba(0,255,136,0.45)]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Enviando…</span>
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#1e1e1e]" />
          <span className="text-xs text-[#444444]">ou</span>
          <div className="h-px flex-1 bg-[#1e1e1e]" />
        </div>

        {/* Back to login */}
        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#666666] transition-colors hover:text-[#a0a0a0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
