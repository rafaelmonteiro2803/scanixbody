'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Required'),
    new_password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        setProfileError(json.error?.message ?? 'Failed to update profile.');
        return;
      }
      setProfileSuccess(true);
    } catch {
      setProfileError('An unexpected error occurred.');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch {
      setPasswordError('An unexpected error occurred.');
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Manage your account preferences.</p>
      </div>

      {/* Profile section */}
      <section className="rounded-xl border border-border bg-background-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Profile</h2>

        {profileSuccess && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}
        {profileError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </div>
        )}

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-text-primary mb-1">
              Full Name
            </label>
            <input
              id="full_name"
              {...profileForm.register('full_name')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your Name"
            />
            {profileForm.formState.errors.full_name && (
              <p className="text-xs text-red-600 mt-1">
                {profileForm.formState.errors.full_name.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {profileForm.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Password section */}
      <section className="rounded-xl border border-border bg-background-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Change Password</h2>

        {passwordSuccess && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            Password changed successfully.
          </div>
        )}
        {passwordError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {passwordError}
          </div>
        )}

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-text-primary mb-1">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register('new_password')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {passwordForm.formState.errors.new_password && (
              <p className="text-xs text-red-600 mt-1">
                {passwordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-text-primary mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register('confirm_password')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="text-xs text-red-600 mt-1">
                {passwordForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {passwordForm.formState.isSubmitting ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
