'use client';

import { useState, useCallback } from 'react';

export interface Order {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    products?: { name: string; price: number };
  }>;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/orders');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to fetch orders');
        return;
      }
      setOrders(json.data ?? []);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    const res = await fetch(`/api/v1/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update order');
    setOrders((prev) => prev.map((o) => (o.id === id ? json.data : o)));
    return json.data as Order;
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const res = await fetch(`/api/v1/orders/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error?.message ?? 'Failed to delete order');
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    deleteOrder,
  };
}

export default useOrders;
