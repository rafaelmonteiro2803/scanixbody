'use client'

/**
 * MY APP – useProducts hook (example domain hook)
 *
 * Fetches a paginated list of products for the current user.
 *
 * TODO: Duplicate this file and rename it for each of your domain entities.
 *       Replace "product" / "Product" with your entity name throughout.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@/services/products.service'

interface UseProductsOptions {
  status?: string
  category_id?: string
  search?: string
  page?: number
  perPage?: number
}

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.category_id) params.set('category_id', options.category_id)
      if (options.search) params.set('search', options.search)
      if (options.page) params.set('page', String(options.page))
      if (options.perPage) params.set('perPage', String(options.perPage))

      const res = await fetch(`/api/v1/products?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Failed to load products')
      }

      setProducts(json.data?.products ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [options.status, options.category_id, options.search, options.page, options.perPage])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  return { products, isLoading, error, refetch: fetchProducts }
}
