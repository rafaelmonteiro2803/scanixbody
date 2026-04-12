/**
 * SCANIX BODY – Nutrition & Macro Calculation Functions
 *
 * All functions are pure (no side-effects, no I/O).
 * Macro targets are calculated following evidence-based sports nutrition
 * guidelines (ISSN, ACSM, and Brazilian CFN recommendations).
 *
 * Units:
 *   - Macronutrients → grams (g)
 *   - Energy         → kilocalories (kcal)
 *   - Weight         → kilograms (kg)
 *
 * @module nutrition-calculations
 */

import type {
  MacroSummary,
  MacroTargets,
  MacroPercentages,
  NutritionEvaluation,
} from '@/types/domain.types';
import type { MealsRow } from '@/types/database.types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Caloric density constants (kcal per gram) */
const KCAL_PER_G = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

/**
 * Returns 0 for null / undefined / NaN values.
 * @internal
 */
function safeNum(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return value;
}

/**
 * Rounds a number to a given number of decimal places.
 * @internal
 */
function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamps a value to [min, max].
 * @internal
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Macro summary for a list of meal items
// ---------------------------------------------------------------------------

/**
 * Aggregates macro nutrients from an array of meal-like objects.
 *
 * The function accepts any object that carries optional `calories`,
 * `protein_g`, `carbs_g`, and `fat_g` fields so it can be used with both
 * raw `MealsRow` records and lightweight DTO objects.
 *
 * When `calories` is missing from a meal row the function re-derives it
 * from the macros using standard caloric-density values.
 *
 * @param items - Array of objects with optional macro fields
 * @returns Aggregated `MacroSummary`
 *
 * @example
 * calculateMealMacros([
 *   { calories: 350, protein_g: 30, carbs_g: 40, fat_g: 8 },
 *   { calories: 150, protein_g: 5,  carbs_g: 25, fat_g: 4 },
 * ])
 * // → { calories: 500, protein_g: 35, carbs_g: 65, fat_g: 12 }
 */
export function calculateMealMacros(
  items: Array<{
    calories?: number | null;
    protein_g?: number | null;
    carbs_g?: number | null;
    fat_g?: number | null;
  }>,
): MacroSummary {
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalCalories = 0;

  for (const item of items) {
    const protein = safeNum(item.protein_g);
    const carbs = safeNum(item.carbs_g);
    const fat = safeNum(item.fat_g);

    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;

    // Prefer explicit calorie field; fall back to derived value
    const derivedCalories =
      protein * KCAL_PER_G.protein +
      carbs * KCAL_PER_G.carbs +
      fat * KCAL_PER_G.fat;

    totalCalories +=
      item.calories !== null && item.calories !== undefined
        ? safeNum(item.calories)
        : derivedCalories;
  }

  return {
    calories: Math.round(totalCalories),
    protein_g: round(totalProtein),
    carbs_g: round(totalCarbs),
    fat_g: round(totalFat),
  };
}

// ---------------------------------------------------------------------------
// Daily macro aggregation
// ---------------------------------------------------------------------------

/**
 * Calculates the total macros consumed across all meals for a single day.
 *
 * Soft-deleted meals (`deleted_at !== null`) are excluded from the
 * calculation automatically.
 *
 * @param meals - Array of `MealsRow` records for a given date
 * @returns Aggregated `MacroSummary` for the day
 *
 * @example
 * calculateDailyMacros(mealsForToday) // → { calories: 2100, … }
 */
export function calculateDailyMacros(meals: MealsRow[]): MacroSummary {
  const activeMeals = meals.filter((m) => m.deleted_at === null);
  return calculateMealMacros(activeMeals);
}

// ---------------------------------------------------------------------------
// Macro target estimation
// ---------------------------------------------------------------------------

/**
 * Goal-specific macro distribution ranges (% of total calories).
 * Based on ISSN 2017 guidelines + Brazilian sports dietetics consensus.
 * @internal
 */
const GOAL_MACRO_RATIOS: Record<
  string,
  { protein: number; carbs: number; fat: number }
> = {
  weight_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  muscle_gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  body_recomposition: { protein: 0.35, carbs: 0.40, fat: 0.25 },
  maintenance: { protein: 0.25, carbs: 0.50, fat: 0.25 },
  performance: { protein: 0.25, carbs: 0.55, fat: 0.20 },
  health: { protein: 0.25, carbs: 0.50, fat: 0.25 },
};

