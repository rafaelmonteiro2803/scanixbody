import {
  calculateBMI,
  classifyBMI,
  calculateBMR,
  calculateTDEE,
  estimateBodyFatPercentage,
  calculateIdealWeight,
  calculateWaistHipRatio,
  classifyWaistHipRatio,
  calculateDailyWater,
} from '../body-calculations'

// ─── calculateBMI ────────────────────────────────────────────────────────────

describe('calculateBMI', () => {
  it('calculates correctly for a typical male', () => {
    expect(calculateBMI(80, 175)).toBeCloseTo(26.12, 1)
  })

  it('calculates correctly for a lighter female', () => {
    expect(calculateBMI(55, 163)).toBeCloseTo(20.69, 1)
  })

  it('rounds to 2 decimal places', () => {
    const bmi = calculateBMI(70, 170)
    expect(Number(bmi.toFixed(2))).toBe(bmi)
  })

  it('throws RangeError for zero weight', () => {
    expect(() => calculateBMI(0, 175)).toThrow(RangeError)
  })

  it('throws RangeError for negative weight', () => {
    expect(() => calculateBMI(-5, 175)).toThrow(RangeError)
  })

  it('throws RangeError for zero height', () => {
    expect(() => calculateBMI(80, 0)).toThrow(RangeError)
  })
})

// ─── classifyBMI ─────────────────────────────────────────────────────────────

describe('classifyBMI', () => {
  it.each([
    [15,   'Abaixo do peso'],
    [18.4, 'Abaixo do peso'],
    [18.5, 'Normal'],
    [22.0, 'Normal'],
    [24.9, 'Normal'],
    [25.0, 'Sobrepeso'],
    [27.0, 'Sobrepeso'],
    [29.9, 'Sobrepeso'],
    [30.0, 'Obesidade Grau I'],
    [34.9, 'Obesidade Grau I'],
    [35.0, 'Obesidade Grau II'],
    [39.9, 'Obesidade Grau II'],
    [40.0, 'Obesidade Grau III'],
    [45.0, 'Obesidade Grau III'],
  ])('BMI %f → %s', (bmi, expected) => {
    expect(classifyBMI(bmi)).toBe(expected)
  })
})

// ─── calculateBMR ─────────────────────────────────────────────────────────────

describe('calculateBMR', () => {
  it('returns a known value for a 30-year-old male, 80kg, 175cm', () => {
    // 88.362 + 13.397*80 + 4.799*175 - 5.677*30 = 88.362+1071.76+839.825-170.31 = 1829.637 ≈ 1830
    expect(calculateBMR(80, 175, 30, 'M')).toBe(1830)
  })

  it('returns a known value for a 25-year-old female, 60kg, 165cm', () => {
    // 447.593 + 9.247*60 + 3.098*165 - 4.33*25 = 447.593+554.82+511.17-108.25 = 1405.333 ≈ 1405
    expect(calculateBMR(60, 165, 25, 'F')).toBe(1405)
  })

  it('returns integer values', () => {
    const result = calculateBMR(80, 175, 30, 'M')
    expect(Number.isInteger(result)).toBe(true)
  })

  it('throws for zero weight', () => {
    expect(() => calculateBMR(0, 175, 30, 'M')).toThrow(RangeError)
  })

  it('throws for zero age', () => {
    expect(() => calculateBMR(80, 175, 0, 'M')).toThrow(RangeError)
  })

  it('males have higher BMR than females at same anthropometrics', () => {
    const male = calculateBMR(80, 175, 30, 'M')
    const female = calculateBMR(80, 175, 30, 'F')
    expect(male).toBeGreaterThan(female)
  })
})

// ─── calculateTDEE ───────────────────────────────────────────────────────────

