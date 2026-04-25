-- Migration: Add load_type column to workout_exercises
-- Allows distinguishing between "total weight" and "per side" (e.g. dumbbell exercises)
-- Default is 'total' for backward compatibility

ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS load_type TEXT NOT NULL DEFAULT 'total'
    CHECK (load_type IN ('total', 'per_side'));
