/**
 * SCANIX BODY – Dieta (Diet) Service
 *
 * Manages daily meal entries and diet analysis snapshots.
 */

import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
import type {
  MealsRow,
  DietAnalysesRow,
} from '@/types/database.types'
import type {
  CreateMealDTO,
  UpdateMealDTO,
} from '@/types/domain.types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Meal = MealsRow
export type DietAnalysis = DietAnalysesRow

export interface SaveDietAnalysisDTO {
  userId: string
  analysis_date: string
  total_calories?: number | null
  total_protein_g?: number | null
  total_carbs_g?: number | null
  total_fat_g?: number | null
  positive_points?: string[]
  improvement_points?: string[]
  ai_generated?: boolean
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

class DietaServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'DietaServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const dietaService = {
  /**
   * Returns non-deleted meals for a user, optionally filtered to a specific
   * date (ISO string, e.g. `"2024-03-15"`).  Results are ordered by meal_date
   * descending and then by time ascending within the same day.
   */
  async getMeals(
    userId: string,
    options: { date?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Meal[]; total: number }> {
    const supabase = await createClient()
    const { date, limit = 50, offset = 0 } = options

    let baseQuery = supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('meal_date', { ascending: false })
      .order('time', { ascending: true })

    let countQuery = supabase
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (date) {
      baseQuery = baseQuery.eq('meal_date', date)
      countQuery = countQuery.eq('meal_date', date)
    }

    // When filtering by a specific date, return all rows for that day (no pagination needed)
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      date ? baseQuery : baseQuery.range(offset, offset + limit - 1),
      countQuery,
    ])

    if (error) {
      throw new DietaServiceError(`getMeals failed: ${error.message}`, error.code)
    }
    if (countError) {
      throw new DietaServiceError(`getMeals count failed: ${countError.message}`, countError.code)
    }

    return { data: data ?? [], total: count ?? 0 }
  },

  /**
   * Creates a new meal entry for the authenticated user.
   */
  async createMeal(userId: string, data: CreateMealDTO): Promise<Meal> {
    const supabase = await createClient()

    const { data: created, error } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        meal_date: data.meal_date,
        meal_name: data.meal_name,
        time: data.time ?? null,
        calories: data.calories ?? null,
        protein_g: data.protein_g ?? null,
        carbs_g: data.carbs_g ?? null,
        fat_g: data.fat_g ?? null,
        items: data.items ?? null,
        source: data.source ?? 'manual',
        notes: data.notes ?? null,
      })
      .select()
      .single()

    if (error || !created) {
      throw new DietaServiceError(
        `createMeal failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.MEAL_CREATED,
      AUDIT_RESOURCES.MEAL,
      created.id,
      { meal_name: created.meal_name, meal_date: created.meal_date },
    )

    return created
  },

  /**
   * Partially updates an existing meal.
   */
  async updateMeal(id: string, data: UpdateMealDTO): Promise<Meal> {
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('meals')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      throw new DietaServiceError(
        `updateMeal failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.MEAL_UPDATED,
      AUDIT_RESOURCES.MEAL,
      id,
      data,
    )

    return updated
  },

  /**
   * Soft-deletes a meal by setting `deleted_at`.
   */
  async deleteMeal(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('meals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new DietaServiceError(
        `deleteMeal failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.MEAL_DELETED,
      AUDIT_RESOURCES.MEAL,
      id,
    )
  },

  /**
   * Returns the diet analysis for a specific date, or `null` when none exists.
   * If no date is provided the most recent analysis is returned.
   */
  async getDietAnalysis(
    userId: string,
    date?: string,
  ): Promise<DietAnalysis | null> {
    const supabase = await createClient()

    let query = supabase
      .from('diet_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })
      .limit(1)

    if (date) {
      query = query.eq('analysis_date', date)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null

      throw new DietaServiceError(
        `getDietAnalysis failed: ${error.message}`,
        error.code,
      )
    }

    return data ?? null
  },

  /**
   * Upserts a diet analysis for a given user + date.
   * If an analysis for the same user_id + analysis_date already exists it is
   * updated; otherwise a new row is inserted.
   */
  async saveDietAnalysis(dto: SaveDietAnalysisDTO): Promise<DietAnalysis> {
    const supabase = await createClient()

    // Check for an existing row.
    const { data: existing } = await supabase
      .from('diet_analyses')
      .select('id')
      .eq('user_id', dto.userId)
      .eq('analysis_date', dto.analysis_date)
      .single()

    let result: DietAnalysis

    if (existing) {
      const { data: updated, error } = await supabase
        .from('diet_analyses')
        .update({
          total_calories: dto.total_calories ?? null,
          total_protein_g: dto.total_protein_g ?? null,
          total_carbs_g: dto.total_carbs_g ?? null,
          total_fat_g: dto.total_fat_g ?? null,
          positive_points: dto.positive_points ?? [],
          improvement_points: dto.improvement_points ?? [],
          ai_generated: dto.ai_generated ?? false,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error || !updated) {
        throw new DietaServiceError(
          `saveDietAnalysis (update) failed: ${error?.message ?? 'no data'}`,
          error?.code,
        )
      }

      result = updated
    } else {
      const { data: created, error } = await supabase
        .from('diet_analyses')
        .insert({
          user_id: dto.userId,
          analysis_date: dto.analysis_date,
          total_calories: dto.total_calories ?? null,
          total_protein_g: dto.total_protein_g ?? null,
          total_carbs_g: dto.total_carbs_g ?? null,
          total_fat_g: dto.total_fat_g ?? null,
          positive_points: dto.positive_points ?? [],
          improvement_points: dto.improvement_points ?? [],
          ai_generated: dto.ai_generated ?? false,
        })
        .select()
        .single()

      if (error || !created) {
        throw new DietaServiceError(
          `saveDietAnalysis (insert) failed: ${error?.message ?? 'no data'}`,
          error?.code,
        )
      }

      result = created
    }

    return result
  },
}

export default dietaService
