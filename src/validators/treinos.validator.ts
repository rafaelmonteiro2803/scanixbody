/**
 * SCANIX BODY – Treinos Validators
 *
 * Zod schemas for workout-related API payloads: workout days,
 * exercises, and session logging.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Workout Day
// ---------------------------------------------------------------------------

export const createWorkoutDaySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome não pode ser vazio')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  muscleGroups: z
    .array(z.string().min(1, 'Grupo muscular não pode ser vazio'))
    .min(1, 'Informe pelo menos um grupo muscular'),
  orderIndex: z.number().int().nonnegative().optional(),
})

export type CreateWorkoutDayInput = z.infer<typeof createWorkoutDaySchema>

export const updateWorkoutDaySchema = createWorkoutDaySchema.partial()

export type UpdateWorkoutDayInput = z.infer<typeof updateWorkoutDaySchema>

// ---------------------------------------------------------------------------
// Exercise
// ---------------------------------------------------------------------------

export const createExerciseSchema = z.object({
  workoutDayId: z
    .string({ required_error: 'workoutDayId é obrigatório' })
    .uuid('workoutDayId deve ser um UUID válido'),
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome não pode ser vazio')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  sets: z
    .number({ required_error: 'Número de séries é obrigatório' })
    .int('Séries deve ser um número inteiro')
    .min(1, 'Mínimo de 1 série')
    .max(20, 'Máximo de 20 séries'),
  targetReps: z
    .string()
    .max(50, 'Repetições alvo deve ter no máximo 50 caracteres')
    .optional(),
  load: z
    .number()
    .min(0, 'Carga não pode ser negativa')
    .optional(),
  loadType: z
    .enum(['total', 'per_side'])
    .optional()
    .default('total'),
  restSeconds: z
    .number()
    .int('Tempo de descanso deve ser inteiro')
    .min(0, 'Descanso não pode ser negativo')
    .max(600, 'Descanso máximo de 600 segundos (10 min)')
    .optional(),
  orderIndex: z.number().int().nonnegative().optional(),
  notes: z
    .string()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional(),
})

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>

export const updateExerciseSchema = createExerciseSchema
  .omit({ workoutDayId: true })
  .partial()

export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>

// ---------------------------------------------------------------------------
// Session set (individual set within a logged session)
// ---------------------------------------------------------------------------

export const sessionSetSchema = z.object({
  setNumber: z
    .number({ required_error: 'Número da série é obrigatório' })
    .int()
    .min(1, 'Número da série deve ser pelo menos 1'),
  weight: z
    .number()
    .min(0, 'Peso não pode ser negativo')
    .optional()
    .nullable(),
  reps: z
    .number()
    .int()
    .min(0, 'Repetições não pode ser negativo')
    .optional()
    .nullable(),
  isPr: z.boolean().optional().default(false),
})

export type SessionSetInput = z.infer<typeof sessionSetSchema>

// ---------------------------------------------------------------------------
// Session exercise (one exercise entry within a logged session)
// ---------------------------------------------------------------------------

export const sessionExerciseSchema = z.object({
  exerciseId: z
    .string({ required_error: 'exerciseId é obrigatório' })
    .uuid('exerciseId deve ser um UUID válido'),
  exerciseName: z
    .string({ required_error: 'Nome do exercício é obrigatório' })
    .min(1, 'Nome do exercício não pode ser vazio'),
  orderIndex: z.number().int().nonnegative().optional().default(0),
  sets: z
    .array(sessionSetSchema)
    .min(1, 'Registre pelo menos uma série'),
})

export type SessionExerciseInput = z.infer<typeof sessionExerciseSchema>

// ---------------------------------------------------------------------------
// Log Session
// ---------------------------------------------------------------------------

export const logSessionSchema = z.object({
  workoutDayId: z
    .string({ required_error: 'workoutDayId é obrigatório' })
    .uuid('workoutDayId deve ser um UUID válido'),
  sessionDate: z
    .string({ required_error: 'Data da sessão é obrigatória' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'sessionDate deve estar no formato YYYY-MM-DD'),
  startedAt: z.string().datetime({ offset: true }).optional().nullable(),
  finishedAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  exercises: z
    .array(sessionExerciseSchema)
    .min(1, 'Registre pelo menos um exercício'),
})

export type LogSessionInput = z.infer<typeof logSessionSchema>
