/**
 * SCANIX BODY - Supabase Database Type Definitions
 *
 * Auto-aligned with the Supabase schema. Every table, view, and
 * relationship is typed here so that the Supabase JS client is
 * fully type-safe throughout the application.
 *
 * Convention:
 *   Row    – the shape returned by SELECT queries
 *   Insert – required + optional columns when INSERTing a row
 *   Update – all columns optional (used in UPDATE calls)
 */

// ---------------------------------------------------------------------------
// Shared primitive aliases
// ---------------------------------------------------------------------------

/** ISO 8601 datetime string, e.g. "2024-01-15T10:30:00.000Z" */
export type ISODateTimeString = string;

/** ISO 8601 date string, e.g. "2024-01-15" */
export type ISODateString = string;

/** Postgres UUID string */
export type UUID = string;

/** Arbitrary JSON object stored in a JSONB column */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// ---------------------------------------------------------------------------
// Enum literals (mirrored as TypeScript union types)
// ---------------------------------------------------------------------------

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'coach'
  | 'operator'
  | 'usuario_final';

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'first_access';

export type Sex = 'M' | 'F';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type BodySegment =
  | 'right_arm'
  | 'left_arm'
  | 'trunk'
  | 'right_leg'
  | 'left_leg';

export type CardioIntensity = 'low' | 'moderate' | 'high';

export type MealSource = 'manual' | 'ai' | 'import';

export type BioimpedanceStatus =
  | 'pending'
  | 'reviewed'
  | 'confirmed'
  | 'error';

export type MedicationCategory =
  | 'hormonio'
  | 'peptideo'
  | 'suplemento'
  | 'medicamento'
  | 'sarm'
  | 'outro';

export type MedicationSource = 'manual' | 'import';

export type ExamReportSource = 'file' | 'text';

export type ExamMarkerStatus = 'normal' | 'alto' | 'baixo' | 'critico';

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------

// ── users ───────────────────────────────────────────────────────────────────

