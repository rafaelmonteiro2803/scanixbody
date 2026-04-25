import {
  calculateVolume,
  calculateSessionVolume,
  findBestLift,
  detectPR,
  calculateTotalSets,
  groupSessionsByExercise,
  buildProgressionChart,
  calculateWeeklyStreak,
} from '../workout-calculations'

// ─── calculateVolume ──────────────────────────────────────────────────────────

describe('calculateVolume', () => {
  it('sums weight × reps across all sets', () => {
    expect(calculateVolume([
      { set_number: 1, weight: 100, reps: 5 },
      { set_number: 2, weight: 100, reps: 5 },
      { set_number: 3, weight: 95,  reps: 6 },
    ])).toBe(1570)
  })

  it('returns 0 for empty array', () => {
    expect(calculateVolume([])).toBe(0)
  })

  it('treats null weight/reps as 0 without throwing', () => {
    expect(calculateVolume([{ set_number: 1, weight: null, reps: 5 }])).toBe(0)
    expect(calculateVolume([{ set_number: 1, weight: 80, reps: null }])).toBe(0)
  })
})

// ─── calculateSessionVolume ───────────────────────────────────────────────────

describe('calculateSessionVolume', () => {
  it('sums volumes across multiple exercises', () => {
    const exercises = [
      { sets: [{ set_number: 1, weight: 80, reps: 8 }] },           // 640
      { sets: [{ set_number: 1, weight: 60, reps: 10 },             // 600
               { set_number: 2, weight: 60, reps: 10 }] },          // 600
    ]
    expect(calculateSessionVolume(exercises)).toBe(1840)
  })

  it('returns 0 for no exercises', () => {
    expect(calculateSessionVolume([])).toBe(0)
  })
})

// ─── findBestLift ─────────────────────────────────────────────────────────────

describe('findBestLift', () => {
  it('returns null for empty array', () => {
    expect(findBestLift([])).toBeNull()
  })

  it('returns the heaviest set', () => {
    const best = findBestLift([
      { set_number: 1, weight: 100, reps: 5 },
      { set_number: 2, weight: 105, reps: 3 },
      { set_number: 3, weight: 95,  reps: 6 },
    ])
    expect(best?.weight).toBe(105)
  })

  it('uses reps as tiebreaker when weights are equal', () => {
    const best = findBestLift([
      { set_number: 1, weight: 100, reps: 3 },
      { set_number: 2, weight: 100, reps: 8 },
    ])
    expect(best?.reps).toBe(8)
  })

  it('returns single-item array element', () => {
    const set = { set_number: 1, weight: 70, reps: 10 }
    expect(findBestLift([set])).toBe(set)
  })
})

// ─── detectPR ────────────────────────────────────────────────────────────────

describe('detectPR', () => {
  it('is always a PR when there is no previous best', () => {
    expect(detectPR({ set_number: 1, weight: 50, reps: 5 }, null)).toBe(true)
  })

  it('is a PR when weight exceeds previous best', () => {
    expect(detectPR(
      { set_number: 1, weight: 110, reps: 3 },
      { set_number: 1, weight: 105, reps: 5 },
    )).toBe(true)
  })

  it('is a PR when weight is equal but reps exceed previous best', () => {
    expect(detectPR(
      { set_number: 1, weight: 100, reps: 6 },
      { set_number: 1, weight: 100, reps: 5 },
    )).toBe(true)
  })

  it('is NOT a PR when weight is less than previous best', () => {
    expect(detectPR(
      { set_number: 1, weight: 95, reps: 10 },
      { set_number: 1, weight: 100, reps: 5 },
    )).toBe(false)
  })

  it('is NOT a PR when weight and reps are equal to previous best', () => {
    expect(detectPR(
      { set_number: 1, weight: 100, reps: 5 },
      { set_number: 1, weight: 100, reps: 5 },
    )).toBe(false)
  })
})

// ─── calculateTotalSets ───────────────────────────────────────────────────────

describe('calculateTotalSets', () => {
  it('counts sets across all sessions', () => {
    const s1 = [
      { set_number: 1, weight: 100, reps: 5 },
      { set_number: 2, weight: 100, reps: 5 },
      { set_number: 3, weight: 100, reps: 5 },
    ]
    const s2 = [
      { set_number: 1, weight: 80, reps: 8 },
      { set_number: 2, weight: 80, reps: 8 },
    ]
    expect(calculateTotalSets([s1, s2])).toBe(5)
  })

  it('returns 0 for empty sessions array', () => {
    expect(calculateTotalSets([])).toBe(0)
  })
})

