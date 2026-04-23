import React from 'react';
import { ShoppingCart } from 'lucide-react';

// TODO: Replace with your real orders list page.
// Follow the same pattern as products/page.tsx.

export const metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
          <p className="text-text-muted text-sm mt-1">Manage customer orders.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 border border-border mb-5">
          <ShoppingCart className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary">Orders module</h3>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Copy <code>products/page.tsx</code> as a starting template and wire up
          <code>/api/v1/orders</code> when you are ready to implement this module.
        </p>
      </div>
    </div>
  );
}
