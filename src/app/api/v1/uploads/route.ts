/**
 * POST /api/v1/uploads  – upload a file to Supabase Storage
 *
 * Expects multipart/form-data with:
 *   file   – the file blob
 *   module – storage bucket / module identifier (e.g. 'exames', 'bioimpedance', 'avatar')
 *
 * Response: { fileAsset, publicUrl }
 */

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/constants'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitizes a filename: removes path traversal, replaces spaces, lowercases. */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '') // strip shell-unsafe chars
    .replace(/\s+/g, '_')          // spaces → underscores
    .toLowerCase()
    .slice(0, 200)                  // cap length
}

/** Allowed MIME types */
const ALLOWED_MIMES = new Set<string>(ALLOWED_FILE_TYPES.all)

/** Known bucket names mapped from module identifiers */
const MODULE_BUCKETS: Record<string, string> = {
  exames: 'exames',
  bioimpedance: 'bioimpedance',
  avatar: 'avatars',
  dieta: 'dieta',
  cardio: 'cardio',
  general: 'uploads',
}

function getBucket(module: string): string {
  return MODULE_BUCKETS[module] ?? 'uploads'
}

// ---------------------------------------------------------------------------
// POST /api/v1/uploads
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return createErrorResponse(
      'Corpo da requisição deve ser multipart/form-data',
      400,
    )
  }

  const file = formData.get('file')
  const module = (formData.get('module') as string | null) ?? 'general'

  // ── Validate file presence ────────────────────────────────────────────────
  if (!file || !(file instanceof File)) {
    return createErrorResponse('Campo "file" é obrigatório', 400)
  }

  // ── Validate file size ────────────────────────────────────────────────────
  if (file.size > MAX_FILE_SIZE) {
    return createErrorResponse(
      `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      400,
      'FILE_TOO_LARGE',
    )
  }

  if (file.size === 0) {
    return createErrorResponse('Arquivo está vazio', 400)
  }

  // ── Validate MIME type ────────────────────────────────────────────────────
  const mimeType = file.type || 'application/octet-stream'
  if (!ALLOWED_MIMES.has(mimeType)) {
    return createErrorResponse(
      `Tipo de arquivo não permitido: ${mimeType}`,
      400,
      'INVALID_FILE_TYPE',
      { allowedTypes: Array.from(ALLOWED_MIMES) },
    )
  }

  // ── Build storage path ────────────────────────────────────────────────────
  const sanitizedName = sanitizeFilename(file.name || 'upload')
  const timestamp = Date.now()
  const storagePath = `${ctx.userId}/${timestamp}_${sanitizedName}`
  const bucket = getBucket(module)

  const supabase = await createClient()

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('[POST /uploads] storage upload error:', uploadError.message)
    return createErrorResponse(
      `Erro ao fazer upload: ${uploadError.message}`,
      500,
      'UPLOAD_FAILED',
    )
  }

  // ── Get public URL ────────────────────────────────────────────────────────
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath)

  const publicUrl = urlData.publicUrl

  // ── Create file_assets record ─────────────────────────────────────────────
  const { data: fileAsset, error: assetError } = await supabase
    .from('file_assets')
    .insert({
      user_id: ctx.userId,
      storage_path: storagePath,
      original_name: file.name,
      mime_type: mimeType,
      size_bytes: file.size,
      module,
    })
    .select()
    .single()

  if (assetError || !fileAsset) {
    // Try to clean up the uploaded file
    await supabase.storage.from(bucket).remove([storagePath])
    console.error('[POST /uploads] file_assets insert error:', assetError?.message)
    return createErrorResponse(
      'Erro ao registrar arquivo',
      500,
      'ASSET_CREATE_FAILED',
    )
  }

  return createApiResponse({ fileAsset, publicUrl }, 201)
})
