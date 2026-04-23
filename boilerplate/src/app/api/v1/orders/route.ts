import { withAuth, createApiResponse, createErrorResponse, parseBody, validateParams } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.coerce.number().int().positive(),
    }),
  ).min(1, 'Order must have at least one item'),
});

export const GET = withAuth(async (_request, ctx) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('user_id', ctx.userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return createErrorResponse('Failed to fetch orders', 500, 'DB_ERROR');
  }

  return createApiResponse(data);
});

export const POST = withAuth(async (request, ctx) => {
  const { data: body, error: parseErr } = await parseBody(request);
  if (parseErr) return createErrorResponse('Invalid JSON body', 400, 'INVALID_BODY');

  const { data: input, error: validErr } = validateParams(createOrderSchema, body);
  if (validErr) return createErrorResponse(validErr, 422, 'VALIDATION_ERROR');

  const supabase = await createClient();

  // Create the order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ user_id: ctx.userId, status: 'pending' })
    .select()
    .single();

  if (orderErr || !order) {
    return createErrorResponse('Failed to create order', 500, 'DB_ERROR');
  }

  // Insert order items
  const itemRows = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: 0, // TODO: fetch real price from products table
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);

  if (itemsErr) {
    return createErrorResponse('Failed to create order items', 500, 'DB_ERROR');
  }

  return createApiResponse(order, 201);
});
