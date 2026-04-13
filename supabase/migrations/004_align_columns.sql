-- =============================================================================
-- SCANIX BODY – Migration 004: Align column names with application code
-- =============================================================================
-- Idempotent: every rename is guarded by an existence check so the script can
-- be re-run safely even if some columns were already renamed manually.
-- =============================================================================

DO $$
BEGIN

  -- -------------------------------------------------------------------------
  -- profiles
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='profiles' AND column_name='name') THEN
    ALTER TABLE profiles RENAME COLUMN name TO full_name;
  END IF;

  -- -------------------------------------------------------------------------
  -- athlete_profiles
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='weight_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN weight_kg TO weight;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='height_cm') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN height_cm TO height;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='body_fat_pct') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN body_fat_pct TO body_fat_percentage;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='fat_mass_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN fat_mass_kg TO fat_mass;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='skeletal_muscle_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN skeletal_muscle_kg TO skeletal_muscle_mass;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='lean_mass_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN lean_mass_kg TO lean_mass;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='body_water_pct') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN body_water_pct TO body_water;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='protein_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN protein_kg TO protein_mass;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='minerals_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN minerals_kg TO minerals_mass;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='bmr_kcal') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN bmr_kcal TO bmr;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='visceral_fat_level') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN visceral_fat_level TO visceral_fat;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='obesity_degree') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN obesity_degree TO obesity_grade;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='ideal_weight_kg') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN ideal_weight_kg TO ideal_weight;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='main_goal') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN main_goal TO goal;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='daily_water_ml') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN daily_water_ml TO water_per_day;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='observations') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN observations TO notes;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='athlete_profiles' AND column_name='tdee_kcal') THEN
    ALTER TABLE athlete_profiles RENAME COLUMN tdee_kcal TO tdee;
  END IF;

  -- -------------------------------------------------------------------------
  -- body_segments
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='body_segments' AND column_name='lean_mass_kg') THEN
    ALTER TABLE body_segments RENAME COLUMN lean_mass_kg TO lean_mass;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='body_segments' AND column_name='fat_mass_kg') THEN
    ALTER TABLE body_segments RENAME COLUMN fat_mass_kg TO fat_mass;
  END IF;

  -- -------------------------------------------------------------------------
  -- workout_days
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_days' AND column_name='position') THEN
    ALTER TABLE workout_days RENAME COLUMN position TO order_index;
  END IF;

  -- -------------------------------------------------------------------------
  -- workout_exercises
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_exercises' AND column_name='reps_target') THEN
    ALTER TABLE workout_exercises RENAME COLUMN reps_target TO target_reps;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_exercises' AND column_name='weight_kg') THEN
    ALTER TABLE workout_exercises RENAME COLUMN weight_kg TO load;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_exercises' AND column_name='position') THEN
    ALTER TABLE workout_exercises RENAME COLUMN position TO order_index;
  END IF;

  -- -------------------------------------------------------------------------
  -- workout_session_exercises
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_session_exercises' AND column_name='workout_session_id') THEN
    ALTER TABLE workout_session_exercises RENAME COLUMN workout_session_id TO session_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_session_exercises' AND column_name='workout_exercise_id') THEN
    ALTER TABLE workout_session_exercises RENAME COLUMN workout_exercise_id TO exercise_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_session_exercises' AND column_name='position') THEN
    ALTER TABLE workout_session_exercises RENAME COLUMN position TO order_index;
  END IF;

  -- -------------------------------------------------------------------------
  -- workout_session_sets
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_session_sets' AND column_name='workout_session_exercise_id') THEN
    ALTER TABLE workout_session_sets RENAME COLUMN workout_session_exercise_id TO session_exercise_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_session_sets' AND column_name='weight_kg') THEN
    ALTER TABLE workout_session_sets RENAME COLUMN weight_kg TO weight;
  END IF;

  -- -------------------------------------------------------------------------
  -- cardio_profiles
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cardio_profiles' AND column_name='does_cardio') THEN
    ALTER TABLE cardio_profiles RENAME COLUMN does_cardio TO practices;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cardio_profiles' AND column_name='cardio_type') THEN
    ALTER TABLE cardio_profiles RENAME COLUMN cardio_type TO type;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cardio_profiles' AND column_name='duration_min') THEN
    ALTER TABLE cardio_profiles RENAME COLUMN duration_min TO duration_minutes;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cardio_profiles' AND column_name='frequency_week') THEN
    ALTER TABLE cardio_profiles RENAME COLUMN frequency_week TO frequency_per_week;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cardio_profiles' AND column_name='moment') THEN
    ALTER TABLE cardio_profiles RENAME COLUMN moment TO timing;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cardio_profiles' AND column_name='objective') THEN
    ALTER TABLE cardio_profiles RENAME COLUMN objective TO goal;
  END IF;

  -- -------------------------------------------------------------------------
  -- meals
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='meals' AND column_name='meal_time') THEN
    ALTER TABLE meals RENAME COLUMN meal_time TO time;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='meals' AND column_name='calories_kcal') THEN
    ALTER TABLE meals RENAME COLUMN calories_kcal TO calories;
  END IF;

  -- -------------------------------------------------------------------------
  -- diet_analyses
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='diet_analyses' AND column_name='total_calories_kcal') THEN
    ALTER TABLE diet_analyses RENAME COLUMN total_calories_kcal TO total_calories;
  END IF;

  -- -------------------------------------------------------------------------
  -- bioimpedance_imports
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bioimpedance_imports' AND column_name='raw_extraction') THEN
    ALTER TABLE bioimpedance_imports RENAME COLUMN raw_extraction TO extracted_data;
  END IF;

  -- -------------------------------------------------------------------------
  -- ai_analysis_reports
  -- -------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='ai_analysis_reports' AND column_name='score_workout') THEN
    ALTER TABLE ai_analysis_reports RENAME COLUMN score_workout TO score_training;
  END IF;