export interface UsersRow {
  id: UUID;
  email: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface UsersInsert {
  id?: UUID;
  email: string;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface UsersUpdate {
  id?: UUID;
  email?: string;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── profiles ────────────────────────────────────────────────────────────────

export interface ProfilesRow {
  id: UUID;
  user_id: UUID;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface ProfilesInsert {
  id?: UUID;
  user_id: UUID;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  status?: UserStatus;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface ProfilesUpdate {
  id?: UUID;
  user_id?: UUID;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  status?: UserStatus;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── roles ────────────────────────────────────────────────────────────────────

export interface RolesRow {
  id: UUID;
  name: string;
  description: string | null;
  permissions: Json;
}

export interface RolesInsert {
  id?: UUID;
  name: string;
  description?: string | null;
  permissions?: Json;
}

export interface RolesUpdate {
  id?: UUID;
  name?: string;
  description?: string | null;
  permissions?: Json;
}

// ── audit_logs ───────────────────────────────────────────────────────────────

export interface AuditLogsRow {
  id: UUID;
  user_id: UUID | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: ISODateTimeString;
}

export interface AuditLogsInsert {
  id?: UUID;
  user_id?: UUID | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  metadata?: Json | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: ISODateTimeString;
}

export interface AuditLogsUpdate {
  id?: UUID;
  user_id?: UUID | null;
  action?: string;
  resource?: string;
  resource_id?: string | null;
  metadata?: Json | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: ISODateTimeString;
}

// ── athlete_profiles ─────────────────────────────────────────────────────────

export interface AthleteProfilesRow {
  id: UUID;
  user_id: UUID;
  weight: number | null;
  height: number | null;
  age: number | null;
  sex: Sex | null;
  body_fat_percentage: number | null;
  fat_mass: number | null;
  skeletal_muscle_mass: number | null;
  lean_mass: number | null;
  body_water: number | null;
  protein_mass: number | null;
  minerals_mass: number | null;
  bmi: number | null;
  bmr: number | null;
  visceral_fat: number | null;
  waist_hip_ratio: number | null;
  obesity_grade: string | null;
  inbody_score: number | null;
  ideal_weight: number | null;
  goal: string | null;
  activity_level: ActivityLevel | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_per_day: number | null;
  notes: string | null;
  tdee: number | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface AthleteProfilesInsert {
  id?: UUID;
  user_id: UUID;
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  sex?: Sex | null;
  body_fat_percentage?: number | null;
  fat_mass?: number | null;
  skeletal_muscle_mass?: number | null;
  lean_mass?: number | null;
  body_water?: number | null;
  protein_mass?: number | null;
  minerals_mass?: number | null;
  bmi?: number | null;
  bmr?: number | null;
  visceral_fat?: number | null;
  waist_hip_ratio?: number | null;
  obesity_grade?: string | null;
  inbody_score?: number | null;
  ideal_weight?: number | null;
  goal?: string | null;
  activity_level?: ActivityLevel | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  water_per_day?: number | null;
  notes?: string | null;
  tdee?: number | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface AthleteProfilesUpdate {
  id?: UUID;
  user_id?: UUID;
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  sex?: Sex | null;
  body_fat_percentage?: number | null;
  fat_mass?: number | null;
  skeletal_muscle_mass?: number | null;
  lean_mass?: number | null;
  body_water?: number | null;
  protein_mass?: number | null;
  minerals_mass?: number | null;
  bmi?: number | null;
  bmr?: number | null;
  visceral_fat?: number | null;
  waist_hip_ratio?: number | null;
  obesity_grade?: string | null;
  inbody_score?: number | null;
  ideal_weight?: number | null;
  goal?: string | null;
  activity_level?: ActivityLevel | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  water_per_day?: number | null;
  notes?: string | null;
  tdee?: number | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── body_segments ────────────────────────────────────────────────────────────

export interface BodySegmentsRow {
  id: UUID;
  athlete_profile_id: UUID;
  segment: BodySegment;
  lean_mass: number | null;
  fat_mass: number | null;
  created_at: ISODateTimeString;
}

export interface BodySegmentsInsert {
  id?: UUID;
  athlete_profile_id: UUID;
  segment: BodySegment;
  lean_mass?: number | null;
  fat_mass?: number | null;
  created_at?: ISODateTimeString;
}

export interface BodySegmentsUpdate {
  id?: UUID;
  athlete_profile_id?: UUID;
  segment?: BodySegment;
  lean_mass?: number | null;
  fat_mass?: number | null;
  created_at?: ISODateTimeString;
}

// ── workout_days ─────────────────────────────────────────────────────────────

export interface WorkoutDaysRow {
  id: UUID;
  user_id: UUID;
  name: string;
  muscle_groups: string[];
  order_index: number;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface WorkoutDaysInsert {
  id?: UUID;
  user_id: UUID;
  name: string;
  muscle_groups?: string[];
  order_index?: number;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface WorkoutDaysUpdate {
  id?: UUID;
  user_id?: UUID;
  name?: string;
  muscle_groups?: string[];
  order_index?: number;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── workout_exercises ─────────────────────────────────────────────────────────

export interface WorkoutExercisesRow {
  id: UUID;
  workout_day_id: UUID;
  user_id: UUID;
  name: string;
  sets: number;
  target_reps: string | null;
  load: number | null;
  load_type: 'total' | 'per_side';
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface WorkoutExercisesInsert {
  id?: UUID;
  workout_day_id: UUID;
  user_id: UUID;
  name: string;
  sets: number;
  target_reps?: string | null;
  load?: number | null;
  load_type?: 'total' | 'per_side';
  rest_seconds?: number | null;
  order_index?: number;
  notes?: string | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface WorkoutExercisesUpdate {
  id?: UUID;
  workout_day_id?: UUID;
  user_id?: UUID;
  name?: string;
  sets?: number;
  target_reps?: string | null;
  load?: number | null;
  load_type?: 'total' | 'per_side';
  rest_seconds?: number | null;
  order_index?: number;
  notes?: string | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── workout_sessions ──────────────────────────────────────────────────────────

export interface WorkoutSessionsRow {
  id: UUID;
  user_id: UUID;
  workout_day_id: UUID;
  session_date: ISODateString;
  started_at: ISODateTimeString | null;
  finished_at: ISODateTimeString | null;
  notes: string | null;
  created_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface WorkoutSessionsInsert {
  id?: UUID;
  user_id: UUID;
  workout_day_id: UUID;
  session_date: ISODateString;
  started_at?: ISODateTimeString | null;
  finished_at?: ISODateTimeString | null;
  notes?: string | null;
  created_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface WorkoutSessionsUpdate {
  id?: UUID;
  user_id?: UUID;
  workout_day_id?: UUID;
  session_date?: ISODateString;
  started_at?: ISODateTimeString | null;
  finished_at?: ISODateTimeString | null;
  notes?: string | null;
  created_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── workout_session_exercises ─────────────────────────────────────────────────

export interface WorkoutSessionExercisesRow {
  id: UUID;
  session_id: UUID;
  exercise_id: UUID;
  exercise_name: string;
  order_index: number;
}

export interface WorkoutSessionExercisesInsert {
  id?: UUID;
  session_id: UUID;
  exercise_id: UUID;
  exercise_name: string;
  order_index?: number;
}

export interface WorkoutSessionExercisesUpdate {
  id?: UUID;
  session_id?: UUID;
  exercise_id?: UUID;
  exercise_name?: string;
  order_index?: number;
}

// ── workout_session_sets ──────────────────────────────────────────────────────

export interface WorkoutSessionSetsRow {
  id: UUID;
  session_exercise_id: UUID;
  set_number: number;
  weight: number | null;
  reps: number | null;
  is_pr: boolean;
  created_at: ISODateTimeString;
}

export interface WorkoutSessionSetsInsert {
  id?: UUID;
  session_exercise_id: UUID;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  is_pr?: boolean;
  created_at?: ISODateTimeString;
}

export interface WorkoutSessionSetsUpdate {
  id?: UUID;
  session_exercise_id?: UUID;
  set_number?: number;
  weight?: number | null;
  reps?: number | null;
  is_pr?: boolean;
  created_at?: ISODateTimeString;
}

// ── cardio_profiles ───────────────────────────────────────────────────────────

export interface CardioProfilesRow {
  id: UUID;
  user_id: UUID;
  practices: boolean;
  type: string | null;
  intensity: CardioIntensity | null;
  duration_minutes: number | null;
  frequency_per_week: number | null;
  timing: string | null;
  goal: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface CardioProfilesInsert {
  id?: UUID;
  user_id: UUID;
  practices?: boolean;
  type?: string | null;
  intensity?: CardioIntensity | null;
  duration_minutes?: number | null;
  frequency_per_week?: number | null;
  timing?: string | null;
  goal?: string | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface CardioProfilesUpdate {
  id?: UUID;
  user_id?: UUID;
  practices?: boolean;
  type?: string | null;
  intensity?: CardioIntensity | null;
  duration_minutes?: number | null;
  frequency_per_week?: number | null;
  timing?: string | null;
  goal?: string | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── cardio_sessions ───────────────────────────────────────────────────────────

export interface CardioSessionsRow {
  id: UUID;
  user_id: UUID;
  session_date: ISODateString;
  type: string | null;
  duration_minutes: number | null;
  intensity: CardioIntensity | null;
  notes: string | null;
  deleted_at: ISODateTimeString | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface CardioSessionsInsert {
  id?: UUID;
  user_id: UUID;
  session_date?: ISODateString;
  type?: string | null;
  duration_minutes?: number | null;
  intensity?: CardioIntensity | null;
  notes?: string | null;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface CardioSessionsUpdate {
  id?: UUID;
  user_id?: UUID;
  session_date?: ISODateString;
  type?: string | null;
  duration_minutes?: number | null;
  intensity?: CardioIntensity | null;
  notes?: string | null;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── meals ─────────────────────────────────────────────────────────────────────

export interface MealsRow {
  id: UUID;
  user_id: UUID;
  meal_date: ISODateString;
  meal_name: string;
  time: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  items: string | null;
  source: MealSource;
  notes: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface MealsInsert {
  id?: UUID;
  user_id: UUID;
  meal_date: ISODateString;
  meal_name: string;
  time?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  items?: string | null;
  source?: MealSource;
  notes?: string | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface MealsUpdate {
  id?: UUID;
  user_id?: UUID;
  meal_date?: ISODateString;
  meal_name?: string;
  time?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  items?: string | null;
  source?: MealSource;
  notes?: string | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── diet_analyses ─────────────────────────────────────────────────────────────

export interface DietAnalysesRow {
  id: UUID;
  user_id: UUID;
  analysis_date: ISODateString;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  positive_points: string[];
  improvement_points: string[];
  ai_generated: boolean;
  created_at: ISODateTimeString;
}

export interface DietAnalysesInsert {
  id?: UUID;
  user_id: UUID;
  analysis_date: ISODateString;
  total_calories?: number | null;
  total_protein_g?: number | null;
  total_carbs_g?: number | null;
  total_fat_g?: number | null;
  positive_points?: string[];
  improvement_points?: string[];
  ai_generated?: boolean;
  created_at?: ISODateTimeString;
}

export interface DietAnalysesUpdate {
  id?: UUID;
  user_id?: UUID;
  analysis_date?: ISODateString;
  total_calories?: number | null;
  total_protein_g?: number | null;
  total_carbs_g?: number | null;
  total_fat_g?: number | null;
  positive_points?: string[];
  improvement_points?: string[];
  ai_generated?: boolean;
  created_at?: ISODateTimeString;
}

// ── bioimpedance_imports ──────────────────────────────────────────────────────

export interface BioimpedanceImportsRow {
  id: UUID;
  user_id: UUID;
  file_asset_id: UUID | null;
  raw_text: string | null;
  extracted_data: Json | null;
  status: BioimpedanceStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface BioimpedanceImportsInsert {
  id?: UUID;
  user_id: UUID;
  file_asset_id?: UUID | null;
  raw_text?: string | null;
  extracted_data?: Json | null;
  status?: BioimpedanceStatus;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface BioimpedanceImportsUpdate {
  id?: UUID;
  user_id?: UUID;
  file_asset_id?: UUID | null;
  raw_text?: string | null;
  extracted_data?: Json | null;
  status?: BioimpedanceStatus;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── medication_entries ────────────────────────────────────────────────────────

export interface MedicationEntriesRow {
  id: UUID;
  user_id: UUID;
  name: string;
  category: MedicationCategory;
  dose: string | null;
  frequency: string | null;
  route: string | null;
  start_date: ISODateString | null;
  notes: string | null;
  source: MedicationSource;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface MedicationEntriesInsert {
  id?: UUID;
  user_id: UUID;
  name: string;
  category?: MedicationCategory;
  dose?: string | null;
  frequency?: string | null;
  route?: string | null;
  start_date?: ISODateString | null;
  notes?: string | null;
  source?: MedicationSource;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface MedicationEntriesUpdate {
  id?: UUID;
  user_id?: UUID;
  name?: string;
  category?: MedicationCategory;
  dose?: string | null;
  frequency?: string | null;
  route?: string | null;
  start_date?: ISODateString | null;
  notes?: string | null;
  source?: MedicationSource;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── exam_reports ──────────────────────────────────────────────────────────────

export interface ExamReportsRow {
  id: UUID;
  user_id: UUID;
  file_asset_id: UUID | null;
  report_date: ISODateString | null;
  source: ExamReportSource;
  raw_text: string | null;
  created_at: ISODateTimeString;
  deleted_at: ISODateTimeString | null;
}

export interface ExamReportsInsert {
  id?: UUID;
  user_id: UUID;
  file_asset_id?: UUID | null;
  report_date?: ISODateString | null;
  source?: ExamReportSource;
  raw_text?: string | null;
  created_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

export interface ExamReportsUpdate {
  id?: UUID;
  user_id?: UUID;
  file_asset_id?: UUID | null;
  report_date?: ISODateString | null;
  source?: ExamReportSource;
  raw_text?: string | null;
  created_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString | null;
}

// ── exam_markers ──────────────────────────────────────────────────────────────

export interface ExamMarkersRow {
  id: UUID;
  exam_report_id: UUID;
  user_id: UUID;
  marker_name: string;
  value: string | null;
  unit: string | null;
  reference_range: string | null;
  status: ExamMarkerStatus | null;
  created_at: ISODateTimeString;
}

export interface ExamMarkersInsert {
  id?: UUID;
  exam_report_id: UUID;
  user_id: UUID;
  marker_name: string;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  status?: ExamMarkerStatus | null;
  created_at?: ISODateTimeString;
}

export interface ExamMarkersUpdate {
  id?: UUID;
  exam_report_id?: UUID;
  user_id?: UUID;
  marker_name?: string;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  status?: ExamMarkerStatus | null;
  created_at?: ISODateTimeString;
}

// ── ai_analysis_reports ───────────────────────────────────────────────────────

export interface AiAnalysisReportsRow {
  id: UUID;
  user_id: UUID;
  generated_at: ISODateTimeString;
  score_training: number | null;
  score_diet: number | null;
  score_sleep: number | null;
  score_hydration: number | null;
  score_cardio: number | null;
  score_overall: number | null;
  recommendations: string[];
  macro_adjustments: Json | null;
  water_adjustment_ml: number | null;
  calorie_adjustment: number | null;
  report_data: Json | null;
  created_at: ISODateTimeString;
}

export interface AiAnalysisReportsInsert {
  id?: UUID;
  user_id: UUID;
  generated_at?: ISODateTimeString;
  score_training?: number | null;
  score_diet?: number | null;
  score_sleep?: number | null;
  score_hydration?: number | null;
  score_cardio?: number | null;
  score_overall?: number | null;
  recommendations?: string[];
  macro_adjustments?: Json | null;
  water_adjustment_ml?: number | null;
  calorie_adjustment?: number | null;
  report_data?: Json | null;
  created_at?: ISODateTimeString;
}

export interface AiAnalysisReportsUpdate {
  id?: UUID;
  user_id?: UUID;
  generated_at?: ISODateTimeString;
  score_training?: number | null;
  score_diet?: number | null;
  score_sleep?: number | null;
  score_hydration?: number | null;
  score_cardio?: number | null;
  score_overall?: number | null;
  recommendations?: string[];
  macro_adjustments?: Json | null;
  water_adjustment_ml?: number | null;
  calorie_adjustment?: number | null;
  report_data?: Json | null;
  created_at?: ISODateTimeString;
}

// ── file_assets ───────────────────────────────────────────────────────────────

export interface FileAssetsRow {
  id: UUID;
  user_id: UUID;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  module: string;
  created_at: ISODateTimeString;
}

export interface FileAssetsInsert {
  id?: UUID;
  user_id: UUID;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  module: string;
  created_at?: ISODateTimeString;
}

export interface FileAssetsUpdate {
  id?: UUID;
  user_id?: UUID;
  storage_path?: string;
  original_name?: string;
  mime_type?: string;
  size_bytes?: number;
  module?: string;
  created_at?: ISODateTimeString;
}

// ---------------------------------------------------------------------------
// Master Database type (compatible with Supabase createClient<Database>())
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UsersRow;
        Insert: UsersInsert;
        Update: UsersUpdate;
      };
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
      };
      roles: {
        Row: RolesRow;
        Insert: RolesInsert;
        Update: RolesUpdate;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: AuditLogsInsert;
        Update: AuditLogsUpdate;
      };
      athlete_profiles: {
        Row: AthleteProfilesRow;
        Insert: AthleteProfilesInsert;
        Update: AthleteProfilesUpdate;
      };
      body_segments: {
        Row: BodySegmentsRow;
        Insert: BodySegmentsInsert;
        Update: BodySegmentsUpdate;
      };
      workout_days: {
        Row: WorkoutDaysRow;
        Insert: WorkoutDaysInsert;
        Update: WorkoutDaysUpdate;
      };
      workout_exercises: {
        Row: WorkoutExercisesRow;
        Insert: WorkoutExercisesInsert;
        Update: WorkoutExercisesUpdate;
      };
      workout_sessions: {
        Row: WorkoutSessionsRow;
        Insert: WorkoutSessionsInsert;
        Update: WorkoutSessionsUpdate;
      };
      workout_session_exercises: {
        Row: WorkoutSessionExercisesRow;
        Insert: WorkoutSessionExercisesInsert;
        Update: WorkoutSessionExercisesUpdate;
      };
      workout_session_sets: {
        Row: WorkoutSessionSetsRow;
        Insert: WorkoutSessionSetsInsert;
        Update: WorkoutSessionSetsUpdate;
      };
      cardio_profiles: {
        Row: CardioProfilesRow;
        Insert: CardioProfilesInsert;
        Update: CardioProfilesUpdate;
      };
      meals: {
        Row: MealsRow;
        Insert: MealsInsert;
        Update: MealsUpdate;
      };
      diet_analyses: {
        Row: DietAnalysesRow;
        Insert: DietAnalysesInsert;
        Update: DietAnalysesUpdate;
      };
      bioimpedance_imports: {
        Row: BioimpedanceImportsRow;
        Insert: BioimpedanceImportsInsert;
        Update: BioimpedanceImportsUpdate;
      };
      medication_entries: {
        Row: MedicationEntriesRow;
        Insert: MedicationEntriesInsert;
        Update: MedicationEntriesUpdate;
      };
      exam_reports: {
        Row: ExamReportsRow;
        Insert: ExamReportsInsert;
        Update: ExamReportsUpdate;
      };
      exam_markers: {
        Row: ExamMarkersRow;
        Insert: ExamMarkersInsert;
        Update: ExamMarkersUpdate;
      };
      ai_analysis_reports: {
        Row: AiAnalysisReportsRow;
        Insert: AiAnalysisReportsInsert;
        Update: AiAnalysisReportsUpdate;
      };
      file_assets: {
        Row: FileAssetsRow;
        Insert: FileAssetsInsert;
        Update: FileAssetsUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      sex: Sex;
      activity_level: ActivityLevel;
      body_segment: BodySegment;
      cardio_intensity: CardioIntensity;
      meal_source: MealSource;
      bioimpedance_status: BioimpedanceStatus;
      medication_category: MedicationCategory;
      medication_source: MedicationSource;
      exam_report_source: ExamReportSource;
      exam_marker_status: ExamMarkerStatus;
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers (typed table row aliases used across the app)
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
