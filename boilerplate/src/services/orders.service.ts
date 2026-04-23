import { createClient } from '@/lib/supabase/server';
import { auditService } from './audit.service';

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'OrderServiceError';
  }
}

export interface CreateOrderPayload {
  items: Array<{ product_id: string; quantity: number; unit_price: number }>;
}

export interface UpdateOrderPayload {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export const ordersService = {
  async getOrders(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, price))')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new OrderServiceError('Failed to fetch orders', 'DB_ERROR');
    return data;
  },

  async getOrderById(userId: string, id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, price))')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new OrderServiceError('Order not found', 'NOT_FOUND');
    return data;
  },

  async createOrder(userId: string, payload: CreateOrderPayload) {
    const supabase = await createClient();

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({ user_id: userId, status: 'pending' })
      .select()
      .single();

    if (orderErr || !order) throw new OrderServiceError('Failed to create order', 'DB_ERROR');

    const itemRows = payload.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
    if (itemsErr) throw new OrderServiceError('Failed to create order items', 'DB_ERROR');

    void auditService.log('order.created', 'order', order.id, { user_id: userId });

    return order;
  },

  async updateOrder(userId: string, id: string, payload: UpdateOrderPayload) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) throw new OrderServiceError('Order not found', 'NOT_FOUND');

    void auditService.log('order.updated', 'order', id, { status: payload.status });

    return data;
  },

  async deleteOrder(userId: string, id: string) {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new OrderServiceError('Failed to delete order', 'DB_ERROR');

    void auditService.log('order.deleted', 'order', id, { user_id: userId });
  },
};
