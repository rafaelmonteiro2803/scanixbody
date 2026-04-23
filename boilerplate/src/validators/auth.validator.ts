/**
 * MY APP – Auth Validators
 *
 * Zod schemas for authentication-related API payloads.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// Strong password (shared rule)
// ---------------------------------------------------------------------------

const strongPasswordSchema = z
  .string({ required_error: 'New password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
    'Password must contain at least one uppercase letter, one number, and one special character',
  )

// ---------------------------------------------------------------------------
// Change password (authenticated user)
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required' })
      .min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ---------------------------------------------------------------------------
// Reset password (unauthenticated – forgot password flow)
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ---------------------------------------------------------------------------
// Set new password (after receiving reset token)
// ---------------------------------------------------------------------------

export const setNewPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required' })
      .min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>
