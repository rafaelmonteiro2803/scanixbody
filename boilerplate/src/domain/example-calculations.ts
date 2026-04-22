/**
 * Example domain calculation functions.
 *
 * Keep pure business logic here — no database calls, no HTTP requests, no
 * React imports. This layer is easy to unit-test in isolation.
 *
 * TODO: Replace these with your real domain calculations.
 */

// ── Order helpers ─────────────────────────────────────────────────────────────

export interface OrderItem {
  quantity: number;
  unit_price: number;
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function applyDiscount(total: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError('Discount percent must be between 0 and 100');
  }
  return total * (1 - discountPercent / 100);
}

// ── Pagination helpers ────────────────────────────────────────────────────────

export function calculatePageCount(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

export function paginateArray<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// ── Text helpers ──────────────────────────────────────────────────────────────

export function getInitials(name: string | null | undefined, fallback = '?'): string {
  if (!name?.trim()) return fallback;
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
