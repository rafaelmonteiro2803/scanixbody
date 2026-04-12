/**
 * SCANIX BODY – Body Composition & Biometric Calculation Functions
 *
 * All functions are pure (no side-effects, no external dependencies).
 * Input values use SI units unless stated otherwise:
 *   - weight  → kilograms (kg)
 *   - height  → centimetres (cm)
 *   - age     → years (integer)
 *
 * @module body-calculations
 */

import { ActivityLevel, Sex } from '@/types/domain.types';
import type { AthleteProfilesRow } from '@/types/database.types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Clamps a number to a given inclusive range.
 * @internal
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to a given number of decimal places.
 * @internal
 */
function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// BMI
// ---------------------------------------------------------------------------

/**
 * Calculates Body Mass Index (BMI).
 *
 * Formula: weight (kg) / height (m)²
 *
 * @param weight - Body weight in kilograms
 * @param height - Height in centimetres
 * @returns BMI value rounded to two decimal places
 * @throws {RangeError} if weight or height are not positive numbers
 *
 * @example
 * calculateBMI(80, 175) // → 26.12
 */
export function calculateBMI(weight: number, height: number): number {
  if (weight <= 0) throw new RangeError('Weight must be a positive number');
  if (height <= 0) throw new RangeError('Height must be a positive number');

  const heightM = height / 100;
  return round(weight / (heightM * heightM));
}

/**
 * Classifies a BMI value according to the WHO / Brazilian Ministry of Health
 * standard cut-offs used in clinical practice.
 *
 * @param bmi - BMI value (≥ 0)
 * @returns Human-readable Portuguese classification string
 *
 * @example
 * classifyBMI(17.5)  // → 'Abaixo do peso'
 * classifyBMI(22.0)  // → 'Normal'
 * classifyBMI(27.0)  // → 'Sobrepeso'
 * classifyBMI(33.0)  // → 'Obesidade Grau I'
 * classifyBMI(37.5)  // → 'Obesidade Grau II'
 * classifyBMI(42.0)  // → 'Obesidade Grau III'
 */
export function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Sobrepeso';
  if (bmi < 35.0) return 'Obesidade Grau I';
  if (bmi < 40.0) return 'Obesidade Grau II';
  return 'Obesidade Grau III';
}

// ---------------------------------------------------------------------------
// Basal Metabolic Rate (BMR)
// ---------------------------------------------------------------------------

/**
 * Calculates Basal Metabolic Rate (BMR) using the revised Harris-Benedict
 * equation (Roza & Shizgal, 1984).
 *
 * Men:   88.362 + (13.397 × kg) + (4.799 × cm) − (5.677 × age)
 * Women: 447.593 + (9.247 × kg) + (3.098 × cm) − (4.330 × age)
 *
 * @param weight       - Body weight in kilograms
 * @param height       - Height in centimetres
 * @param age          - Age in years
 * @param sex          - Biological sex ('M' | 'F')
 * @returns BMR in kcal/day, rounded to the nearest integer
 *
 * @example
 * calculateBMR(80, 175, 30, 'M') // → 1_896
 * calculateBMR(60, 165, 25, 'F') // → 1_428
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  sex: Sex,
): number {
  if (weight <= 0) throw new RangeError('Weight must be a positive number');
  if (height <= 0) throw new RangeError('Height must be a positive number');
  if (age <= 0) throw new RangeError('Age must be a positive number');

  let bmr: number;

  if (sex === Sex.MALE) {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }

  return Math.round(bmr);
}

// ---------------------------------------------------------------------------
// Total Daily Energy Expenditure (TDEE)
// ---------------------------------------------------------------------------

/**
 * Activity multipliers for the Mifflin–St Jeor / Harris-Benedict TDEE model.
 * @internal
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE) by applying an activity
 * multiplier to the BMR.
 *
 * @param bmr           - Basal Metabolic Rate in kcal/day
 * @param activityLevel - Self-reported physical activity level
 * @returns TDEE in kcal/day, rounded to the nearest integer
 *
 * @example
 * calculateTDEE(1_896, 'moderate') // → 2_939
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (bmr <= 0) throw new RangeError('BMR must be a positive number');
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

// ---------------------------------------------------------------------------
// Body-fat estimation
// ---------------------------------------------------------------------------

/**
 * Estimates body-fat percentage from BMI, age, and sex using the
 * Deurenberg et al. (1991) regression formula:
 *
 * BF% = (1.20 × BMI) + (0.23 × age) − (10.8 × sexFactor) − 5.4
 *   where sexFactor = 1 for male, 0 for female
 *
 * This is an approximation; direct bioimpedance or DEXA measurements
 * should be preferred when available.
 *
 * @param bmi - Body Mass Index
 * @param age - Age in years
 * @param sex - Biological sex ('M' | 'F')
 * @returns Estimated body-fat percentage (0–60), rounded to one decimal place
 *
 * @example
 * estimateBodyFatPercentage(26.12, 30, 'M') // → 19.8
 */
