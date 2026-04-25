import {
  calculateSleepScore,
  calculateHydrationScore,
  calculateCardioScore,
  calculateOverallScore,
  calculateTrainingScore,
  calculateDietScore,
  generateChecklistItems,
} from '../ai-scoring'

// ─── calculateSleepScore ──────────────────────────────────────────────────────

describe('calculateSleepScore', () => {
  it('returns 100 for optimal sleep (7.5h, quality 8)', () => {
    expect(calculateSleepScore(7.5, 8)).toBe(100)
  })

  it('penalises < 5h heavily', () => {
    expect(calculateSleepScore(4, 8)).toBeLessThanOrEqual(50)
  })

  it('penalises < 6h', () => {
    expect(calculateSleepScore(5.5, 8)).toBeLessThan(calculateSleepScore(6.5, 8))
  })

  it('penalises < 7h', () => {
    expect(calculateSleepScore(6.5, 8)).toBeLessThan(calculateSleepScore(7.5, 8))
  })

  it('mild penalty for > 9h', () => {
    const over = calculateSleepScore(10, 8)
    const optimal = calculateSleepScore(8, 8)
    expect(over).toBeGreaterThanOrEqual(optimal - 10)
  })

  it('penalises low quality (≤ 4)', () => {
    expect(calculateSleepScore(7.5, 4)).toBeLessThan(100)
  })

  it('penalises medium quality (5–6)', () => {
    const mid = calculateSleepScore(7.5, 6)
    const good = calculateSleepScore(7.5, 8)
    expect(mid).toBeLessThan(good)
  })

  it('no penalty for quality ≥ 7', () => {
    expect(calculateSleepScore(7.5, 7)).toBe(100)
  })

  it('deducts points when sleepHours is null', () => {
    expect(calculateSleepScore(null, 8)).toBeLessThan(100)
  })

  it('deducts points when quality is null', () => {
    expect(calculateSleepScore(7.5, null)).toBeLessThan(100)
  })

  it('score is clamped to [0, 100]', () => {
    const score = calculateSleepScore(3, 1)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── calculateHydrationScore ──────────────────────────────────────────────────

describe('calculateHydrationScore', () => {
  it('returns 70 when waterPerDay is null', () => {
    // score starts 100 − 30 = 70
    expect(calculateHydrationScore(null, 80)).toBe(70)
  })

  it('returns 100 when intake meets target (≥ 90%)', () => {
    // target for 80kg = 2800ml; 2800ml is exactly 100%
    expect(calculateHydrationScore(2800, 80)).toBe(100)
  })

  it('deducts 10 when 75–89% of target', () => {
    // target 2800; 75% = 2100; use 2200 (≈78%)
    expect(calculateHydrationScore(2200, 80)).toBe(90)
  })

  it('deducts more when < 40% of target', () => {
    // target 2800; 40% = 1120; use 1000 (≈35%)
    expect(calculateHydrationScore(1000, 80)).toBeLessThanOrEqual(40)
  })

  it('uses generic 2000ml baseline when weight is null', () => {
    // ratio = 800/2000 = 0.4 < 0.5 → −40 → 60
    expect(calculateHydrationScore(800, null)).toBe(60)
  })

  it('score is clamped to [0, 100]', () => {
    const score = calculateHydrationScore(10, 80)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── calculateCardioScore ─────────────────────────────────────────────────────

describe('calculateCardioScore', () => {
  it('returns 40 when cardio profile is null', () => {
    expect(calculateCardioScore(null)).toBe(40)
  })

  it('returns 50 when practices is false', () => {
    expect(calculateCardioScore({ practices: false } as any)).toBe(50)
  })

  it('returns 100 for optimal cardio profile', () => {
    const profile = {
      practices: true,
      frequency_per_week: 3,
      duration_minutes: 40,
      goal: 'fat_loss',
    }
    expect(calculateCardioScore(profile as any)).toBe(100)
  })

  it('deducts for frequency < 2', () => {
    const profile = {
      practices: true,
      frequency_per_week: 1,
      duration_minutes: 40,
      goal: 'fat_loss',
    }
    expect(calculateCardioScore(profile as any)).toBeLessThan(100)
  })

  it('deducts for zero duration', () => {
    const profile = {
      practices: true,
      frequency_per_week: 3,
      duration_minutes: 0,
      goal: 'fat_loss',
    }
    expect(calculateCardioScore(profile as any)).toBeLessThan(100)
  })

  it('deducts for missing goal', () => {
    const profile = {
      practices: true,
      frequency_per_week: 3,
      duration_minutes: 40,
      goal: null,
    }
    expect(calculateCardioScore(profile as any)).toBe(95)
  })
})

// ─── calculateOverallScore ────────────────────────────────────────────────────

describe('calculateOverallScore', () => {
  it('calculates weighted average correctly', () => {
    // 90*0.3 + 75*0.3 + 85*0.2 + 70*0.1 + 60*0.1
    // = 27 + 22.5 + 17 + 7 + 6 = 79.5 → rounds to 80
    expect(calculateOverallScore({
      training: 90,
      diet: 75,
      sleep: 85,
      hydration: 70,
      cardio: 60,
    })).toBe(80)
  })

  it('returns 100 when all dimensions are 100', () => {
    expect(calculateOverallScore({
      training: 100,
      diet: 100,
      sleep: 100,
      hydration: 100,
      cardio: 100,
    })).toBe(100)
  })

  it('returns 0 when all dimensions are 0', () => {
    expect(calculateOverallScore({
      training: 0,
      diet: 0,
      sleep: 0,
      hydration: 0,
      cardio: 0,
    })).toBe(0)
  })

  it('score is clamped to [0, 100]', () => {
    const score = calculateOverallScore({
      training: 100,
      diet: 100,
      sleep: 100,
      hydration: 100,
      cardio: 100,
    })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── calculateTrainingScore ───────────────────────────────────────────────────

describe('calculateTrainingScore', () => {
  const TODAY = '2026-04-25'

  /** Build a WorkoutSessionsRow-like stub with a date within the last N days */
  function session(daysAgo: number) {
    const d = new Date(TODAY + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() - daysAgo)
    return {
      session_date: d.toISOString().slice(0, 10),
      deleted_at: null,
    } as any
  }

  function workoutDay(active = true) {
    return { deleted_at: active ? null : '2026-01-01T00:00:00Z' } as any
  }

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(TODAY + 'T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns 100 for complete program with recent sessions', () => {
    const sessions = [session(1), session(3)]
    const days = [workoutDay(), workoutDay()]
    expect(calculateTrainingScore(sessions, days, 10)).toBe(100)
  })

  it('deducts 50 (structure) + 30 (no sessions) for no workout days configured', () => {
    // −50 (no days) −30 (no sessions last 30d, no complete program) = 20
    expect(calculateTrainingScore([], [], 0)).toBe(20)
  })

  it('deducts 30 for 1 day, no exercises, no sessions', () => {
    // −30 (structure) −30 (no sessions last 30d) = 40
    expect(calculateTrainingScore([], [workoutDay()], 0)).toBe(40)
  })

  it('deducts mildly for complete program but no recent sessions', () => {
    const days = [workoutDay(), workoutDay()]
    // −10 (no sessions last 30 days)
    expect(calculateTrainingScore([], days, 5)).toBe(90)
  })

  it('excludes soft-deleted sessions', () => {
    const deletedSession = { ...session(1), deleted_at: '2026-04-25T10:00:00Z' }
    const days = [workoutDay(), workoutDay()]
    // Deleted session shouldn't count → same as no sessions last 30d
    expect(calculateTrainingScore([deletedSession], days, 5)).toBe(90)
  })

  it('score is clamped to [0, 100]', () => {
    const score = calculateTrainingScore([], [], 0)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── calculateDietScore ───────────────────────────────────────────────────────

describe('calculateDietScore', () => {
  const TODAY = '2026-04-25'

  function meal(daysAgo: number, overrides: Record<string, any> = {}) {
    const d = new Date(TODAY + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() - daysAgo)
    return {
      meal_date: d.toISOString().slice(0, 10),
      deleted_at: null,
      calories: 400,
      protein_g: 30,
      carbs_g: 50,
      fat_g: 10,
      ...overrides,
    } as any
  }

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(TODAY + 'T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns 100 for 7+ meals last 7 days (no protein check)', () => {
    // All meals today — guaranteed within any timezone's 7-day window
    const meals = Array.from({ length: 7 }, () => meal(0))
    const score = calculateDietScore(meals)
    expect(score).toBe(100)
  })

  it('deducts 40 for < 3 meals last 7 days', () => {
    const meals = [meal(1)]
    expect(calculateDietScore(meals)).toBe(60)
  })

  it('deducts 20 for 3–6 meals last 7 days', () => {
    const meals = Array.from({ length: 5 }, (_, i) => meal(i))
    expect(calculateDietScore(meals)).toBe(80)
  })

  it('additional deduction for no meals last 30 days', () => {
    // 0 meals → −40 (< 3 last 7) −30 (none last 30) = 30
    expect(calculateDietScore([])).toBe(30)
  })

  it('excludes soft-deleted meals from count', () => {
    const deleted = meal(1, { deleted_at: '2026-04-25T10:00:00Z' })
    // Only deleted meal → score same as no meals
    expect(calculateDietScore([deleted])).toBe(30)
  })

  it('score is clamped to [0, 100]', () => {
    const score = calculateDietScore([])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── generateChecklistItems ───────────────────────────────────────────────────

describe('generateChecklistItems', () => {
  it('returns empty array when profile is complete and healthy', () => {
    const items = generateChecklistItems({
      weightKg: 80,
      waterPerDay: 3000,
      sleepHours: 8,
      sleepQuality: 8,
      activityLevel: 'moderate',
      goal: 'muscle_gain',
      sessionsLast7Days: 4,
      workoutDaysCount: 4,
      mealsLast7Days: 10,
      cardioProfile: {
        practices: true,
        frequency_per_week: 3,
        duration_minutes: 40,
        goal: 'fat_loss',
      } as any,
      bmi: 24,
      bodyFatPercentage: 15,
    })
    expect(items).toHaveLength(0)
  })

  it('adds high-priority item for no workout days configured', () => {
    const items = generateChecklistItems({ workoutDaysCount: 0 })
    const training = items.find((i) => i.category === 'training')
    expect(training).toBeDefined()
    expect(training?.priority).toBe('high')
  })

  it('adds high-priority item for no goal set', () => {
    const items = generateChecklistItems({ goal: null })
    const goalItem = items.find((i) => i.title.toLowerCase().includes('objetivo'))
    expect(goalItem).toBeDefined()
    expect(goalItem?.priority).toBe('high')
  })

  it('adds high-priority item for poor sleep (< 6h)', () => {
    const items = generateChecklistItems({
      sleepHours: 5,
      goal: 'maintenance',
      workoutDaysCount: 3,
      mealsLast7Days: 10,
    })
    const sleep = items.find((i) => i.category === 'sleep')
    expect(sleep?.priority).toBe('high')
  })

  it('adds medium-priority item for borderline sleep (6–7h)', () => {
    const items = generateChecklistItems({ sleepHours: 6.5 })
    const sleep = items.find((i) => i.category === 'sleep')
    expect(sleep?.priority).toBe('medium')
  })

  it('adds item for low sleep quality (≤ 5)', () => {
    const items = generateChecklistItems({ sleepQuality: 4 })
    const sleep = items.find(
      (i) => i.category === 'sleep' && i.title.toLowerCase().includes('qualidade'),
    )
    expect(sleep).toBeDefined()
  })

  it('adds medium-priority hydration item for missing water data', () => {
    const items = generateChecklistItems({ waterPerDay: null })
    const hydration = items.find((i) => i.category === 'hydration')
    expect(hydration).toBeDefined()
  })

  it('adds hydration item when water is far below target', () => {
    // 80kg → target 2800ml; 1000ml is 35% → high priority
    const items = generateChecklistItems({ waterPerDay: 1000, weightKg: 80 })
    const hydration = items.find((i) => i.category === 'hydration')
    expect(hydration).toBeDefined()
    expect(hydration?.priority).toBe('high')
  })

  it('adds low-priority cardio item when profile is missing', () => {
    const items = generateChecklistItems({ cardioProfile: null })
    const cardio = items.find((i) => i.category === 'cardio')
    expect(cardio?.priority).toBe('low')
  })

  it('items are sorted high → medium → low priority', () => {
    const items = generateChecklistItems({
      workoutDaysCount: 0,
      waterPerDay: null,
      cardioProfile: null,
    })
    const priorities = items.map((i) => i.priority)
    const order = { high: 0, medium: 1, low: 2 }
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(order[priorities[i]]).toBeLessThanOrEqual(order[priorities[i + 1]])
    }
  })

  it('each item has a unique id', () => {
    const items = generateChecklistItems({
      workoutDaysCount: 0,
      goal: null,
      sleepHours: 4,
      waterPerDay: null,
      cardioProfile: null,
    })
    const ids = items.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all items start with completed: false', () => {
    const items = generateChecklistItems({
      workoutDaysCount: 0,
      goal: null,
    })
    expect(items.every((i) => i.completed === false)).toBe(true)
  })
})
