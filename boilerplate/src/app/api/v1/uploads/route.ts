import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { FILE_UPLOAD } from '@/lib/constants';

// TODO: Create a Supabase Storage bucket named "uploads" (or rename below).
const BUCKET = 'uploads';

export const POST = withAuth(async (request, ctx) => {
  const formData = await request.formData().catch(() => null);
  if (!formData) return createErrorResponse('Invalid form data', 400, 'INVALID_BODY');

  const file = formData.get('file') as File | null;
  if (!file) return createErrorResponse('No file provided', 400, 'NO_FILE');

  if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
    return createErrorResponse(
      `File exceeds maximum size of ${FILE_UPLOAD.MAX_SIZE_MB} MB`,
      413,
      'FILE_TOO_LARGE',
    );
  }

  if (!FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.type as (typeof FILE_UPLOAD.ALLOWED_MIME_TYPES)[number])) {
    return createErrorResponse('File type not allowed', 415, 'INVALID_FILE_TYPE');
  }

  const supabase = await createClient();

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${ctx.userId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadErr) {
    return createErrorResponse('Upload failed', 500, 'UPLOAD_ERROR');
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Persist a reference in file_assets table
  const { data: asset, error: dbErr } = await supabase
    .from('file_assets')
    .insert({
      user_id: ctx.userId,
      bucket: BUCKET,
      path,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      public_url: urlData.publicUrl,
    })
    .select()
    .single();

  if (dbErr) {
    return createErrorResponse('Failed to persist file reference', 500, 'DB_ERROR');
  }

  return createApiResponse(asset, 201);
});