export function estimateBodyFatPercentage(
  bmi: number,
  age: number,
  sex: Sex,
): number {
  const sexFactor = sex === Sex.MALE ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4;
  return round(clamp(bf, 3, 60), 1);
}

// ---------------------------------------------------------------------------
// Ideal weight (Devine formula)
// ---------------------------------------------------------------------------

/**
 * Calculates ideal body weight using the Devine formula (1974):
 *
 * Men:   50.0 kg + 2.3 kg per inch over 5 ft
 * Women: 45.5 kg + 2.3 kg per inch over 5 ft
 *
 * Height is accepted in centimetres and converted internally.
 *
 * @param height - Height in centimetres
 * @param sex    - Biological sex ('M' | 'F')
 * @returns Ideal weight in kilograms, rounded to one decimal place.
 *          Returns `null` if height is below 152.4 cm (5 ft) since the
 *          formula is undefined below that threshold.
 *
 * @example
 * calculateIdealWeight(175, 'M') // → 70.5
 * calculateIdealWeight(163, 'F') // → 56.2
 */
export function calculateIdealWeight(height: number, sex: Sex): number | null {
  const HEIGHT_5FT_CM = 152.4;
  if (height < HEIGHT_5FT_CM) return null;

  const inchesOver5Ft = (height - HEIGHT_5FT_CM) / 2.54;
  const base = sex === Sex.MALE ? 50.0 : 45.5;
  const ideal = base + 2.3 * inchesOver5Ft;
  return round(ideal, 1);
}

// ---------------------------------------------------------------------------
// Waist-to-hip ratio
// ---------------------------------------------------------------------------

/**
 * Calculates the waist-to-hip ratio (WHR).
 *
 * @param waist - Waist circumference in centimetres
 * @param hip   - Hip circumference in centimetres
 * @returns WHR rounded to two decimal places
 * @throws {RangeError} if hip circumference is zero or negative
 *
 * @example
 * calculateWaistHipRatio(90, 100) // → 0.90
 */
export function calculateWaistHipRatio(waist: number, hip: number): number {
  if (hip <= 0) throw new RangeError('Hip circumference must be a positive number');
  if (waist <= 0) throw new RangeError('Waist circumference must be a positive number');
  return round(waist / hip);
}

/**
 * Classifies waist-to-hip ratio according to WHO cardiovascular-risk
 * cut-offs:
 *
 * | Sex    | Low risk  | Moderate risk | High risk |
 * |--------|-----------|---------------|-----------|
 * | Male   | < 0.90    | 0.90 – 0.99   | ≥ 1.00    |
 * | Female | < 0.80    | 0.80 – 0.84   | ≥ 0.85    |
 *
 * @param ratio - Waist-to-hip ratio
 * @param sex   - Biological sex ('M' | 'F')
 * @returns Risk classification string in Portuguese
 *
 * @example
 * classifyWaistHipRatio(0.88, 'M') // → 'Baixo risco'
 * classifyWaistHipRatio(0.95, 'F') // → 'Alto risco'
 */
export function classifyWaistHipRatio(ratio: number, sex: Sex): string {
  if (sex === Sex.MALE) {
    if (ratio < 0.9) return 'Baixo risco';
    if (ratio < 1.0) return 'Risco moderado';
    return 'Alto risco';
  } else {
    if (ratio < 0.8) return 'Baixo risco';
    if (ratio < 0.85) return 'Risco moderado';
    return 'Alto risco';
  }
}

// ---------------------------------------------------------------------------
// Daily water intake recommendation
// ---------------------------------------------------------------------------

