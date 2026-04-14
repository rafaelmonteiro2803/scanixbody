/**
 * SCANIX BODY - Domain-Level Type Definitions
 *
 * These types live above the raw database layer. They represent:
 *   - Re-exported enum constants (const enums usable at runtime)
 *   - Data-Transfer Objects (DTOs) used in form submissions and API payloads
 *   - Generic API response wrappers
 *   - UI / client-state types
 *
 * Import database row shapes from `@/types/database.types` when you need
 * the raw Supabase row. Import from here when you are working with
 * application logic, forms, or UI state.
 */

// ---------------------------------------------------------------------------
// Re-export primitive aliases so consumers only need one import
// ---------------------------------------------------------------------------

export type { ISODateTimeString, ISODateString, UUID, Json } from './database.types';

// ---------------------------------------------------------------------------
// Enum constants (runtime-safe – use these instead of raw string literals)
// ---------------------------------------------------------------------------

/** Role that a user can have within the platform */
export const Role = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COACH: 'coach',
  OPERATOR: 'operator',
  USUARIO_FINAL: 'usuario_final',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Lifecycle status of a user account */
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  FIRST_ACCESS: 'first_access',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Biological sex used for physiological calculations */
export const Sex = {
  MALE: 'M',
  FEMALE: 'F',
} as const;
export type Sex = (typeof Sex)[keyof typeof Sex];

/** Physical activity level used for TDEE estimation */
export const ActivityLevel = {
  SEDENTARY: 'sedentary',
  LIGHT: 'light',
  MODERATE: 'moderate',
  ACTIVE: 'active',
  VERY_ACTIVE: 'very_active',
} as const;
export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

/** Body segment evaluated in bioimpedance analysis */
export const BodySegment = {
  RIGHT_ARM: 'right_arm',
  LEFT_ARM: 'left_arm',
  TRUNK: 'trunk',
  RIGHT_LEG: 'right_leg',
  LEFT_LEG: 'left_leg',
} as const;
export type BodySegment = (typeof BodySegment)[keyof typeof BodySegment];

/** Cardio training intensity */
export const CardioIntensity = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
} as const;
export type CardioIntensity = (typeof CardioIntensity)[keyof typeof CardioIntensity];

/** Origin source of a meal entry */
export const MealSource = {
  MANUAL: 'manual',
  AI: 'ai',
  IMPORT: 'import',
} as const;
export type MealSource = (typeof MealSource)[keyof typeof MealSource];

/** Processing status of a bioimpedance file import */
export const BioimpedanceStatus = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  CONFIRMED: 'confirmed',
  ERROR: 'error',
} as const;
export type BioimpedanceStatus = (typeof BioimpedanceStatus)[keyof typeof BioimpedanceStatus];

/** Category of a medication / supplement entry */
export const MedicationCategory = {
  HORMONIO: 'hormonio',
  PEPTIDEO: 'peptideo',
  SUPLEMENTO: 'suplemento',
  MEDICAMENTO: 'medicamento',
  SARM: 'sarm',
  OUTRO: 'outro',
} as const;
export type MedicationCategory = (typeof MedicationCategory)[keyof typeof MedicationCategory];

/** Source of a medication entry */
export const MedicationSource = {
  MANUAL: 'manual',
  IMPORT: 'import',
} as const;
export type MedicationSource = (typeof MedicationSource)[keyof typeof MedicationSource];

/** Source of an exam report */
export const ExamReportSource = {
  FILE: 'file',
  TEXT: 'text',
} as const;
export type ExamReportSource = (typeof ExamReportSource)[keyof typeof ExamReportSource];

/** Clinical interpretation of a lab marker value */
export const ExamMarkerStatus = {
  NORMAL: 'normal',
  ALTO: 'alto',
  BAIXO: 'baixo',
  CRITICO: 'critico',
} as const;
export type ExamMarkerStatus = (typeof ExamMarkerStatus)[keyof typeof ExamMarkerStatus];

/** Athlete fitness goal category */
export const AthleteGoal = {
  WEIGHT_LOSS: 'weight_loss',
  MUSCLE_GAIN: 'muscle_gain',
  BODY_RECOMPOSITION: 'body_recomposition',
  MAINTENANCE: 'maintenance',
  PERFORMANCE: 'performance',
  HEALTH: 'health',
} as const;
export type AthleteGoal = (typeof AthleteGoal)[keyof typeof AthleteGoal];

