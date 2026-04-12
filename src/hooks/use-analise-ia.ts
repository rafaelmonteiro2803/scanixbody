'use client'

/**
 * SCANIX BODY – useAnaliseIA hook
 *
 * Manages the AI analysis report workflow:
 *   - Loads the most recent AI analysis report
 *   - Exposes checklist module status (which data modules are populated)
 *   - Tracks the 6 dimension scores (0 until a report is generated)
 *   - Provides generateAnalysis() to trigger POST /api/v1/analise-ia
 *
 * Returns:
 *   lastReport      – most recent AiAnalysisReportsRow or null
 *   checklistStatus – module-by-module boolean status object
 *   scores          – ScoreBreakdown (all 0 if no report yet)
 *   generateAnalysis – async function that calls the analysis endpoint
 *   loading         – true while fetching or generating
 *   error           – last error message, or null
 */

import { useState, useEffect, useCallback } from 'react'
import type { AiAnalysisReportsRow } from '@/types/database.types'
import type { ScoreBreakdown } from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChecklistStatus {
  hasProfile: boolean
  hasSessions: boolean
  hasMeals: boolean
  hasCardio: boolean
  hasMedications: boolean
  hasExams: boolean
}

export interface UseAnaliseIAReturn {
  lastReport: AiAnalysisReportsRow | null
  checklistStatus: ChecklistStatus
  scores: ScoreBreakdown
  generateAnalysis: () => Promise<AiAnalysisReportsRow>
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Default empty scores
// ---------------------------------------------------------------------------

const EMPTY_SCORES: ScoreBreakdown = {
  training: 0,
  diet: 0,
  sleep: 0,
  hydration: 0,
  cardio: 0,
  overall: 0,
}

// ---------------------------------------------------------------------------
// Extract scores from a report row
// ---------------------------------------------------------------------------

function extractScores(report: AiAnalysisReportsRow | null): ScoreBreakdown {
  if (!report) return EMPTY_SCORES
  return {
    training: report.score_training ?? 0,
    diet: report.score_diet ?? 0,
    sleep: report.score_sleep ?? 0,
    hydration: report.score_hydration ?? 0,
    cardio: report.score_cardio ?? 0,
    overall: report.score_overall ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnaliseIA(): UseAnaliseIAReturn {
  const [lastReport, setLastReport] = useState<AiAnalysisReportsRow | null>(null)
  const [checklistStatus, setChecklistStatus] = useState<ChecklistStatus>({
    hasProfile: false,
    hasSessions: false,
    hasMeals: false,
    hasCardio: false,
    hasMedications: false,
    hasExams: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch last report + checklist status ─────────────────────────────────

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/analise-ia')
      const json = await res.json()

      if (!res.ok || json.error) {
        // 404 means no report yet — not a true error
        if (res.status === 404) {
          setLastReport(null)
        } else {
          setError(json.error?.message ?? 'Erro ao buscar análise IA')
        }
        return
      }

      setLastReport(json.data?.report ?? null)
      if (json.data?.checklistStatus) {
        setChecklistStatus(json.data.checklistStatus as ChecklistStatus)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchReport()
  }, [fetchReport])

  // ── Generate analysis ─────────────────────────────────────────────────────

  const generateAnalysis = useCallback(async (): Promise<AiAnalysisReportsRow> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/analise-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Erro ao gerar análise IA')
      }

      const report = json.data as AiAnalysisReportsRow
      setLastReport(report)
      return report
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar análise'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    lastReport,
    checklistStatus,
    scores: extractScores(lastReport),
    generateAnalysis,
    loading,
    error,
    refresh: fetchReport,
  }
}

export default useAnaliseIA
