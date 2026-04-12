/**
 * SCANIX BODY – Application-wide constants
 *
 * Single source of truth for configuration values, labels, enums and
 * routing constants used throughout the app.
 */

// ---------------------------------------------------------------------------
// Application metadata
// ---------------------------------------------------------------------------

export const APP_NAME = 'SCANIX BODY' as const
export const APP_VERSION = '1.0.0' as const
export const APP_DESCRIPTION =
  'Plataforma inteligente de acompanhamento fitness e saúde' as const

// ---------------------------------------------------------------------------
// User roles
// ---------------------------------------------------------------------------

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COACH: 'coach',
  OPERATOR: 'operator',
  USUARIO_FINAL: 'usuario_final',
} as const

export type RoleKey = keyof typeof ROLES
export type RoleValue = (typeof ROLES)[RoleKey]

export const ROLE_LABELS: Record<RoleValue, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  coach: 'Coach',
  operator: 'Operador',
  usuario_final: 'Usuário Final',
}

/** Roles that have access to the /admin section */
export const ADMIN_ROLES: ReadonlySet<RoleValue> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
])

// ---------------------------------------------------------------------------
// User statuses
// ---------------------------------------------------------------------------

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  FIRST_ACCESS: 'first_access',
} as const

export type UserStatusValue =
  (typeof USER_STATUSES)[keyof typeof USER_STATUSES]

export const USER_STATUS_LABELS: Record<UserStatusValue, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado',
  first_access: 'Primeiro Acesso',
}

export const USER_STATUS_COLORS: Record<
  UserStatusValue,
  { bg: string; text: string }
> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800' },
  first_access: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
}

// ---------------------------------------------------------------------------
// Activity levels
// ---------------------------------------------------------------------------

export const ACTIVITY_LEVELS = {
  sedentary: {
    label: 'Sedentário',
    description: 'Pouco ou nenhum exercício',
    multiplier: 1.2,
  },
  light: {
    label: 'Levemente ativo',
    description: 'Exercício leve 1–3 dias/semana',
    multiplier: 1.375,
  },
  moderate: {
    label: 'Moderadamente ativo',
    description: 'Exercício moderado 3–5 dias/semana',
    multiplier: 1.55,
  },
  active: {
    label: 'Muito ativo',
    description: 'Exercício intenso 6–7 dias/semana',
    multiplier: 1.725,
  },
  very_active: {
    label: 'Extremamente ativo',
    description: 'Exercício intenso diário ou trabalho físico',
    multiplier: 1.9,
  },
} as const

export type ActivityLevelKey = keyof typeof ACTIVITY_LEVELS

// ---------------------------------------------------------------------------
// Medication categories
// ---------------------------------------------------------------------------

export const MEDICATION_CATEGORIES = {
  hormonio: { label: 'Hormônio', icon: 'flask' },
  peptideo: { label: 'Peptídeo', icon: 'dna' },
  suplemento: { label: 'Suplemento', icon: 'pill' },
  medicamento: { label: 'Medicamento', icon: 'cross' },
  sarm: { label: 'SARM', icon: 'molecule' },
  outro: { label: 'Outro', icon: 'more-horizontal' },
} as const

export type MedicationCategoryKey = keyof typeof MEDICATION_CATEGORIES

// ---------------------------------------------------------------------------
// Exam / lab marker statuses
// ---------------------------------------------------------------------------

