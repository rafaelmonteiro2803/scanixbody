/**
 * SCANIX BODY – Auth Validators
 *
 * Zod schemas for authentication-related API payloads.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .email('E-mail inválido'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// Change password (authenticated user)
// ---------------------------------------------------------------------------

const strongPasswordSchema = z
  .string({ required_error: 'Nova senha é obrigatória' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
    'A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial',
  )

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Confirmação de senha é obrigatória' })
      .min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ---------------------------------------------------------------------------
// Reset password (unauthenticated – forgot password flow)
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .email('E-mail inválido'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ---------------------------------------------------------------------------
// Set new password (after receiving reset token)
// ---------------------------------------------------------------------------

export const setNewPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Confirmação de senha é obrigatória' })
      .min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>
