'use client';

/**
 * MY APP – First Access / Onboarding Page
 *
 * Forces new users to set a strong password on their first login.
 * Middleware redirects users with status = 'first_access' here.
 *
 * TODO: Extend with profile fields you need to collect on first access
 *       (e.g. full name, phone number, preferences).
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/validators/auth.validator';
import { useRouter } from 'next/navigation';

export default function FirstAccessPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setServerError(null);

    try {
      const res = await fetch('/api/v1/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: data.newPassword }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error?.message ?? 'Failed to update password.');
        return;
      }

      router.replace('/dashboard');
    } catch {
      setServerError('An unexpected error occurred.');
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-text-primary">Welcome!</h1>
        <p className="text-text-muted text-sm mt-1">
          Please set a new password to activate your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-1">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            {...register('newPassword')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.newPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? 'Saving…' : 'Set Password & Continue'}
        </button>
      </form>
    </div>
  );
}
