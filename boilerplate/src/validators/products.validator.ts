/**
 * MY APP – Example Domain Validators (Products)
 *
 * Zod schemas for product-related API payloads.
 * TODO: Duplicate and rename for each of your domain entities.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Create / Update product
// ---------------------------------------------------------------------------

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(2000).nullable().optional(),
  price: z.coerce.number().positive('Price must be a positive number').nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  category_id: z.string().uuid('Invalid category ID').nullable().optional(),
  // TODO: add/remove fields to match your domain model
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()

export type UpdateProductInput = z.infer<typeof updateProductSchema>

// ---------------------------------------------------------------------------
// List products query params
// ---------------------------------------------------------------------------

export const listProductsQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
})

export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>
