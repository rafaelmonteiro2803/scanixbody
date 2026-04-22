'use client';

/**
 * MY APP – Products Page (example domain list page)
 *
 * Shows a searchable, paginated list of products with create/edit/delete.
 *
 * TODO: Rename this page and replace "product" / "Product" with your entity.
 */

import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const { products, isLoading, error, refetch } = useProducts({ search });
  const { success, error: toastError } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/v1/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      success('Product deleted');
      refetch();
    } catch {
      toastError('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-text-muted text-sm mt-1">Manage your products</p>
        </div>

        {/* TODO: wire up to a create modal or navigate to a create page */}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-text-muted text-sm">Loading…</div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 text-sm">{error}</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">
            No products found.{' '}
            <button type="button" className="text-primary hover:underline">
              Create your first product
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background-elevated border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary uppercase text-xs tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary uppercase text-xs tracking-wide hidden md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary uppercase text-xs tracking-wide">
                  Price
                </th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary uppercase text-xs tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{product.name}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell capitalize">
                    {product.status}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {product.price != null ? `$${product.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* TODO: wire up edit modal/page */}
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