// ─── groupSessionsByExercise ──────────────────────────────────────────────────

describe('groupSessionsByExercise', () => {
  const rawData = [
    {
      session_date: '2024-01-08',
      exercise_name: 'Squat',
      sets: [{ set_number: 1, weight: 105, reps: 5 }],
    },
    {
      session_date: '2024-01-01',
      exercise_name: 'Squat',
      sets: [{ set_number: 1, weight: 100, reps: 5 }],
    },
    {
      session_date: '2024-01-01',
      exercise_name: 'Bench Press',
      sets: [{ set_number: 1, weight: 80, reps: 8 }],
    },
  ]

  it('creates one history entry per unique exercise', () => {
    const result = groupSessionsByExercise(rawData)
    expect(result).toHaveLength(2)
    const names = result.map((h) => h.exercise_name).sort()
    expect(names).toEqual(['Bench Press', 'Squat'])
  })

  it('sorts sessions chronologically within each exercise', () => {
    const result = groupSessionsByExercise(rawData)
    const squat = result.find((h) => h.exercise_name === 'Squat')!
    expect(squat.sessions[0].session_date).toBe('2024-01-01')
    expect(squat.sessions[1].session_date).toBe('2024-01-08')
  })

  it('correctly sets best_weight from findBestLift', () => {
    const result = groupSessionsByExercise(rawData)
    const squat = result.find((h) => h.exercise_name === 'Squat')!
    expect(squat.sessions[0].best_weight).toBe(100)
    expect(squat.sessions[1].best_weight).toBe(105)
  })

  it('returns empty array for empty input', () => {
    expect(groupSessionsByExercise([])).toEqual([])
  })
})

// ─── buildProgressionChart ────────────────────────────────────────────────────

describe('buildProgressionChart', () => {
  const history = {
    exercise_name: 'Deadlift',
    sessions: [
      { session_date: '2024-01-01', best_weight: 140, best_reps: 5, total_volume: 700 },
      { session_date: '2024-01-08', best_weight: 150, best_reps: 3, total_volume: 450 },
    ],
  }

  it('produces one data point per session', () => {
    const chart = buildProgressionChart(history)
    expect(chart).toHaveLength(2)
  })

  it('maps session_date to date and best_weight to value', () => {
    const chart = buildProgressionChart(history)
    expect(chart[0]).toMatchObject({ date: '2024-01-01', value: 140 })
    expect(chart[1]).toMatchObject({ date: '2024-01-08', value: 150 })
  })

  it('builds a human-readable label', () => {
    const chart = buildProgressionChart(history)
    expect(chart[0].label).toBe('140 kg × 5 reps')
    expect(chart[1].label).toBe('150 kg × 3 reps')
  })

  it('returns empty array for history with no sessions', () => {
    expect(buildProgressionChart({ exercise_name: 'X', sessions: [] })).toEqual([])
  })
})

// ─── calculateWeeklyStreak ────────────────────────────────────────────────────

describe('calculateWeeklyStreak', () => {
  it('returns 0 when no sessions', () => {
    expect(calculateWeeklyStreak([], '2024-04-20')).toBe(0)
  })

  it('returns 3 for three consecutive weeks', () => {
    // Week of 2024-04-15, 2024-04-08, 2024-04-01
    expect(
      calculateWeeklyStreak(['2024-04-15', '2024-04-08', '2024-04-01'], '2024-04-20'),
    ).toBe(3)
  })

  it('breaks streak on gap', () => {
    // Week of Apr 15 and Apr 01 but NOT Apr 08 → streak = 1 from Apr 15
    expect(
      calculateWeeklyStreak(['2024-04-15', '2024-04-01'], '2024-04-20'),
    ).toBe(1)
  })

  it('multiple sessions in same week count as 1', () => {
    // All three dates fall in the same ISO week
    expect(
      calculateWeeklyStreak(['2024-04-15', '2024-04-16', '2024-04-17'], '2024-04-20'),
    ).toBe(1)
  })

  it('current week with no session breaks streak from prior week', () => {
    // today = 2024-04-24 (no session this week), session last week
    expect(
      calculateWeeklyStreak(['2024-04-15'], '2024-04-24'),
    ).toBe(0)
  })

  it('returns 0 when session date is in a future week relative to today', () => {
    expect(
      calculateWeeklyStreak(['2025-12-15'], '2024-04-20'),
    ).toBe(0)
  })
})