describe('calculateTDEE', () => {
  it('sedentary multiplier is 1.2', () => {
    expect(calculateTDEE(1000, 'sedentary')).toBe(1200)
  })

  it('moderate multiplier is 1.55', () => {
    expect(calculateTDEE(2000, 'moderate')).toBe(3100)
  })

  it('very_active multiplier is 1.9', () => {
    expect(calculateTDEE(1000, 'very_active')).toBe(1900)
  })

  it('supports legacy alias lightly_active', () => {
    expect(calculateTDEE(1000, 'lightly_active' as never)).toBe(1375)
  })

  it('supports legacy alias moderately_active', () => {
    expect(calculateTDEE(1000, 'moderately_active' as never)).toBe(1550)
  })

  it('supports legacy alias super_active', () => {
    expect(calculateTDEE(1000, 'super_active' as never)).toBe(1900)
  })

  it('throws for zero BMR', () => {
    expect(() => calculateTDEE(0, 'moderate')).toThrow(RangeError)
  })

  it('returns integer values', () => {
    const result = calculateTDEE(1896, 'moderate')
    expect(Number.isInteger(result)).toBe(true)
  })
})

// ─── estimateBodyFatPercentage ───────────────────────────────────────────────

describe('estimateBodyFatPercentage', () => {
  it('males have lower body fat estimate than females at same BMI and age', () => {
    const male = estimateBodyFatPercentage(26, 30, 'M')
    const female = estimateBodyFatPercentage(26, 30, 'F')
    expect(male).toBeLessThan(female)
  })

  it('result is clamped to [3, 60]', () => {
    const low = estimateBodyFatPercentage(5, 10, 'M')
    const high = estimateBodyFatPercentage(60, 80, 'F')
    expect(low).toBeGreaterThanOrEqual(3)
    expect(high).toBeLessThanOrEqual(60)
  })

  it('increases with age (same BMI and sex)', () => {
    const young = estimateBodyFatPercentage(25, 20, 'M')
    const older = estimateBodyFatPercentage(25, 50, 'M')
    expect(older).toBeGreaterThan(young)
  })
})

// ─── calculateIdealWeight ────────────────────────────────────────────────────

describe('calculateIdealWeight', () => {
  it('returns null for height below 152.4cm', () => {
    expect(calculateIdealWeight(150, 'M')).toBeNull()
  })

  it('male at exactly 152.4cm returns base 50.0kg', () => {
    // 0 inches over 5ft → 50.0kg
    expect(calculateIdealWeight(152.4, 'M')).toBeCloseTo(50.0, 0)
  })

  it('female at 163cm returns ~55kg', () => {
    const result = calculateIdealWeight(163, 'F')
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(55.1, 0)
  })

  it('males weigh more than females at same height', () => {
    const m = calculateIdealWeight(175, 'M')
    const f = calculateIdealWeight(175, 'F')
    expect(m!).toBeGreaterThan(f!)
  })
})

// ─── calculateWaistHipRatio ──────────────────────────────────────────────────

describe('calculateWaistHipRatio', () => {
  it('calculates ratio correctly', () => {
    expect(calculateWaistHipRatio(90, 100)).toBeCloseTo(0.9, 2)
  })

  it('throws when hip is zero', () => {
    expect(() => calculateWaistHipRatio(90, 0)).toThrow(RangeError)
  })

  it('throws when waist is zero', () => {
    expect(() => calculateWaistHipRatio(0, 100)).toThrow(RangeError)
  })
})

// ─── classifyWaistHipRatio ───────────────────────────────────────────────────

describe('classifyWaistHipRatio', () => {
  it.each([
    [0.85, 'M', 'Baixo risco'],
    [0.92, 'M', 'Risco moderado'],
    [1.05, 'M', 'Alto risco'],
    [0.75, 'F', 'Baixo risco'],
    [0.82, 'F', 'Risco moderado'],
    [0.95, 'F', 'Alto risco'],
  ])('ratio %f, sex %s → %s', (ratio, sex, expected) => {
    expect(classifyWaistHipRatio(ratio, sex as 'M' | 'F')).toBe(expected)
  })
})

// ─── calculateDailyWater ─────────────────────────────────────────────────────

describe('calculateDailyWater', () => {
  it('returns 35ml × weight, rounded to nearest 50ml', () => {
    expect(calculateDailyWater(80)).toBe(2800)
  })

  it('rounds to nearest 50ml', () => {
    // 35 * 73 = 2555 → rounds to 2550
    expect(calculateDailyWater(73)).toBe(2550)
  })

  it('throws for zero weight', () => {
    expect(() => calculateDailyWater(0)).toThrow(RangeError)
  })

  it('result is always divisible by 50', () => {
    for (const w of [60, 75, 90, 110]) {
      expect(calculateDailyWater(w) % 50).toBe(0)
    }
  })
})
