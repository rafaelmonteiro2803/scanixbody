import {
  calculateMealMacros,
  calculateDailyMacros,
  estimateMacroTargets,
  calculateMacroPercentages,
  evaluateMacroBalance,
} from '../nutrition-calculations'

// ─── calculateMealMacros ─────────────────────────────────────────────────────

describe('calculateMealMacros', () => {
  it('sums macros across multiple items', () => {
    const result = calculateMealMacros([
      { calories: 350, protein_g: 30, carbs_g: 40, fat_g: 8 },
      { calories: 150, protein_g: 5, carbs_g: 25, fat_g: 4 },
    ])
    expect(result.calories).toBe(500)
    expect(result.protein_g).toBe(35)
    expect(result.carbs_g).toBe(65)
    expect(result.fat_g).toBe(12)
  })

  it('returns zeros for empty array', () => {
    const result = calculateMealMacros([])
    expect(result.calories).toBe(0)
    expect(result.protein_g).toBe(0)
    expect(result.carbs_g).toBe(0)
    expect(result.fat_g).toBe(0)
  })

  it('treats null macro fields as zero', () => {
    const result = calculateMealMacros([
      { calories: 200, protein_g: null, carbs_g: null, fat_g: null },
    ])
    expect(result.calories).toBe(200)
    expect(result.protein_g).toBe(0)
    expect(result.carbs_g).toBe(0)
    expect(result.fat_g).toBe(0)
  })

  it('derives calories from macros when calories field is missing', () => {
    // protein 20g * 4 + carbs 50g * 4 + fat 10g * 9 = 80+200+90 = 370
    const result = calculateMealMacros([
      { protein_g: 20, carbs_g: 50, fat_g: 10 },
    ])
    expect(result.calories).toBe(370)
  })

  it('prefers explicit calories over derived value', () => {
    // Explicit 500, derived would be 20*4+50*4+10*9=370
    const result = calculateMealMacros([
      { calories: 500, protein_g: 20, carbs_g: 50, fat_g: 10 },
    ])
    expect(result.calories).toBe(500)
  })

  it('rounds calories to integer and macros to 1 decimal', () => {
    const result = calculateMealMacros([
      { protein_g: 33.333, carbs_g: 0, fat_g: 0 },
    ])
    expect(Number.isInteger(result.calories)).toBe(true)
    const decimals = result.protein_g.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(1)
  })
})

// ─── calculateDailyMacros ────────────────────────────────────────────────────

describe('calculateDailyMacros', () => {
  const baseMeal = {
    id: '1',
    user_id: 'u1',
    meal_date: '2026-04-25',
    meal_type: 'lunch',
    description: 'Test',
    calories: 300,
    protein_g: 25,
    carbs_g: 30,
    fat_g: 10,
    water_ml: null,
    notes: null,
    created_at: '2026-04-25T12:00:00Z',
    updated_at: '2026-04-25T12:00:00Z',
    deleted_at: null,
  } as any

  it('aggregates active meals', () => {
    const result = calculateDailyMacros([baseMeal])
    expect(result.calories).toBe(300)
    expect(result.protein_g).toBe(25)
  })

  it('excludes soft-deleted meals', () => {
    const deleted = { ...baseMeal, deleted_at: '2026-04-25T13:00:00Z' }
    const result = calculateDailyMacros([baseMeal, deleted])
    expect(result.calories).toBe(300) // only the active one
  })

  it('returns zeros when all meals are deleted', () => {
    const deleted = { ...baseMeal, deleted_at: '2026-04-25T13:00:00Z' }
    const result = calculateDailyMacros([deleted])
    expect(result.calories).toBe(0)
  })
})

// ─── estimateMacroTargets ────────────────────────────────────────────────────