/** BMI classification label */
export const BmiClassification = {
  UNDERWEIGHT: 'Abaixo do peso',
  NORMAL: 'Normal',
  OVERWEIGHT: 'Sobrepeso',
  OBESITY_I: 'Obesidade Grau I',
  OBESITY_II: 'Obesidade Grau II',
  OBESITY_III: 'Obesidade Grau III',
} as const;
export type BmiClassification = (typeof BmiClassification)[keyof typeof BmiClassification];

// ---------------------------------------------------------------------------
// Shared value objects
// ---------------------------------------------------------------------------

/** Macro-nutrient summary in grams + total calories */
export interface MacroSummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Target macro ranges for a given goal/TDEE */
export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** Optional protein range expressed as g / kg body-weight */
  protein_per_kg?: number;
}

/** Macros expressed as percentage of total calories */
export interface MacroPercentages {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

/** Nutrition evaluation result */
export interface NutritionEvaluation {
  overall_score: number;
  protein_status: 'low' | 'adequate' | 'high';
  carbs_status: 'low' | 'adequate' | 'high';
  fat_status: 'low' | 'adequate' | 'high';
  calorie_status: 'deficit' | 'maintenance' | 'surplus';
  feedback: string[];
}

/** Single data-point for progress charts */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/** Exercise performance history */
export interface ExerciseHistory {
  exercise_name: string;
  sessions: Array<{
    session_date: string;
    best_weight: number;
    best_reps: number;
    total_volume: number;
  }>;
}

/** A single completed set (used across workout domain functions) */
export interface WorkoutSet {
  id?: string;
  set_number: number;
  weight: number;
  reps: number;
  is_pr?: boolean;
}

/** AI-generated checklist item for the athlete dashboard */
export interface ChecklistItem {
  id: string;
  category: 'training' | 'diet' | 'sleep' | 'hydration' | 'cardio' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

/** Score breakdown used by ai-scoring module */
export interface ScoreBreakdown {
  training: number;
  diet: number;
  sleep: number;
  hydration: number;
  cardio: number;
  overall: number;
}

// ---------------------------------------------------------------------------
// DTOs – used in React Hook Form schemas and API route payloads
// ---------------------------------------------------------------------------

/** Create or update a workout day */
export interface CreateWorkoutDayDTO {
  name: string;
  muscle_groups: string[];
  order_index?: number;
}

/** Update an existing workout day (all fields optional) */
export type UpdateWorkoutDayDTO = Partial<CreateWorkoutDayDTO>;

/** Create or update an exercise within a workout day */
export interface CreateExerciseDTO {
  workout_day_id: string;
  name: string;
  sets: number;
  target_reps?: string;
  load?: number;
  rest_seconds?: number;
  order_index?: number;
  notes?: string;
}

/** Update an existing exercise (all fields optional) */
export type UpdateExerciseDTO = Partial<Omit<CreateExerciseDTO, 'workout_day_id'>>;

/** Payload for logging a workout session */
export interface LogSessionDTO {
  workout_day_id: string;
  session_date: string;
  started_at?: string | null;
  finished_at?: string | null;
  notes?: string | null;
  exercises: LogSessionExerciseDTO[];
}

/** Exercise entry within a session log */
export interface LogSessionExerciseDTO {
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: WorkoutSet[];
}

/** Create or update a meal entry */
export interface CreateMealDTO {
  meal_date: string;
  meal_name: string;
  time?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  items?: string | null;
  source?: MealSource | null;
  notes?: string | null;
}

/** Update an existing meal (all fields optional) */
export type UpdateMealDTO = Partial<CreateMealDTO>;

/** Create or update an athlete profile */
export interface CreateAthleteProfileDTO {
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
}

/** Update an athlete profile (all fields optional) */
export type UpdateAthleteProfileDTO = Partial<CreateAthleteProfileDTO>;

/** Create or update a cardio profile */
export interface CreateCardioProfileDTO {
  practices: boolean;
  type?: string | null;
  intensity?: CardioIntensity | null;
  duration_minutes?: number | null;
  frequency_per_week?: number | null;
  timing?: string | null;
  goal?: string | null;
}

/** Update a cardio profile (all fields optional) */
export type UpdateCardioProfileDTO = Partial<CreateCardioProfileDTO>;

/** Add a medication entry */
export interface CreateMedicationEntryDTO {
  name: string;
  category: MedicationCategory;
  dose?: string | null;
  frequency?: string | null;
  route?: string | null;
  start_date?: string | null;
  notes?: string | null;
  source?: MedicationSource | null;
}

/** Update a medication entry (all fields optional) */
export type UpdateMedicationEntryDTO = Partial<CreateMedicationEntryDTO>;

/** Create an exam report from uploaded file or raw text */
export interface CreateExamReportDTO {
  file_asset_id?: string;
  report_date?: string;
  source: ExamReportSource;
  raw_text?: string;
}

/** Create a single exam marker linked to a report */
export interface CreateExamMarkerDTO {
  exam_report_id: string;
  marker_name: string;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  status?: ExamMarkerStatus | null;
}

/** Create a bioimpedance import record */
export interface CreateBioimpedanceImportDTO {
  file_asset_id?: string;
  raw_text?: string;
  extracted_data?: Record<string, unknown>;
  status?: BioimpedanceStatus;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  /** HTTP status code */
  status: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  error: ApiError | null;
}

/** Structured API error */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// UI / client state types
// ---------------------------------------------------------------------------

/** Generic loading state machine */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Toast notification used by the global notification store */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

/** Confirmation dialog state */
export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

/** Active drawer / modal identifier */
export type DrawerView =
  | 'workout-day-create'
  | 'workout-day-edit'
  | 'exercise-create'
  | 'exercise-edit'
  | 'log-session'
  | 'meal-create'
  | 'meal-edit'
  | 'athlete-profile-edit'
  | 'cardio-profile-edit'
  | 'medication-create'
  | 'medication-edit'
  | 'exam-report-upload'
  | 'bioimpedance-import'
  | null;

/** Shape of the global UI Zustand store */
export interface UIState {
  activeDrawer: DrawerView;
  confirmDialog: ConfirmDialogState | null;
  toasts: ToastNotification[];
  isSidebarCollapsed: boolean;
  openDrawer: (view: DrawerView) => void;
  closeDrawer: () => void;
  showConfirm: (config: Omit<ConfirmDialogState, 'open'>) => void;
  dismissConfirm: () => void;
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
}

/** Shape of the authenticated user store */
export interface AuthState {
  userId: string | null;
  email: string | null;
  role: Role | null;
  status: UserStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: {
    userId: string;
    email: string;
    role: Role;
    status: UserStatus;
  }) => void;
  clearUser: () => void;
}

/** Pagination cursor used by query hooks */
export interface PaginationParams {
  page: number;
  per_page: number;
}

/** Generic sort descriptor */
export interface SortParams<T extends string = string> {
  field: T;
  direction: 'asc' | 'desc';
}

/** Filter + pagination + sort bundle passed to list queries */
export interface ListQueryParams<
  TFilter extends Record<string, unknown> = Record<string, unknown>,
  TSort extends string = string,
> {
  filter?: TFilter;
  pagination?: PaginationParams;
  sort?: SortParams<TSort>;
  search?: string;
}

// ---------------------------------------------------------------------------
// Domain value objects used across the app
// ---------------------------------------------------------------------------

/** Lightweight user profile summary (used in coach views, etc.) */
export interface UserSummary {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  status: UserStatus;
}

/** Condensed athlete snapshot for dashboard cards */
export interface AthleteDashboardSnapshot {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  weight: number | null;
  body_fat_percentage: number | null;
  bmi: number | null;
  inbody_score: number | null;
  last_session_date: string | null;
  score_overall: number | null;
}

/** Progress delta between two athlete profile snapshots */
export interface BodyProgressDelta {
  weight_delta: number | null;
  body_fat_delta: number | null;
  muscle_mass_delta: number | null;
  bmi_delta: number | null;
  period_days: number;
}

// ---------------------------------------------------------------------------
// Coach-Student relationship types
// ---------------------------------------------------------------------------

/** Raw coach_students row */
export interface CoachStudent {
  id: string;
  coach_user_id: string;
  student_user_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Coach-student link with the student's profile info */
export interface CoachStudentWithProfile extends CoachStudent {
  student: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
    status: UserStatus;
  };
}

/** Minimal student summary used in coach mode context */
export interface CoachViewingStudent {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Shape passed to AppLayout when a coach is viewing a student */
export interface CoachModeProps {
  student: CoachViewingStudent;
}

/** DTO to create a coach-student link (admin only) */
export interface CreateCoachStudentDTO {
  coach_user_id: string;
  student_user_id: string;
}

/** DTO to update a coach-student link active state */
export interface UpdateCoachStudentDTO {
  active: boolean;
}
