-- =============================================================================
-- SCANIX BODY – Migration 004: Align column names with application code
-- =============================================================================
-- The initial migration (001) and the TypeScript service layer were written
-- with different naming conventions.  This migration renames columns, adds
-- missing columns, and adjusts CHECK constraints so that every service works
-- without errors.
--
-- Safe to run on an empty or freshly seeded database.
-- All renames use IF EXISTS guards where possible.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- 001 created "name", code queries "full_name"
ALTER TABLE profiles RENAME COLUMN name TO full_name;

-- Theme preference for the light/dark toggle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark'
  CHECK (theme IN ('dark', 'light'));


-- ---------------------------------------------------------------------------
-- activity_level enum
-- ---------------------------------------------------------------------------
-- 001 enum: sedentary | lightly_active | moderately_active | very_active | super_active
-- TS type:  sedentary | light          | moderate          | active      | very_active
-- Add the TS-side values so inserts from the app don't fail.
ALTER TYPE activity_level ADD VALUE IF NOT EXISTS 'light';
ALTER TYPE activity_level ADD VALUE IF NOT EXISTS 'moderate';
ALTER TYPE activity_level ADD VALUE IF NOT EXISTS 'active';


-- ---------------------------------------------------------------------------
-- athlete_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE athlete_profiles RENAME COLUMN weight_kg          TO weight;
ALTER TABLE athlete_profiles RENAME COLUMN height_cm          TO height;
ALTER TABLE athlete_profiles RENAME COLUMN body_fat_pct       TO body_fat_percentage;
ALTER TABLE athlete_profiles RENAME COLUMN fat_mass_kg        TO fat_mass;
ALTER TABLE athlete_profiles RENAME COLUMN skeletal_muscle_kg TO skeletal_muscle_mass;
ALTER TABLE athlete_profiles RENAME COLUMN lean_mass_kg       TO lean_mass;
ALTER TABLE athlete_profiles RENAME COLUMN body_water_pct     TO body_water;
ALTER TABLE athlete_profiles RENAME COLUMN protein_kg         TO protein_mass;
ALTER TABLE athlete_profiles RENAME COLUMN minerals_kg        TO minerals_mass;
ALTER TABLE athlete_profiles RENAME COLUMN bmr_kcal           TO bmr;
ALTER TABLE athlete_profiles RENAME COLUMN visceral_fat_level TO visceral_fat;
ALTER TABLE athlete_profiles RENAME COLUMN obesity_degree     TO obesity_grade;
ALTER TABLE athlete_profiles RENAME COLUMN ideal_weight_kg    TO ideal_weight;
ALTER TABLE athlete_profiles RENAME COLUMN main_goal          TO goal;
ALTER TABLE athlete_profiles RENAME COLUMN daily_water_ml     TO water_per_day;
ALTER TABLE athlete_profiles RENAME COLUMN observations       TO notes;
ALTER TABLE athlete_profiles RENAME COLUMN tdee_kcal          TO tdee;

-- TS type has "age" (integer); migration stored birth_date.
-- Add age as a computed-friendly column; keep birth_date for accuracy.
ALTER TABLE athlete_profiles
  ADD COLUMN IF NOT EXISTS age SMALLINT;
UPDATE athlete_profiles
  SET age = EXTRACT(YEAR FROM AGE(birth_date))::SMALLINT
  WHERE birth_date IS NOT NULL AND age IS NULL;


-- ---------------------------------------------------------------------------
-- body_segments
-- ---------------------------------------------------------------------------
ALTER TABLE body_segments RENAME COLUMN lean_mass_kg TO lean_mass;
ALTER TABLE body_segments RENAME COLUMN fat_mass_kg  TO fat_mass;


-- ---------------------------------------------------------------------------
-- workout_days
-- ---------------------------------------------------------------------------
ALTER TABLE workout_days RENAME COLUMN position TO order_index;
ALTER TABLE workout_days ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Migrate is_active=false rows to soft-deleted
UPDATE workout_days SET deleted_at = updated_at WHERE is_active = FALSE AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_workout_days_is_active;
CREATE INDEX IF NOT EXISTS idx_workout_days_deleted_at
  ON workout_days(user_id, deleted_at) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------------------
ALTER TABLE workout_exercises RENAME COLUMN reps_target TO target_reps;
ALTER TABLE workout_exercises RENAME COLUMN weight_kg   TO load;
ALTER TABLE workout_exercises RENAME COLUMN position    TO order_index;
ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE workout_exercises SET deleted_at = updated_at WHERE is_active = FALSE AND deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- workout_sessions
-- ---------------------------------------------------------------------------
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;


-- ---------------------------------------------------------------------------
-- workout_session_exercises
-- ---------------------------------------------------------------------------
ALTER TABLE workout_session_exercises RENAME COLUMN workout_session_id  TO session_id;
ALTER TABLE workout_session_exercises RENAME COLUMN workout_exercise_id TO exercise_id;
ALTER TABLE workout_session_exercises RENAME COLUMN position            TO order_index;

