/**
 * SCANIX BODY – AI Scoring & Checklist Functions
 *
 * All functions are pure (no side-effects, no I/O).
 * They produce numeric scores in the 0–100 range and actionable checklist
 * items for the athlete dashboard and AI analysis report generation.
 *
 * Scoring philosophy:
 *   - Each dimension starts at 100 and loses points for identified deficits.
 *   - Points are capped at 0 (cannot go negative).
 *   - The overall score is a weighted average of all dimension scores.
 *
 * @module ai-scoring
 */

import { calculateDailyWater } from '@/domain/body-calculations';
import type { ChecklistItem, ScoreBreakdown, MacroTargets } from '@/types/domain.types';
import type {
  WorkoutSessionsRow,
  WorkoutDaysRow,
  MealsRow,
  CardioProfilesRow,
} from '@/types/database.types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Clamps a score to the [0, 100] range.
 * @internal
 */
function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Returns zero for null / undefined / NaN values.
 * @internal
 */
function safeNum(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return value;
}

/**
 * Counts sessions in the last N calendar days (inclusive of today).
 * @internal
 */
function sessionsInLastDays(
  sessions: WorkoutSessionsRow[],
  days: number,
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  return sessions.filter((s) => {
    if (s.deleted_at !== null) return false;
    const d = new Date(s.session_date);
    return d >= cutoff;
  }).length;
}

/**
 * Counts meals logged in the last N calendar days.
 * @internal
 */
