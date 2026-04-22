import { withAuth, createApiResponse, createErrorResponse, parseBody, validateParams } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_request, ctx, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, price))')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return createErrorResponse('Order not found', 404, 'NOT_FOUND');
  }

  return createApiResponse(data);
});

export const PATCH = withAuth(async (request, ctx, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;

  const { data: body, error: parseErr } = await parseBody(request);
  if (parseErr) return createErrorResponse('Invalid JSON body', 400, 'INVALID_BODY');

  const { data: input, error: validErr } = validateParams(updateOrderSchema, body);
  if (validErr) return createErrorResponse(validErr, 422, 'VALIDATION_ERROR');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse('Order not found', 404, 'NOT_FOUND');
  }

  return createApiResponse(data);
});

export const DELETE = withAuth(async (_request, ctx, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId);

  if (error) {
    return createErrorResponse('Failed to delete order', 500, 'DB_ERROR');
  }

  return createApiResponse({ success: true });
});
