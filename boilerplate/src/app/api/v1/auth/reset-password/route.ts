import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, parseBody, validateParams } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { resetPasswordSchema } from '@/validators/auth.validator';

export async function POST(request: NextRequest) {
  const { data: body, error: parseErr } = await parseBody(request);
  if (parseErr) return createErrorResponse('Invalid JSON body', 400, 'INVALID_BODY');

  const { data: input, error: validErr } = validateParams(resetPasswordSchema, body);
  if (validErr) return createErrorResponse(validErr, 422, 'VALIDATION_ERROR');

  const supabase = await createAdminClient();

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`;

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });

  if (error) {
    return createErrorResponse('Failed to send reset email.', 500, 'AUTH_ERROR');
  }

  // Always return success to prevent email enumeration
  return createApiResponse({ message: 'Reset email sent if account exists.' });
}