export const EXAM_STATUSES = {
  normal: {
    label: 'Normal',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  alto: {
    label: 'Alto',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
  },
  baixo: {
    label: 'Baixo',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  critico: {
    label: 'Crítico',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
} as const

export type ExamStatusKey = keyof typeof EXAM_STATUSES

// ---------------------------------------------------------------------------
// Athlete goals
// ---------------------------------------------------------------------------

export const ATHLETE_GOALS = {
  weight_loss: { label: 'Perda de peso', caloricModifier: -0.2 },
  muscle_gain: { label: 'Ganho de massa', caloricModifier: 0.1 },
  body_recomposition: { label: 'Recomposição corporal', caloricModifier: 0 },
  maintenance: { label: 'Manutenção', caloricModifier: 0 },
  performance: { label: 'Performance', caloricModifier: 0.05 },
  health: { label: 'Saúde geral', caloricModifier: 0 },
} as const

// ---------------------------------------------------------------------------
// Body segments
// ---------------------------------------------------------------------------

export const BODY_SEGMENTS = {
  right_arm: { label: 'Braço Direito' },
  left_arm: { label: 'Braço Esquerdo' },
  trunk: { label: 'Tronco' },
  right_leg: { label: 'Perna Direita' },
  left_leg: { label: 'Perna Esquerda' },
} as const

// ---------------------------------------------------------------------------
// File upload constraints
// ---------------------------------------------------------------------------

/** Maximum file size allowed for uploads: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB in bytes

export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf'],
  all: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ],
} as const

export const ALLOWED_FILE_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  documents: ['.pdf'],
  all: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'],
} as const

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  PER_PAGE_OPTIONS: [10, 20, 50, 100] as const,
  MAX_PER_PAGE: 100,
} as const

// ---------------------------------------------------------------------------
// Session log history defaults
// ---------------------------------------------------------------------------

export const WORKOUT = {
  DEFAULT_SESSION_HISTORY_LIMIT: 20,
  MAX_SESSION_HISTORY_LIMIT: 100,
  DEFAULT_PROGRESS_POINTS: 30,
} as const

// ---------------------------------------------------------------------------
// API route constants
// ---------------------------------------------------------------------------

export const API_ROUTES = {
  // Auth
  AUTH_SIGN_IN: '/api/auth/sign-in',
  AUTH_SIGN_OUT: '/api/auth/sign-out',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  AUTH_UPDATE_PASSWORD: '/api/auth/update-password',

  // Athlete / corpo
  ATHLETE_PROFILE: '/api/corpo/profile',
  BODY_SEGMENTS: '/api/corpo/segments',

  // Treinos
  WORKOUT_DAYS: '/api/treinos/days',
  WORKOUT_EXERCISES: '/api/treinos/exercises',
  WORKOUT_SESSIONS: '/api/treinos/sessions',

  // Dieta
  MEALS: '/api/dieta/meals',
  DIET_ANALYSIS: '/api/dieta/analysis',

  // Medicamentos
  MEDICATIONS: '/api/medicamentos',

  // Exames
  EXAM_REPORTS: '/api/exames/reports',
  EXAM_MARKERS: '/api/exames/markers',

  // Admin
  ADMIN_USERS: '/api/admin/users',
  ADMIN_AUDIT_LOGS: '/api/admin/audit-logs',

  // AI
  AI_ANALYSIS: '/api/ai/analysis',
} as const

// ---------------------------------------------------------------------------
// Page routes (client navigation)
// ---------------------------------------------------------------------------

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CADASTRO: '/cadastro',
  ESQUECI_SENHA: '/esqueci-senha',
  REDEFINIR_SENHA: '/redefinir-senha',
  PRIMEIRO_ACESSO: '/primeiro-acesso',
  DASHBOARD: '/dashboard',
  TREINOS: '/treinos',
  DIETA: '/dieta',
  CORPO: '/corpo',
  MEDICAMENTOS: '/medicamentos',
  EXAMES: '/exames',
  PERFIL: '/perfil',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_AUDIT: '/admin/auditoria',
} as const

// ---------------------------------------------------------------------------
// Audit log actions
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_CHANGED: 'auth.password_changed',

  // Users / profiles
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_BLOCKED: 'user.blocked',
  USER_UNBLOCKED: 'user.unblocked',
  USER_DELETED: 'user.deleted',
  PROFILE_UPDATED: 'profile.updated',

  // Workout
  WORKOUT_DAY_CREATED: 'workout.day.created',
  WORKOUT_DAY_UPDATED: 'workout.day.updated',
  WORKOUT_DAY_DELETED: 'workout.day.deleted',
  WORKOUT_SESSION_LOGGED: 'workout.session.logged',
  WORKOUT_SESSION_DELETED: 'workout.session.deleted',

  // Dieta
  MEAL_CREATED: 'meal.created',
  MEAL_UPDATED: 'meal.updated',
  MEAL_DELETED: 'meal.deleted',

  // Corpo
  ATHLETE_PROFILE_SAVED: 'corpo.profile.saved',
  BODY_SEGMENTS_SAVED: 'corpo.segments.saved',

  // Medicamentos
  MEDICATION_CREATED: 'medication.created',
  MEDICATION_UPDATED: 'medication.updated',
  MEDICATION_DELETED: 'medication.deleted',

  // Exames
  EXAM_REPORT_CREATED: 'exam.report.created',
  EXAM_REPORT_DELETED: 'exam.report.deleted',
  EXAM_MARKERS_SAVED: 'exam.markers.saved',

  // Admin
  ADMIN_PASSWORD_RESET: 'admin.password_reset',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// ---------------------------------------------------------------------------
// Audit log resources
// ---------------------------------------------------------------------------

export const AUDIT_RESOURCES = {
  AUTH: 'auth',
  USER: 'user',
  PROFILE: 'profile',
  WORKOUT_DAY: 'workout_day',
  WORKOUT_SESSION: 'workout_session',
  MEAL: 'meal',
  DIET_ANALYSIS: 'diet_analysis',
  ATHLETE_PROFILE: 'athlete_profile',
  BODY_SEGMENT: 'body_segment',
  MEDICATION: 'medication',
  EXAM_REPORT: 'exam_report',
  EXAM_MARKER: 'exam_marker',
} as const

export type AuditResource =
  (typeof AUDIT_RESOURCES)[keyof typeof AUDIT_RESOURCES]
