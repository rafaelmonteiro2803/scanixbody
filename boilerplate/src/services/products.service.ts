/**
 * MY APP – Example Domain Service (Products)
 *
 * This file demonstrates the service pattern for a domain entity.
 * It shows:
 *   - Paginated list with filters
 *   - Single record fetch
 *   - Create / Update / Soft-delete
 *   - Audit log integration
 *
 * TODO: Duplicate this file and rename it for your own domain entities.
 *       Replace "product" / "Product" with your entity name.
 *       Replace "products" with your Supabase table name.
 */

import { createClient } from '@/lib/supabase/server'
import auditService from '@/services/audit.service'
import type { ProductsRow, ProductsInsert, ProductsUpdate } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Product = ProductsRow

export interface ProductFilters {
  status?: string
  category_id?: string
  search?: string
  page?: number
  perPage?: number
}

class ProductServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'ProductServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const productsService = {
  /**
   * Returns a paginated list of products belonging to the current user.
   */
  async getProducts(userId: string, filters?: ProductFilters): Promise<Product[]> {
    const supabase = await createClient()

    const page = filters?.page ?? 1
    const perPage = filters?.perPage ?? 20
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.category_id) query = query.eq('category_id', filters.category_id)
    if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

    const { data, error } = await query

    if (error) {
      throw new ProductServiceError(`getProducts failed: ${error.message}`, error.code)
    }

    return data ?? []
  },

  /**
   * Returns a single product by ID (only if it belongs to the user).
   */
  async getProductById(userId: string, id: string): Promise<Product | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new ProductServiceError(`getProductById failed: ${error.message}`, error.code)
    }

    return data
  },

  /**
   * Creates a new product.
   */
  async createProduct(userId: string, payload: Omit<ProductsInsert, 'user_id'>): Promise<Product> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .insert({ ...payload, user_id: userId })
      .select()
      .single()

    if (error || !data) {
      throw new ProductServiceError(`createProduct failed: ${error?.message}`, error?.code)
    }

    void auditService.log('product.created', 'product', data.id, { name: data.name })

    return data
  },

  /**
   * Updates a product (only if it belongs to the user).
   */
  async updateProduct(
    userId: string,
    id: string,
    payload: ProductsUpdate,
  ): Promise<Product> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error || !data) {
      throw new ProductServiceError(`updateProduct failed: ${error?.message}`, error?.code)
    }

    void auditService.log('product.updated', 'product', id)

    return data
  },

  /**
   * Soft-deletes a product by setting deleted_at.
   */
  async deleteProduct(userId: string, id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new ProductServiceError(`deleteProduct failed: ${error.message}`, error.code)
    }

    void auditService.log('product.deleted', 'product', id)
  },
}

export default productsService
