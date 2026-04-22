'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!tokenHash) {
      setSessionError('Invalid or expired link. Please request a new reset link.');
      return;
    }

    const supabase = createClient();
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: (type as 'recovery') ?? 'recovery' })
      .then(({ error }) => {
        if (error) {
          setSessionError('Link expired or already used. Please request a new reset link.');
        } else {
          setSessionReady(true);
        }
      });
  }, [searchParams]);

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      setError('password', { message: error.message });
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 3000);
  }

  if (sessionError) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-text-primary">Invalid Link</h1>
        <p className="text-sm text-text-muted">{sessionError}</p>
        <a href="/recuperar-senha" className="text-primary text-sm hover:underline block">
          Request a new reset link
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-text-primary">Password Updated</h1>
        <p className="text-sm text-text-muted">
          Your password has been changed successfully. Redirecting to login…
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-text-muted">Validating link…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-text-primary">Create New Password</h1>
        <p className="text-text-muted text-sm mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
          <li>Minimum 8 characters</li>
          <li>At least one uppercase letter</li>
          <li>At least one number</li>
          <li>At least one special character</li>
        </ul>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Saving…' : 'Save New Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-text-muted">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
