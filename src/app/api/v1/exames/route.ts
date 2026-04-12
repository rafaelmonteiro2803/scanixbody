/**
 * GET  /api/v1/exames  – list the authenticated user's exam reports
 * POST /api/v1/exames  – create a new exam report with markers
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import {
  withAuth,
  createApiResponse,
  createErrorResponse,
  parseBody,
  validateParams,
  formatZodError,
} from '@/lib/api-helpers'
import {
  createExamReportSchema,
  listExamReportsQuerySchema,
} from '@/validators/exames.validator'
import examesService from '@/services/exames.service'
import type { ExamMarker } from '@/services/exames.service'
import type { AuthContext } from '@/lib/api-helpers'

// ---------------------------------------------------------------------------
// GET /api/v1/exames
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { searchParams } = new URL(request.url)

  const queryInput = {
    source: searchParams.get('source') ?? undefined,
    markerName: searchParams.get('markerName') ?? undefined,
  }

  const { data: query, error: queryError } = validateParams(
    listExamReportsQuerySchema,
    queryInput,
  )
  if (queryError) {
    return createErrorResponse(
      'Parâmetros de consulta inválidos',
      400,
      'VALIDATION_ERROR',
      formatZodError(queryError),
    )
  }

  try {
    const reports = await examesService.getExamReports(ctx.userId)

    // Optionally filter by source on the result set
    const filtered = query?.source
      ? reports.filter((r) => r.source === query.source)
      : reports

    return createApiResponse({ reports: filtered, total: filtered.length })
  } catch (err) {
    console.error('[GET /exames]', err)
    const message = err instanceof Error ? err.message : 'Erro ao buscar exames'
    return createErrorResponse(message, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/exames
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: NextRequest, ctx: AuthContext) => {
  const { data: body, error: parseError } = await parseBody(request)
  if (parseError) {
    return createErrorResponse(parseError, 400)
  }

  const { data: input, error: validationError } = validateParams(
    createExamReportSchema,
    body,
  )
  if (validationError) {
    return createErrorResponse(
      'Dados inválidos',
      400,
      'VALIDATION_ERROR',
      formatZodError(validationError),
    )
  }

  try {
    // Create the report
    const report = await examesService.createExamReport(ctx.userId, {
      file_asset_id: input!.fileAssetId ?? undefined,
      report_date: input!.reportDate ?? undefined,
      source: input!.source,
      raw_text: input!.rawText ?? undefined,
    })

    // Save markers if provided
    let markers: ExamMarker[] = []
    if (input!.markers && input!.markers.length > 0) {
      const markerInputs = input!.markers.map((m) => ({
        marker_name: m.markerName,
        value: m.value ?? undefined,
        unit: m.unit ?? undefined,
        reference_range: m.referenceRange ?? undefined,
        status: m.status ?? undefined,
      }))
      markers = await examesService.saveExamMarkers(report.id, markerInputs)
    }

    return createApiResponse({ report, markers }, 201)
  } catch (err) {
    console.error('[POST /exames]', err)
    const message = err instanceof Error ? err.message : 'Erro ao criar exame'
    return createErrorResponse(message, 500)
  }
})