/**
 * Estimates minimum daily water intake based on body weight.
 *
 * Formula: 35 ml × body weight (kg)
 *
 * This is the baseline recommendation; athletes or individuals in hot
 * climates may require considerably more.
 *
 * @param weight - Body weight in kilograms
 * @returns Recommended water intake in millilitres (rounded to nearest 50 ml)
 *
 * @example
 * calculateDailyWater(80) // → 2800
 */
export function calculateDailyWater(weight: number): number {
  if (weight <= 0) throw new RangeError('Weight must be a positive number');
  const ml = 35 * weight;
  return Math.round(ml / 50) * 50;
}

// ---------------------------------------------------------------------------
// Narrative body-state reader
// ---------------------------------------------------------------------------

/**
 * Produces a concise narrative description of the athlete's current body
 * composition state for display in dashboards and AI reports.
 *
 * @param profile - Full athlete profile row (nullable fields allowed)
 * @returns Multi-sentence narrative string in Portuguese
 *
 * @example
 * readBodyState(profile)
 * // → "Perfil masculino, 30 anos, 80 kg e 175 cm (IMC 26,1 – Sobrepeso). …"
 */
export function readBodyState(profile: AthleteProfilesRow): string {
  const parts: string[] = [];

  // --- Identity ---
  if (profile.sex !== null || profile.age !== null) {
    const sexLabel = profile.sex === 'M' ? 'masculino' : profile.sex === 'F' ? 'feminino' : null;
    const ageLabel = profile.age !== null ? `${profile.age} anos` : null;
    const intro = [sexLabel, ageLabel].filter(Boolean).join(', ');
    if (intro) parts.push(`Perfil ${intro}.`);
  }

  // --- Anthropometrics ---
  if (profile.weight !== null && profile.height !== null) {
    const bmi = profile.bmi ?? calculateBMI(profile.weight, profile.height);
    const bmiClass = classifyBMI(bmi);
    parts.push(
      `Peso ${profile.weight} kg, altura ${profile.height} cm (IMC ${round(bmi, 1)} – ${bmiClass}).`,
    );
  } else if (profile.weight !== null) {
    parts.push(`Peso ${profile.weight} kg.`);
  }

  // --- Body composition ---
  const compItems: string[] = [];
  if (profile.body_fat_percentage !== null)
    compItems.push(`gordura corporal de ${profile.body_fat_percentage}%`);
  if (profile.skeletal_muscle_mass !== null)
    compItems.push(`massa muscular esquelética de ${profile.skeletal_muscle_mass} kg`);
  if (profile.body_water !== null)
    compItems.push(`água corporal de ${profile.body_water}%`);
  if (compItems.length > 0) {
    parts.push(`Composição corporal: ${compItems.join(', ')}.`);
  }

  // --- Visceral fat & inbody score ---
  if (profile.visceral_fat !== null) {
    const riskLabel =
      profile.visceral_fat <= 9
        ? 'dentro do limite saudável'
        : profile.visceral_fat <= 14
          ? 'em nível de atenção'
          : 'em nível elevado (risco metabólico)';
    parts.push(`Gordura visceral ${profile.visceral_fat} – ${riskLabel}.`);
  }
  if (profile.inbody_score !== null) {
    parts.push(`Pontuação InBody: ${profile.inbody_score}/100.`);
  }

  // --- Metabolic ---
  if (profile.bmr !== null) {
    parts.push(`Taxa metabólica basal: ${profile.bmr} kcal/dia.`);
  }
  if (profile.tdee !== null) {
    parts.push(`Gasto energético total estimado: ${profile.tdee} kcal/dia.`);
  }

  // --- Lifestyle ---
  if (profile.sleep_hours !== null) {
    const sleepLabel =
      profile.sleep_hours >= 7 && profile.sleep_hours <= 9 ? 'adequado' : 'fora da faixa ideal';
    parts.push(`Sono: ${profile.sleep_hours} horas/noite (${sleepLabel}).`);
  }
  if (profile.water_per_day !== null) {
    parts.push(`Ingestão hídrica diária: ${profile.water_per_day} ml.`);
  }

  // --- Goal ---
  if (profile.goal !== null) {
    parts.push(`Objetivo declarado: ${profile.goal}.`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Perfil sem dados suficientes para descrição.';
}