END $$;


-- =============================================================================
-- ADD MISSING COLUMNS (all use IF NOT EXISTS – safe to re-run)
-- =============================================================================

-- profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark'
  CHECK (theme IN ('dark', 'light'));

-- athlete_profiles
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS age SMALLINT;
UPDATE athlete_profiles
  SET age = EXTRACT(YEAR FROM AGE(birth_date))::SMALLINT
  WHERE birth_date IS NOT NULL AND age IS NULL;

-- workout_days
ALTER TABLE workout_days ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_days' AND column_name='is_active') THEN
    UPDATE workout_days SET deleted_at = updated_at WHERE is_active = FALSE AND deleted_at IS NULL;
  END IF;
END $$;

-- workout_exercises
ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='workout_exercises' AND column_name='is_active') THEN
    UPDATE workout_exercises SET deleted_at = updated_at WHERE is_active = FALSE AND deleted_at IS NULL;
  END IF;
END $$;

-- workout_sessions
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- meals
ALTER TABLE meals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- diet_analyses
ALTER TABLE diet_analyses ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- bioimpedance_imports
ALTER TABLE bioimpedance_imports ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- medication_entries
ALTER TABLE medication_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='medication_entries' AND column_name='is_active') THEN
    UPDATE medication_entries SET deleted_at = updated_at WHERE is_active = FALSE AND deleted_at IS NULL;
  END IF;
END $$;

-- exam_reports
ALTER TABLE exam_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- exam_markers
ALTER TABLE exam_markers ADD COLUMN IF NOT EXISTS reference_range TEXT;

-- ai_analysis_reports
ALTER TABLE ai_analysis_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;
UPDATE ai_analysis_reports SET generated_at = created_at WHERE generated_at IS NULL;
ALTER TABLE ai_analysis_reports ADD COLUMN IF NOT EXISTS calorie_adjustment INT;
ALTER TABLE ai_analysis_reports ADD COLUMN IF NOT EXISTS report_data JSONB;

