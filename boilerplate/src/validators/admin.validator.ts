/**
 * MY APP – Admin Validators
 *
 * Zod schemas for admin-only API payloads (user management).
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Create user
// ---------------------------------------------------------------------------

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  // TODO: adjust enum values to match your user_role SQL enum
  role: z
    .enum(['super_admin', 'admin', 'manager', 'operator', 'user'])
    .default('user'),
  status: z
    .enum(['active', 'inactive', 'blocked', 'first_access'])
    .default('first_access'),
  password: z.string().min(8).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ---------------------------------------------------------------------------
// Update user profile
// ---------------------------------------------------------------------------

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(2).nullable().optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'operator', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'first_access']).optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

// ---------------------------------------------------------------------------
// List users query params
// ---------------------------------------------------------------------------

export const listUsersQuerySchema = z.object({
  role: z.enum(['super_admin', 'admin', 'manager', 'operator', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'first_access']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
})

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>