/** Fallback ratio when goal is not recognised. */
const DEFAULT_RATIO = GOAL_MACRO_RATIOS['maintenance'];

/**
 * Estimates daily macro targets based on TDEE and the athlete's primary goal.
 *
 * Protein targets are cross-checked against body-weight ranges and adjusted
 * to the higher of the percentage-based or weight-based recommendation.
 *
 * @param tdee          - Total Daily Energy Expenditure in kcal
 * @param goal          - Athlete goal string (e.g. 'muscle_gain', 'weight_loss')
 * @param weightKg      - Optional body weight in kg (improves protein accuracy)
 * @returns `MacroTargets` with gram values for each macro
 *
 * @example
 * estimateMacroTargets(2500, 'muscle_gain', 80)
 * // → { calories: 2500, protein_g: 200, carbs_g: 281, fat_g: 69 }
 */
export function estimateMacroTargets(
  tdee: number,
  goal: string,
  weightKg?: number,
): MacroTargets {
  if (tdee <= 0) throw new RangeError('TDEE must be a positive number');

  const ratios = GOAL_MACRO_RATIOS[goal] ?? DEFAULT_RATIO;

  let proteinG = round((tdee * ratios.protein) / KCAL_PER_G.protein);
  let carbsG = round((tdee * ratios.carbs) / KCAL_PER_G.carbs);
  let fatG = round((tdee * ratios.fat) / KCAL_PER_G.fat);

  // Minimum protein targets (g / kg) by goal
  const minProteinPerKg: Record<string, number> = {
    weight_loss: 2.0,
    muscle_gain: 2.2,
    body_recomposition: 2.4,
    maintenance: 1.6,
    performance: 1.8,
    health: 1.5,
  };

  if (weightKg && weightKg > 0) {
    const minProtein = (minProteinPerKg[goal] ?? 1.6) * weightKg;
    if (minProtein > proteinG) {
      // Redistribute calories from carbs to meet minimum protein
      const extraProteinKcal = (minProtein - proteinG) * KCAL_PER_G.protein;
      proteinG = round(minProtein);
      carbsG = round(
        Math.max(50, carbsG - extraProteinKcal / KCAL_PER_G.carbs),
      );
    }
  }

  // Recompute calories from adjusted macros for consistency
  const adjustedCalories = Math.round(
    proteinG * KCAL_PER_G.protein +
      carbsG * KCAL_PER_G.carbs +
      fatG * KCAL_PER_G.fat,
  );

  return {
    calories: adjustedCalories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    protein_per_kg:
      weightKg && weightKg > 0 ? round(proteinG / weightKg, 2) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Macro percentage breakdown
// ---------------------------------------------------------------------------

/**
 * Converts absolute macro gram values to percentage contributions to total
 * caloric intake.
 *
 * @param macros - `MacroSummary` with gram values
 * @returns `MacroPercentages` where each value represents % of total calories
 *
 * @example
 * calculateMacroPercentages({ calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 56 })
 * // → { protein_pct: 30.0, carbs_pct: 40.0, fat_pct: 25.2 }
 */
export function calculateMacroPercentages(
  macros: MacroSummary,
): MacroPercentages {
  const derivedCalories =
    macros.protein_g * KCAL_PER_G.protein +
    macros.carbs_g * KCAL_PER_G.carbs +
    macros.fat_g * KCAL_PER_G.fat;

  const base = derivedCalories > 0 ? derivedCalories : 1; // avoid division by zero

  return {
    protein_pct: round((macros.protein_g * KCAL_PER_G.protein * 100) / base),
    carbs_pct: round((macros.carbs_g * KCAL_PER_G.carbs * 100) / base),
    fat_pct: round((macros.fat_g * KCAL_PER_G.fat * 100) / base),
  };
}

// ---------------------------------------------------------------------------
// Macro balance evaluation
// ---------------------------------------------------------------------------

/**
 * Acceptable deviation percentage before a macro is flagged.
 * @internal
 */
const MACRO_TOLERANCE_PCT = 0.15; // ±15 %

/** Minimum fat intake for hormonal health (g) */
const MIN_FAT_G = 40;

/**
 * Evaluates how well the athlete's actual macro intake aligns with their
 * personalised targets and produces an actionable `NutritionEvaluation`.
 *
 * @param actual - Actual daily macro intake
 * @param target - Personalised macro targets
 * @returns Structured `NutritionEvaluation` with score, status flags, and
 *          Portuguese-language feedback messages
 *
 * @example
 * evaluateMacroBalance(actualMacros, targetMacros)
 * // → { overall_score: 78, protein_status: 'adequate', … }
 */
export function evaluateMacroBalance(
  actual: MacroSummary,
  target: MacroTargets,
): NutritionEvaluation {
  const feedback: string[] = [];
  let deductions = 0;

  // --- Helper: classify a macro vs its target ---
  function classifyMacro(
    actualG: number,
    targetG: number,
  ): 'low' | 'adequate' | 'high' {
    if (targetG <= 0) return 'adequate';
    const ratio = actualG / targetG;
    if (ratio < 1 - MACRO_TOLERANCE_PCT) return 'low';
    if (ratio > 1 + MACRO_TOLERANCE_PCT) return 'high';
    return 'adequate';
  }

  // --- Calorie evaluation ---
  const calorieRatio = target.calories > 0 ? actual.calories / target.calories : 1;
  let calorieStatus: 'deficit' | 'maintenance' | 'surplus';
  if (calorieRatio < 0.9) {
    calorieStatus = 'deficit';
    deductions += 10;
    feedback.push(
      `Ingestão calórica abaixo do alvo em ${Math.round((1 - calorieRatio) * 100)}% – risco de catabolismo muscular.`,
    );
  } else if (calorieRatio > 1.1) {
    calorieStatus = 'surplus';
    deductions += 8;
    feedback.push(
      `Ingestão calórica acima do alvo em ${Math.round((calorieRatio - 1) * 100)}% – possível acúmulo de gordura.`,
    );
  } else {
    calorieStatus = 'maintenance';
  }

  // --- Protein evaluation ---
  const proteinStatus = classifyMacro(actual.protein_g, target.protein_g);
  if (proteinStatus === 'low') {
    deductions += 20;
    feedback.push(
      `Proteína insuficiente (${actual.protein_g} g vs. alvo de ${target.protein_g} g) – pode comprometer recuperação e hipertrofia.`,
    );
  } else if (proteinStatus === 'high') {
    feedback.push(
      `Proteína acima do alvo (${actual.protein_g} g). Pode ser benéfico em fase de cutting; reavalie se em manutenção.`,
    );
  }

  // --- Carbs evaluation ---
  const carbsStatus = classifyMacro(actual.carbs_g, target.carbs_g);
  if (carbsStatus === 'low') {
    deductions += 10;
    feedback.push(
      `Carboidratos abaixo do alvo (${actual.carbs_g} g vs. ${target.carbs_g} g) – energia para treino pode ser comprometida.`,
    );
  } else if (carbsStatus === 'high') {
    deductions += 5;
    feedback.push(
      `Excesso de carboidratos (${actual.carbs_g} g vs. ${target.carbs_g} g) – monitore o balanço energético.`,
    );
  }

  // --- Fat evaluation ---
  const fatStatus = classifyMacro(actual.fat_g, target.fat_g);
  if (actual.fat_g < MIN_FAT_G) {
    deductions += 15;
    feedback.push(
      `Gordura dietética muito baixa (${actual.fat_g} g) – risco para saúde hormonal. Mínimo recomendado: ${MIN_FAT_G} g/dia.`,
    );
  } else if (fatStatus === 'low') {
    deductions += 5;
    feedback.push(`Gordura dietética abaixo do alvo (${actual.fat_g} g vs. ${target.fat_g} g).`);
  } else if (fatStatus === 'high') {
    deductions += 5;
    feedback.push(
      `Gordura dietética acima do alvo (${actual.fat_g} g vs. ${target.fat_g} g) – avalie fontes de gordura na dieta.`,
    );
  }

  // Positive feedback when no deductions
  if (deductions === 0) {
    feedback.push('Excelente equilíbrio de macronutrientes! Continue assim.');
  }

  const overall_score = clamp(100 - deductions, 0, 100);

  return {
    overall_score,
    protein_status: proteinStatus,
    carbs_status: carbsStatus,
    fat_status: fatStatus,
    calorie_status: calorieStatus,
    feedback,
  };
}