function mealsInLastDays(meals: MealsRow[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  return meals.filter((m) => {
    if (m.deleted_at !== null) return false;
    const d = new Date(m.meal_date);
    return d >= cutoff;
  }).length;
}

// ---------------------------------------------------------------------------
// Training score
// ---------------------------------------------------------------------------

/**
 * Calculates a training consistency and program completeness score (0–100).
 *
 * Scoring criteria:
 * - Base score starts at 100
 * - No sessions in the last 7 days  → −40
 * - 1 session in the last 7 days    → −20
 * - No workout days configured      → −30
 * - Fewer than 2 workout days        → −15
 * - No sessions in the last 30 days → −20 (applied on top of weekly deficit)
 *
 * @param sessions    - All workout session records for the athlete
 * @param workoutDays - All workout day templates for the athlete
 * @returns Training score 0–100
 *
 * @example
 * calculateTrainingScore(sessions, workoutDays) // → 85
 */
export function calculateTrainingScore(
  sessions: WorkoutSessionsRow[],
  workoutDays: WorkoutDaysRow[],
): number {
  let score = 100;

  const activeDays = workoutDays.filter((d) => d.deleted_at === null).length;
  const sessionsLast7 = sessionsInLastDays(sessions, 7);
  const sessionsLast30 = sessionsInLastDays(sessions, 30);

  // Program structure
  if (activeDays === 0) {
    score -= 30;
  } else if (activeDays < 2) {
    score -= 15;
  }

  // Weekly consistency
  if (sessionsLast7 === 0) {
    score -= 40;
  } else if (sessionsLast7 === 1) {
    score -= 20;
  } else if (sessionsLast7 === 2) {
    score -= 10;
  }
  // 3+ sessions/week → no penalty

  // Monthly recency (stale account)
  if (sessionsLast30 === 0) {
    score -= 20;
  }

  return clampScore(score);
}

// ---------------------------------------------------------------------------
// Diet score
// ---------------------------------------------------------------------------

/**
 * Calculates a dietary adherence and quality score (0–100).
 *
 * Scoring criteria:
 * - Base score starts at 100
 * - Fewer than 3 meals logged in the last 7 days  → −40
 * - Fewer than 7 meals logged in the last 7 days  → −20
 * - Average daily protein below 1.5 g/kg           → −20
 * - Total average calories below 50% of target     → −20
 * - No meal logging at all in the last 30 days     → −30
 *
 * @param meals   - All meal records for the athlete
 * @param targets - Optional macro targets for the athlete; improves accuracy
 * @param weightKg - Optional body weight for protein-per-kg evaluation
 * @returns Diet score 0–100
 *
 * @example
 * calculateDietScore(meals, macroTargets, 80) // → 72
 */
export function calculateDietScore(
  meals: MealsRow[],
  targets?: MacroTargets,
  weightKg?: number,
): number {
  let score = 100;

  const mealsLast7 = mealsInLastDays(meals, 7);
  const mealsLast30 = mealsInLastDays(meals, 30);

  // Logging frequency
  if (mealsLast7 < 3) {
    score -= 40;
  } else if (mealsLast7 < 7) {
    score -= 20;
  }

  if (mealsLast30 === 0) {
    score -= 30;
    return clampScore(score); // no more data to evaluate
  }

  // Protein adequacy (rough weekly average)
  if (weightKg && weightKg > 0 && mealsLast7 > 0) {
    const activeMeals = meals.filter(
      (m) => m.deleted_at === null && m.protein_g !== null,
    );
    const mealsWithProtein = activeMeals.filter((m) => {
      const d = new Date(m.meal_date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6);
      cutoff.setHours(0, 0, 0, 0);
      return d >= cutoff;
    });

    if (mealsWithProtein.length > 0) {
      const totalProtein = mealsWithProtein.reduce(
        (sum, m) => sum + safeNum(m.protein_g),
        0,
      );
      // Estimate average daily protein across 7 days
      const avgDailyProtein = totalProtein / 7;
      const minProtein = weightKg * 1.5;

      if (avgDailyProtein < minProtein) {
        score -= 20;
      }
    }
  }

  // Calorie adequacy vs. target
  if (targets && targets.calories > 0 && mealsLast7 > 0) {
    const activeMeals = meals.filter((m) => m.deleted_at === null);
    const recentMeals = activeMeals.filter((m) => {
      const d = new Date(m.meal_date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6);
      cutoff.setHours(0, 0, 0, 0);
      return d >= cutoff;
    });

    if (recentMeals.length > 0) {
      const totalCalories = recentMeals.reduce(
        (sum, m) => sum + safeNum(m.calories),
        0,
      );
      const avgDailyCalories = totalCalories / 7;

      if (avgDailyCalories < targets.calories * 0.5) {
        score -= 20;
      }
    }
  }

  return clampScore(score);
}

// ---------------------------------------------------------------------------
// Sleep score
// ---------------------------------------------------------------------------

/**
 * Calculates a sleep quality score (0–100).
 *
 * Optimal range: 7–9 hours/night, quality ≥ 7/10.
 *
 * Scoring criteria:
 * - sleep_hours < 5  → −50
 * - sleep_hours < 6  → −30
 * - sleep_hours < 7  → −15
 * - sleep_hours > 9  → −5 (oversleeping – mild penalty)
 * - quality ≤ 4/10   → −25
 * - quality 5–6/10   → −15
 * - quality not provided → −10
 *
 * @param sleepHours   - Average hours of sleep per night (can be fractional)
 * @param sleepQuality - Self-reported quality on 1–10 scale, or null
 * @returns Sleep score 0–100
 *
 * @example
 * calculateSleepScore(7.5, 8) // → 100
 * calculateSleepScore(5.5, 4) // → 25
 */
export function calculateSleepScore(
  sleepHours: number | null,
  sleepQuality: number | null,
): number {
  let score = 100;

  // Duration penalty
  if (sleepHours === null) {
    score -= 20;
  } else if (sleepHours < 5) {
    score -= 50;
  } else if (sleepHours < 6) {
    score -= 30;
  } else if (sleepHours < 7) {
    score -= 15;
  } else if (sleepHours > 9) {
    score -= 5;
  }

  // Quality penalty
  if (sleepQuality === null) {
    score -= 10;
  } else if (sleepQuality <= 4) {
    score -= 25;
  } else if (sleepQuality <= 6) {
    score -= 15;
  }
  // Quality ≥ 7 → no penalty

  return clampScore(score);
}

// ---------------------------------------------------------------------------
// Hydration score
// ---------------------------------------------------------------------------

/**
 * Calculates a hydration adequacy score (0–100).
 *
 * Target: 35 ml/kg/day (calculated via `calculateDailyWater`).
 *
 * Scoring criteria (based on % of recommended intake):
 * - < 40%  → −60
 * - < 60%  → −40
 * - < 75%  → −25
 * - < 90%  → −10
 * - ≥ 90%  → no penalty
 * - Water intake not provided → −30
 *
 * @param waterPerDay - Actual daily water intake in millilitres
 * @param weight      - Body weight in kilograms (used to derive target)
 * @returns Hydration score 0–100
 *
 * @example
 * calculateHydrationScore(2500, 80) // → 90
 */
export function calculateHydrationScore(
  waterPerDay: number | null,
  weight: number | null,
): number {
  let score = 100;

  if (waterPerDay === null) {
    return clampScore(score - 30);
  }

  if (weight === null || weight <= 0) {
    // Use a generic 2000 ml baseline when weight is unknown
    const ratio = waterPerDay / 2000;
    if (ratio < 0.5) score -= 40;
    else if (ratio < 0.75) score -= 20;
    return clampScore(score);
  }

  const target = calculateDailyWater(weight);
  const ratio = waterPerDay / target;

  if (ratio < 0.4) {
    score -= 60;
  } else if (ratio < 0.6) {
    score -= 40;
  } else if (ratio < 0.75) {
    score -= 25;
  } else if (ratio < 0.9) {
    score -= 10;
  }

  return clampScore(score);
}

// ---------------------------------------------------------------------------
// Cardio score
// ---------------------------------------------------------------------------

/**
 * Calculates a cardiovascular activity score (0–100).
 *
 * If the athlete does not practice cardio the score reflects
 * the absence of cardiovascular work (not catastrophic, but penalised).
 *
 * Scoring criteria (when `practices === true`):
 * - frequency_per_week ≥ 3 and duration ≥ 30 min → optimal
 * - frequency_per_week < 2  → −20
 * - duration < 20 min       → −15
 * - intensity = 'high' with no duration → −5 (data incomplete)
 * - goal not set            → −5
 *
 * When `practices === false`:
 * - score = 50 (cardio is beneficial but not mandatory)
 *
 * @param cardioProfile - Cardio profile record, or `null` if not configured
 * @returns Cardio score 0–100
 *
 * @example
 * calculateCardioScore(cardioProfile) // → 80
 */
export function calculateCardioScore(
  cardioProfile: CardioProfilesRow | null,
): number {
  if (cardioProfile === null) return 40; // no data at all

  if (!cardioProfile.practices) return 50;

  let score = 100;

  const freq = safeNum(cardioProfile.frequency_per_week);
  const duration = safeNum(cardioProfile.duration_minutes);

  if (freq < 2) {
    score -= 20;
  }

  if (duration === 0) {
    score -= 15;
  } else if (duration < 20) {
    score -= 10;
  }

  if (!cardioProfile.goal) {
    score -= 5;
  }

  return clampScore(score);
}

// ---------------------------------------------------------------------------
// Overall score
// ---------------------------------------------------------------------------

/**
 * Calculates an overall wellness score as a weighted average of individual
 * dimension scores.
 *
 * Weights:
 * - Training  30 %
 * - Diet      30 %
 * - Sleep     20 %
 * - Hydration 10 %
 * - Cardio    10 %
 *
 * @param scores - Object containing individual dimension scores
 * @returns Overall score 0–100
 *
 * @example
 * calculateOverallScore({
 *   training: 90, diet: 75, sleep: 85, hydration: 70, cardio: 60
 * }) // → 80
 */
export function calculateOverallScore(
  scores: Omit<ScoreBreakdown, 'overall'>,
): number {
  const weighted =
    scores.training * 0.3 +
    scores.diet * 0.3 +
    scores.sleep * 0.2 +
    scores.hydration * 0.1 +
    scores.cardio * 0.1;

  return clampScore(weighted);
}

// ---------------------------------------------------------------------------
// Checklist generator
// ---------------------------------------------------------------------------

/** Data shape consumed by the checklist generator */
export interface ChecklistUserData {
  weightKg?: number | null;
  waterPerDay?: number | null;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  activityLevel?: string | null;
  goal?: string | null;
  sessionsLast7Days?: number;
  workoutDaysCount?: number;
  mealsLast7Days?: number;
  cardioProfile?: CardioProfilesRow | null;
  bodyFatPercentage?: number | null;
  bmi?: number | null;
  scores?: Partial<ScoreBreakdown>;
}

/**
 * Generates a personalised checklist of actionable items based on the
 * athlete's current data profile.
 *
 * Each item is categorised, assigned a priority, and starts in an
 * uncompleted state so the UI can track completion.
 *
 * @param userData - Current state of the athlete's profile data
 * @returns Array of `ChecklistItem` objects sorted by priority (high → low)
 *
 * @example
 * generateChecklistItems({ sleepHours: 5, waterPerDay: 1000, weightKg: 80 })
 * // → [{ category: 'sleep', priority: 'high', title: 'Melhore seu sono', … }, …]
 */
export function generateChecklistItems(
  userData: ChecklistUserData,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let idCounter = 0;

  /** Pushes a new checklist item */
  function addItem(
    category: ChecklistItem['category'],
    title: string,
    description: string,
    priority: ChecklistItem['priority'],
  ): void {
    idCounter += 1;
    items.push({
      id: `checklist-${idCounter}`,
      category,
      title,
      description,
      priority,
      completed: false,
    });
  }

  // --- Training ---
  const sessionsLast7 = userData.sessionsLast7Days ?? 0;
  const workoutDays = userData.workoutDaysCount ?? 0;

  if (workoutDays === 0) {
    addItem(
      'training',
      'Configure seu programa de treino',
      'Crie ao menos um dia de treino com exercícios para que possamos monitorar sua evolução.',
      'high',
    );
  } else if (sessionsLast7 === 0) {
    addItem(
      'training',
      'Registre sua sessão de treino',
      'Nenhum treino registrado nos últimos 7 dias. Volte à academia e registre sua sessão!',
      'high',
    );
  } else if (sessionsLast7 < 3) {
    addItem(
      'training',
      'Aumente a frequência de treino',
      `Você treinou ${sessionsLast7}x nos últimos 7 dias. Tente atingir pelo menos 3 sessões por semana.`,
      'medium',
    );
  }

  // --- Diet ---
  const mealsLast7 = userData.mealsLast7Days ?? 0;
  if (mealsLast7 < 7) {
    addItem(
      'diet',
      'Registre suas refeições diariamente',
      'O registro alimentar consistente é fundamental para monitorar macros e ajustar a dieta.',
      mealsLast7 < 3 ? 'high' : 'medium',
    );
  }

  if (!userData.goal) {
    addItem(
      'general',
      'Defina seu objetivo principal',
      'Sem um objetivo definido, não conseguimos calcular alvos de macros e calorias personalizados.',
      'high',
    );
  }

  // --- Sleep ---
  const sleepHours = userData.sleepHours;
  if (sleepHours === null || sleepHours === undefined) {
    addItem(
      'sleep',
      'Informe suas horas de sono',
      'Registre quantas horas você dorme por noite para recebermos recomendações de recuperação.',
      'medium',
    );
  } else if (sleepHours < 6) {
    addItem(
      'sleep',
      'Priorize o sono de qualidade',
      `Você está dormindo apenas ${sleepHours} horas por noite. O mínimo recomendado é 7 horas para recuperação muscular adequada.`,
      'high',
    );
  } else if (sleepHours < 7) {
    addItem(
      'sleep',
      'Melhore a duração do sono',
      `Tente chegar a pelo menos 7 horas de sono. Atualmente você registra ${sleepHours} horas.`,
      'medium',
    );
  }

  const sleepQuality = userData.sleepQuality;
  if (
    sleepQuality !== null &&
    sleepQuality !== undefined &&
    sleepQuality <= 5
  ) {
    addItem(
      'sleep',
      'Trabalhe a qualidade do sono',
      'Qualidade do sono abaixo de 6/10. Considere higiene do sono: evite telas antes de dormir, mantenha horários regulares.',
      sleepQuality <= 3 ? 'high' : 'medium',
    );
  }

  // --- Hydration ---
  const water = userData.waterPerDay;
  const weight = userData.weightKg;
  if (water === null || water === undefined) {
    addItem(
      'hydration',
      'Registre sua ingestão hídrica',
      'Informe quantos ml de água você bebe por dia para recebermos recomendações de hidratação.',
      'medium',
    );
  } else if (weight && weight > 0) {
    const target = calculateDailyWater(weight);
    if (water < target * 0.7) {
      addItem(
        'hydration',
        'Aumente sua ingestão de água',
        `Você bebe ${water} ml/dia. O alvo recomendado para seu peso é ${target} ml/dia. A desidratação prejudica performance e recuperação.`,
        water < target * 0.5 ? 'high' : 'medium',
      );
    }
  }

  // --- Cardio ---
  const cardio = userData.cardioProfile;
  if (cardio === null || cardio === undefined) {
    addItem(
      'cardio',
      'Configure seu perfil de cardio',
      'Adicione informações sobre sua atividade cardiovascular para completarmos sua análise.',
      'low',
    );
  } else if (cardio.practices && (cardio.frequency_per_week ?? 0) < 2) {
    addItem(
      'cardio',
      'Aumente a frequência do cardio',
      `Você pratica cardio menos de 2x por semana. Para saúde cardiovascular, o ideal é ao menos 150 min de atividade moderada por semana.`,
      'medium',
    );
  }

  // --- Body composition ---
  if (
    userData.bmi !== null &&
    userData.bmi !== undefined &&
    userData.bmi >= 30
  ) {
    addItem(
      'general',
      'Acompanhe sua composição corporal',
      'Seu IMC indica sobrepeso/obesidade. Considere realizar uma bioimpedância periódica e consultar um profissional de saúde.',
      'high',
    );
  }

  if (userData.bodyFatPercentage !== null && userData.bodyFatPercentage !== undefined) {
    const sex = null; // not available in this context
    // Generic high body fat alert (above 30% is a widely cited threshold)
    if (userData.bodyFatPercentage > 30) {
      void sex; // suppress unused variable warning
      addItem(
        'general',
        'Reduza o percentual de gordura',
        `Seu percentual de gordura corporal (${userData.bodyFatPercentage}%) está acima do recomendado. Combine déficit calórico moderado com treino resistido.`,
        'medium',
      );
    }
  }

  // --- Score-based items ---
  const scores = userData.scores ?? {};
  if (scores.overall !== undefined && scores.overall < 50) {
    addItem(
      'general',
      'Revise sua rotina geral',
      `Seu score geral está em ${scores.overall}/100. Foque nas áreas com pontuação mais baixa para evoluir rapidamente.`,
      'high',
    );
  }

  // Sort: high → medium → low
  const priorityOrder: Record<ChecklistItem['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return items.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
}