DROP INDEX IF EXISTS idx_wse_session_id;
DROP INDEX IF EXISTS idx_wse_exercise_id;
CREATE INDEX IF NOT EXISTS idx_wse_session_id  ON workout_session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_wse_exercise_id ON workout_session_exercises(exercise_id);


-- ---------------------------------------------------------------------------
-- workout_session_sets
-- ---------------------------------------------------------------------------
ALTER TABLE workout_session_sets RENAME COLUMN workout_session_exercise_id TO session_exercise_id;
ALTER TABLE workout_session_sets RENAME COLUMN weight_kg                   TO weight;

DROP INDEX IF EXISTS idx_wss_session_ex_id;
CREATE INDEX IF NOT EXISTS idx_wss_session_ex_id ON workout_session_sets(session_exercise_id);


-- ---------------------------------------------------------------------------
-- cardio_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE cardio_profiles RENAME COLUMN does_cardio     TO practices;
ALTER TABLE cardio_profiles RENAME COLUMN cardio_type     TO type;
ALTER TABLE cardio_profiles RENAME COLUMN duration_min    TO duration_minutes;
ALTER TABLE cardio_profiles RENAME COLUMN frequency_week  TO frequency_per_week;
ALTER TABLE cardio_profiles RENAME COLUMN moment          TO timing;
ALTER TABLE cardio_profiles RENAME COLUMN objective       TO goal;


-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
ALTER TABLE meals RENAME COLUMN meal_time     TO time;
ALTER TABLE meals RENAME COLUMN calories_kcal TO calories;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- meal_source enum: add TS-side aliases ('ai', 'import')
ALTER TYPE meal_source ADD VALUE IF NOT EXISTS 'ai';
ALTER TYPE meal_source ADD VALUE IF NOT EXISTS 'import';


-- ---------------------------------------------------------------------------
-- diet_analyses
-- ---------------------------------------------------------------------------
ALTER TABLE diet_analyses RENAME COLUMN total_calories_kcal TO total_calories;
ALTER TABLE diet_analyses ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;


-- ---------------------------------------------------------------------------
-- bioimpedance_imports
-- ---------------------------------------------------------------------------
ALTER TABLE bioimpedance_imports RENAME COLUMN raw_extraction TO extracted_data;
ALTER TABLE bioimpedance_imports ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- Widen status constraint to include TS values ('reviewed', 'error')
ALTER TABLE bioimpedance_imports DROP CONSTRAINT IF EXISTS bioimpedance_imports_status_check;
ALTER TABLE bioimpedance_imports
  ADD CONSTRAINT bioimpedance_imports_status_check
  CHECK (status IN ('pending','processing','review_pending','reviewed','confirmed','failed','error'));


-- ---------------------------------------------------------------------------
-- medication_entries
-- ---------------------------------------------------------------------------
ALTER TABLE medication_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
UPDATE medication_entries SET deleted_at = updated_at WHERE is_active = FALSE AND deleted_at IS NULL;

-- Widen source constraint: TS uses 'import', migration had 'file_import'
ALTER TABLE medication_entries DROP CONSTRAINT IF EXISTS medication_entries_source_check;
ALTER TABLE medication_entries
  ADD CONSTRAINT medication_entries_source_check
  CHECK (source IN ('manual','file_import','import'));


-- ---------------------------------------------------------------------------
-- exam_reports
-- ---------------------------------------------------------------------------
ALTER TABLE exam_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Widen source constraint: TS uses 'file' | 'text'
ALTER TABLE exam_reports DROP CONSTRAINT IF EXISTS exam_reports_source_check;
ALTER TABLE exam_reports
  ADD CONSTRAINT exam_reports_source_check
  CHECK (source IN ('file_import','pasted_text','manual','file','text'));


-- ---------------------------------------------------------------------------
-- exam_markers
-- ---------------------------------------------------------------------------
-- value was NUMERIC; service layer stores it as a string (e.g. "12.5")
ALTER TABLE exam_markers ALTER COLUMN value TYPE TEXT USING value::TEXT;

-- Service inserts a single reference_range string; migration had min/max/text columns
ALTER TABLE exam_markers ADD COLUMN IF NOT EXISTS reference_range TEXT;


-- ---------------------------------------------------------------------------
-- ai_analysis_reports
-- ---------------------------------------------------------------------------
ALTER TABLE ai_analysis_reports RENAME COLUMN score_workout TO score_training;

-- TS type uses "generated_at TIMESTAMPTZ" instead of "analysis_date DATE"
ALTER TABLE ai_analysis_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;
UPDATE ai_analysis_reports SET generated_at = created_at WHERE generated_at IS NULL;

ALTER TABLE ai_analysis_reports ADD COLUMN IF NOT EXISTS calorie_adjustment INT;
ALTER TABLE ai_analysis_reports ADD COLUMN IF NOT EXISTS report_data JSONB;


-- ---------------------------------------------------------------------------
-- file_assets
-- ---------------------------------------------------------------------------
-- TS type uses "module TEXT" instead of "asset_type file_asset_type"
ALTER TABLE file_assets ADD COLUMN IF NOT EXISTS module TEXT;
UPDATE file_assets SET module = asset_type::TEXT WHERE module IS NULL;
