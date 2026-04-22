import { withAuth, createApiResponse, createErrorResponse, parseBody, validateParams } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional(),
});

export const PATCH = withAuth(async (request, ctx) => {
  const { data: body, error: parseErr } = await parseBody(request);
  if (parseErr) return createErrorResponse('Invalid JSON body', 400, 'INVALID_BODY');

  const { data: input, error: validErr } = validateParams(updateProfileSchema, body);
  if (validErr) return createErrorResponse(validErr, 422, 'VALIDATION_ERROR');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', ctx.userId)
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse('Failed to update profile', 500, 'DB_ERROR');
  }

  return createApiResponse(data);
});