describe('estimateMacroTargets', () => {
  it('throws RangeError for zero TDEE', () => {
    expect(() => estimateMacroTargets(0, 'maintenance')).toThrow(RangeError)
  })

  it('throws RangeError for negative TDEE', () => {
    expect(() => estimateMacroTargets(-100, 'muscle_gain')).toThrow(RangeError)
  })

  it('returns a calories value close to TDEE for maintenance', () => {
    const result = estimateMacroTargets(2000, 'maintenance')
    // calories may differ slightly due to rounding
    expect(result.calories).toBeGreaterThan(1800)
    expect(result.calories).toBeLessThan(2200)
  })

  it('muscle_gain has more carbs % than weight_loss', () => {
    const gain = estimateMacroTargets(2500, 'muscle_gain')
    const loss = estimateMacroTargets(2500, 'weight_loss')
    expect(gain.carbs_g).toBeGreaterThan(loss.carbs_g)
  })

  it('muscle_gain has more protein % than maintenance', () => {
    const gain = estimateMacroTargets(2500, 'muscle_gain')
    const maintenance = estimateMacroTargets(2500, 'maintenance')
    expect(gain.protein_g).toBeGreaterThan(maintenance.protein_g)
  })

  it('unknown goal falls back to maintenance ratios', () => {
    const unknown = estimateMacroTargets(2000, 'unknown_goal_xyz')
    const maintenance = estimateMacroTargets(2000, 'maintenance')
    expect(unknown.protein_g).toBe(maintenance.protein_g)
    expect(unknown.carbs_g).toBe(maintenance.carbs_g)
  })

  it('enforces minimum protein per kg when weight provided', () => {
    // muscle_gain min: 2.2g/kg × 100kg = 220g
    // percentage-based: 2500 × 0.30 / 4 = 187.5g → below min → should be ≥220
    const result = estimateMacroTargets(2500, 'muscle_gain', 100)
    expect(result.protein_g).toBeGreaterThanOrEqual(220)
  })

  it('includes protein_per_kg when weight is provided', () => {
    const result = estimateMacroTargets(2500, 'maintenance', 80)
    expect(result.protein_per_kg).toBeDefined()
    expect(result.protein_per_kg).toBeGreaterThan(0)
  })

  it('does not include protein_per_kg when weight is omitted', () => {
    const result = estimateMacroTargets(2500, 'maintenance')
    expect(result.protein_per_kg).toBeUndefined()
  })
})

// ─── calculateMacroPercentages ───────────────────────────────────────────────

describe('calculateMacroPercentages', () => {
  it('calculates correct percentages', () => {
    // protein 150g*4=600, carbs 200g*4=800, fat 56g*9=504 → total 1904
    const result = calculateMacroPercentages({
      calories: 2000,
      protein_g: 150,
      carbs_g: 200,
      fat_g: 56,
    })
    expect(result.protein_pct).toBeCloseTo((600 / 1904) * 100, 0)
    expect(result.carbs_pct).toBeCloseTo((800 / 1904) * 100, 0)
    expect(result.fat_pct).toBeCloseTo((504 / 1904) * 100, 0)
  })

  it('percentages sum to approximately 100', () => {
    const result = calculateMacroPercentages({
      calories: 2000,
      protein_g: 150,
      carbs_g: 200,
      fat_g: 56,
    })
    const sum = result.protein_pct + result.carbs_pct + result.fat_pct
    expect(sum).toBeCloseTo(100, 0)
  })

  it('handles all-zero macros without throwing', () => {
    const result = calculateMacroPercentages({
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    })
    expect(result.protein_pct).toBe(0)
    expect(result.carbs_pct).toBe(0)
    expect(result.fat_pct).toBe(0)
  })
})

// ─── evaluateMacroBalance ────────────────────────────────────────────────────

describe('evaluateMacroBalance', () => {
  const target = {
    calories: 2500,
    protein_g: 190,
    carbs_g: 280,
    fat_g: 70,
  }

  it('returns score 100 and positive feedback when macros are on target', () => {
    const result = evaluateMacroBalance(
      { calories: 2500, protein_g: 190, carbs_g: 280, fat_g: 70 },
      target,
    )
    expect(result.overall_score).toBe(100)
    expect(result.protein_status).toBe('adequate')
    expect(result.carbs_status).toBe('adequate')
    expect(result.fat_status).toBe('adequate')
    expect(result.calorie_status).toBe('maintenance')
    expect(result.feedback[0]).toMatch(/excelente/i)
  })

  it('flags low protein with deduction', () => {
    const result = evaluateMacroBalance(
      { calories: 2500, protein_g: 100, carbs_g: 280, fat_g: 70 },
      target,
    )
    expect(result.protein_status).toBe('low')
    expect(result.overall_score).toBeLessThan(100)
  })

  it('flags calorie deficit', () => {
    const result = evaluateMacroBalance(
      { calories: 2000, protein_g: 190, carbs_g: 280, fat_g: 70 },
      target,
    )
    expect(result.calorie_status).toBe('deficit')
    expect(result.overall_score).toBeLessThan(100)
  })

  it('flags calorie surplus', () => {
    const result = evaluateMacroBalance(
      { calories: 3200, protein_g: 190, carbs_g: 280, fat_g: 70 },
      target,
    )
    expect(result.calorie_status).toBe('surplus')
  })

  it('flags very low fat (< 40g) with high deduction', () => {
    const result = evaluateMacroBalance(
      { calories: 2500, protein_g: 190, carbs_g: 280, fat_g: 20 },
      target,
    )
    expect(result.overall_score).toBeLessThanOrEqual(85)
    expect(result.feedback.some((f) => f.includes('hormonal'))).toBe(true)
  })

  it('overall_score is clamped to [0, 100]', () => {
    // Worst case: everything is terrible
    const result = evaluateMacroBalance(
      { calories: 100, protein_g: 10, carbs_g: 10, fat_g: 5 },
      target,
    )
    expect(result.overall_score).toBeGreaterThanOrEqual(0)
    expect(result.overall_score).toBeLessThanOrEqual(100)
  })
})