-- file_assets
ALTER TABLE file_assets ADD COLUMN IF NOT EXISTS module TEXT;
UPDATE file_assets SET module = asset_type::TEXT WHERE module IS NULL;


-- =============================================================================
-- ENUM ADDITIONS (ADD VALUE IF NOT EXISTS – safe to re-run)
-- =============================================================================

-- activity_level: add TS-side values
ALTER TYPE activity_level ADD VALUE IF NOT EXISTS 'light';
ALTER TYPE activity_level ADD VALUE IF NOT EXISTS 'moderate';
ALTER TYPE activity_level ADD VALUE IF NOT EXISTS 'active';

-- meal_source: add TS-side aliases
ALTER TYPE meal_source ADD VALUE IF NOT EXISTS 'ai';
ALTER TYPE meal_source ADD VALUE IF NOT EXISTS 'import';


-- =============================================================================
-- CHECK CONSTRAINT: athlete_profiles.sex
-- =============================================================================
-- Migration allowed: 'male' | 'female' | 'other'
-- TS type Sex = 'M' | 'F'  — widen to accept both conventions
ALTER TABLE athlete_profiles DROP CONSTRAINT IF EXISTS athlete_profiles_sex_check;
ALTER TABLE athlete_profiles
  ADD CONSTRAINT athlete_profiles_sex_check
  CHECK (sex IN ('male','female','other','M','F'));

-- activity_level is NOT NULL in migration but nullable in TS type / service layer
ALTER TABLE athlete_profiles ALTER COLUMN activity_level DROP NOT NULL;


-- =============================================================================
-- ALTER COLUMN TYPES
-- =============================================================================

-- exam_markers.value: was NUMERIC, service stores strings like "12.5" or "<0.01"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='exam_markers'
      AND column_name='value' AND data_type='numeric'
  ) THEN
    ALTER TABLE exam_markers ALTER COLUMN value TYPE TEXT USING value::TEXT;
  END IF;
END $$;


-- =============================================================================
-- CHECK CONSTRAINT UPDATES (widen to accept both old and new values)
-- =============================================================================

-- bioimpedance_imports.status
ALTER TABLE bioimpedance_imports DROP CONSTRAINT IF EXISTS bioimpedance_imports_status_check;
ALTER TABLE bioimpedance_imports
  ADD CONSTRAINT bioimpedance_imports_status_check
  CHECK (status IN ('pending','processing','review_pending','reviewed','confirmed','failed','error'));

-- medication_entries.source  ('import' alias for 'file_import')
ALTER TABLE medication_entries DROP CONSTRAINT IF EXISTS medication_entries_source_check;
ALTER TABLE medication_entries
  ADD CONSTRAINT medication_entries_source_check
  CHECK (source IN ('manual','file_import','import'));

-- exam_reports.source  ('file' and 'text' aliases)
ALTER TABLE exam_reports DROP CONSTRAINT IF EXISTS exam_reports_source_check;
ALTER TABLE exam_reports
  ADD CONSTRAINT exam_reports_source_check
  CHECK (source IN ('file_import','pasted_text','manual','file','text'));


-- =============================================================================
-- INDEX CLEANUP (recreate with canonical names after column renames)
-- =============================================================================

DROP INDEX IF EXISTS idx_workout_days_is_active;
CREATE INDEX IF NOT EXISTS idx_workout_days_deleted_at
  ON workout_days(user_id, deleted_at) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_wse_session_id;
DROP INDEX IF EXISTS idx_wse_exercise_id;
CREATE INDEX IF NOT EXISTS idx_wse_session_id  ON workout_session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_wse_exercise_id ON workout_session_exercises(exercise_id);

DROP INDEX IF EXISTS idx_wss_session_ex_id;
CREATE INDEX IF NOT EXISTS idx_wss_session_ex_id ON workout_session_sets(session_exercise_id);
