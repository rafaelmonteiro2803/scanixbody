/**
 * SCANIX BODY – Exames (Lab Exam) Service
 *
 * Manages exam reports (uploaded files or raw text) and their extracted
 * lab marker values.
 */

import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
import type {
  ExamReportsRow,
  ExamMarkersRow,
} from '@/types/database.types'
import type {
  CreateExamReportDTO,
  CreateExamMarkerDTO,
} from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ExamReport = ExamReportsRow
export type ExamMarker = ExamMarkersRow

export interface ExamMarkerInput
  extends Omit<CreateExamMarkerDTO, 'exam_report_id'> {
  exam_report_id?: string
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

class ExamesServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ExamesServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const examesService = {
  /**
   * Returns all non-deleted exam reports for a user, newest first.
   */
  async getExamReports(userId: string): Promise<ExamReport[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('exam_reports')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw new ExamesServiceError(
        `getExamReports failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Returns a single exam report by ID, or null if it does not exist.
   */
  async getExamReportById(id: string): Promise<ExamReport | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('exam_reports')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null

      throw new ExamesServiceError(
        `getExamReportById failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? null
  },

  /**
   * Creates a new exam report for a user.
   */
  async createExamReport(
    userId: string,
    data: CreateExamReportDTO,
  ): Promise<ExamReport> {
    const supabase = await createClient()

    const { data: created, error } = await supabase
      .from('exam_reports')
      .insert({
        user_id: userId,
        file_asset_id: data.file_asset_id ?? null,
        report_date: data.report_date ?? null,
        source: data.source ?? 'text',
        raw_text: data.raw_text ?? null,
      })
      .select()
      .single()

    if (error || !created) {
      throw new ExamesServiceError(
        `createExamReport failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.EXAM_REPORT_CREATED,
      AUDIT_RESOURCES.EXAM_REPORT,
      created.id,
      { source: created.source, report_date: created.report_date },
    )

    return created
  },

  /**
   * Soft-deletes an exam report and its associated markers are orphaned
   * (intentional – markers stay for audit purposes).
   */
  async deleteExamReport(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('exam_reports')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new ExamesServiceError(
        `deleteExamReport failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.EXAM_REPORT_DELETED,
      AUDIT_RESOURCES.EXAM_REPORT,
      id,
    )
  },

  /**
   * Returns all exam markers for a given report, ordered by marker name.
   */
  async getExamMarkers(reportId: string): Promise<ExamMarker[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('exam_markers')
      .select('*')
      .eq('exam_report_id', reportId)
      .order('marker_name', { ascending: true })

    if (error) {
      throw new ExamesServiceError(
        `getExamMarkers failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },

  /**
   * Replaces all markers for a given exam report.
   * The existing markers are deleted first, then the new batch is inserted.
   */
  async saveExamMarkers(
    reportId: string,
    markers: ExamMarkerInput[],
  ): Promise<ExamMarker[]> {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ExamesServiceError('Not authenticated', 'not_authenticated')
    }

    // Remove existing markers for this report.
    const { error: deleteError } = await supabase
      .from('exam_markers')
      .delete()
      .eq('exam_report_id', reportId)

    if (deleteError) {
      throw new ExamesServiceError(
        `saveExamMarkers (delete) failed: ${deleteError.message}`,
        deleteError.code,
      )
    }

    if (markers.length === 0) return []

    const toInsert = markers.map((m) => ({
      exam_report_id: reportId,
      user_id: user.id,
      marker_name: m.marker_name,
      value: m.value ?? null,
      unit: m.unit ?? null,
      reference_range: m.reference_range ?? null,
      status: m.status ?? null,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('exam_markers')
      .insert(toInsert)
      .select()

    if (insertError || !inserted) {
      throw new ExamesServiceError(
        `saveExamMarkers (insert) failed: ${insertError?.message ?? 'no data'}`,
        insertError?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.EXAM_MARKERS_SAVED,
      AUDIT_RESOURCES.EXAM_MARKER,
      reportId,
      { marker_count: markers.length },
    )

    return inserted
  },

  /**
   * Returns all markers for a user across all reports, optionally filtered by
   * marker name (case-insensitive partial match).
   */
  async getUserMarkers(
    userId: string,
    markerName?: string,
  ): Promise<ExamMarker[]> {
    const supabase = await createClient()

    let query = supabase
      .from('exam_markers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (markerName) {
      query = query.ilike('marker_name', `%${markerName}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new ExamesServiceError(
        `getUserMarkers failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? []
  },
}

export default examesService
