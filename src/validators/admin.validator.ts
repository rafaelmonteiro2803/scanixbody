/**
 * SCANIX BODY – Admin Validators
 *
 * Zod schemas for admin user-management API payloads.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Allowed enum values (mirrors database enums)
// ---------------------------------------------------------------------------

const userRoleValues = [
  'super_admin',
  'admin',
  'coach',
  'operator',
  'usuario_final',
] as const

const userStatusValues = [
  'active',
  'inactive',
  'blocked',
  'first_access',
] as const

// ---------------------------------------------------------------------------
// Create User (admin)
// ---------------------------------------------------------------------------

export const createUserSchema = z.object({
  fullName: z
    .string({ required_error: 'Nome completo é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),

  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .email('E-mail inválido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),

  role: z
    .enum(userRoleValues, {
      errorMap: () => ({ message: 'Papel de usuário inválido' }),
    })
    .optional()
    .default('usuario_final'),

  status: z
    .enum(userStatusValues, {
      errorMap: () => ({ message: 'Status inválido' }),
    })
    .optional()
    .default('first_access'),

  /**
   * When omitted a secure random password is auto-generated.
   */
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
      'A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial',
    )
    .optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ---------------------------------------------------------------------------
// Update User (admin – partial)
// ---------------------------------------------------------------------------

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres')
    .optional()
    .nullable(),

  role: z
    .enum(userRoleValues, {
      errorMap: () => ({ message: 'Papel de usuário inválido' }),
    })
    .optional(),

  status: z
    .enum(userStatusValues, {
      errorMap: () => ({ message: 'Status inválido' }),
    })
    .optional(),

  avatarUrl: z
    .string()
    .url('URL do avatar inválida')
    .max(500)
    .optional()
    .nullable(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ---------------------------------------------------------------------------
// Admin-initiated password reset
// ---------------------------------------------------------------------------

export const adminResetPasswordSchema = z.object({
  userId: z
    .string({ required_error: 'userId é obrigatório' })
    .uuid('userId deve ser um UUID válido'),
})

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>

// ---------------------------------------------------------------------------
// List users query params
// ---------------------------------------------------------------------------

export const listUsersQuerySchema = z.object({
  role: z.enum(userRoleValues).optional(),
  status: z.enum(userStatusValues).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>

// ---------------------------------------------------------------------------
// Admin user action (PATCH)
// ---------------------------------------------------------------------------

const userActionValues = ['reset-password', 'block', 'unblock'] as const

export const userActionSchema = z.object({
  action: z.enum(userActionValues, {
    errorMap: () => ({ message: 'Ação inválida. Use: reset-password, block ou unblock' }),
  }),
})

export type UserActionInput = z.infer<typeof userActionSchema>
