-- =============================================================================
-- SCANIX BODY - Migration 001: Initial Schema
-- =============================================================================
-- Creates all enums, tables, indexes, and the updated_at trigger infrastructure.
-- Run order: 001 → 002 → 003
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'coach',
    'operador',
    'usuario_final'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'blocked',
    'first_access',
    'pending_verification'
);

CREATE TYPE activity_level AS ENUM (
    'sedentary',          -- Sedentário
    'lightly_active',     -- Levemente ativo (1-3x/semana)
    'moderately_active',  -- Moderadamente ativo (3-5x/semana)
    'very_active',        -- Muito ativo (6-7x/semana)
    'super_active'        -- Extremamente ativo (atleta/trabalho físico)
);

CREATE TYPE exam_status AS ENUM (
    'normal',
    'alto',
    'baixo',
    'critico'
);

CREATE TYPE medication_category AS ENUM (
    'hormonio',
    'peptideo',
    'suplemento',
    'medicamento',
    'sarm',
    'outro'
);

CREATE TYPE meal_source AS ENUM (
    'manual',
    'ai_analysis',
    'file_import'
);

CREATE TYPE segment_type AS ENUM (
    'right_arm',
    'left_arm',
    'trunk',
    'right_leg',
    'left_leg'
);

CREATE TYPE ai_analysis_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TYPE file_asset_type AS ENUM (
    'bioimpedance_pdf',
    'exam_report',
    'diet_import',
    'workout_import',
    'medication_import',
    'other'
);


-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
-- Defined here so it is available when tables reference it in 003.
-- The triggers themselves are attached in migration 003 to keep SQL clean.
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- =============================================================================
-- TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Central user record, 1-to-1 with auth.users.
-- "first_access" status forces password change on the application layer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL,
    role          user_role   NOT NULL DEFAULT 'usuario_final',
    status        user_status NOT NULL DEFAULT 'first_access',
    avatar_url    TEXT,
    phone         TEXT,
    -- Security & session management
    failed_login_attempts INT  NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ,
    -- Soft-delete / LGPD
    deleted_at            TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id   ON profiles(user_id);
CREATE INDEX idx_profiles_email     ON profiles(email);
CREATE INDEX idx_profiles_role      ON profiles(role);
CREATE INDEX idx_profiles_status    ON profiles(status);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
-- Immutable audit trail. Never UPDATE or DELETE rows from this table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,           -- e.g. 'LOGIN', 'PROFILE_UPDATE'
    resource    TEXT        NOT NULL,           -- e.g. 'profiles', 'workout_sessions'
    resource_id UUID,                           -- PK of the affected row (nullable)
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No updated_at: audit rows are append-only
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource   ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ---------------------------------------------------------------------------
-- athlete_profiles
-- ---------------------------------------------------------------------------
-- Extended sports / biometric profile per user.
-- Linked to profiles; populated via the "Corpo e objetivo" module.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS athlete_profiles (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Personal data
    birth_date          DATE,
    sex                 TEXT CHECK (sex IN ('male', 'female', 'other')),
    height_cm           NUMERIC(5, 2),
    weight_kg           NUMERIC(6, 2),

    -- Body composition (from bioimpedance or manual)
    body_fat_pct        NUMERIC(5, 2),      -- % gordura
    fat_mass_kg         NUMERIC(6, 2),      -- massa gorda (kg)
    skeletal_muscle_kg  NUMERIC(6, 2),      -- massa muscular esquelética
    lean_mass_kg        NUMERIC(6, 2),      -- massa magra
    body_water_pct      NUMERIC(5, 2),      -- % água corporal
    protein_kg          NUMERIC(6, 2),      -- proteína (kg)
    minerals_kg         NUMERIC(5, 3),      -- minerais (kg)
    visceral_fat_level  SMALLINT,           -- gordura visceral (1-20 escala InBody)
    inbody_score        SMALLINT,           -- score InBody (0-100)

    -- Derived / calculated
    bmi                 NUMERIC(5, 2),      -- IMC calculado
    bmi_category        TEXT,               -- categoria de IMC
    bmr_kcal            NUMERIC(7, 2),      -- TMB estimada (kcal)
    tdee_kcal           NUMERIC(7, 2),      -- TDEE estimado
    waist_hip_ratio     NUMERIC(5, 3),      -- relação cintura-quadril
    obesity_degree      TEXT,               -- grau de obesidade
    ideal_weight_kg     NUMERIC(6, 2),      -- peso ideal estimado

    -- Goal & lifestyle
    main_goal           TEXT,               -- meta principal
    activity_level      activity_level  NOT NULL DEFAULT 'sedentary',
    goal_period_days    SMALLINT,           -- período meta (dias)
    daily_water_ml      INT,                -- água por dia (ml)
    sleep_hours         NUMERIC(4, 2),      -- horas de sono
    sleep_quality       SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
    observations        TEXT,

    -- Waist / hip for WHR
    waist_cm            NUMERIC(5, 2),
    hip_cm              NUMERIC(5, 2),

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_athlete_profiles_user_id ON athlete_profiles(user_id);


-- ---------------------------------------------------------------------------
-- body_segments
-- ---------------------------------------------------------------------------
-- Segmental lean/fat mass from InBody or bioimpedance reading.
-- Multiple rows per athlete_profile, one per segment per import date.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS body_segments (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    athlete_profile_id  UUID            REFERENCES athlete_profiles(id) ON DELETE SET NULL,
    segment             segment_type    NOT NULL,
    lean_mass_kg        NUMERIC(6, 2),
    fat_mass_kg         NUMERIC(6, 2),
    fat_pct             NUMERIC(5, 2),
    measurement_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    source              TEXT,           -- 'bioimpedance', 'manual', etc.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_body_segments_user_id          ON body_segments(user_id);
CREATE INDEX idx_body_segments_athlete_profile  ON body_segments(athlete_profile_id);
CREATE INDEX idx_body_segments_date             ON body_segments(measurement_date DESC);
CREATE INDEX idx_body_segments_segment          ON body_segments(segment);


-- ---------------------------------------------------------------------------
-- workout_days
-- ---------------------------------------------------------------------------
-- Represents a named training day (e.g. "Peito e Tríceps – Segunda").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_days (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    muscle_groups   TEXT[], -- e.g. ARRAY['chest', 'triceps']
    day_of_week     SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
    position        SMALLINT NOT NULL DEFAULT 0,  -- display order
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_days_user_id    ON workout_days(user_id);
CREATE INDEX idx_workout_days_is_active  ON workout_days(user_id, is_active);


-- ---------------------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------------------
-- Exercise template within a workout day (not a logged execution).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_exercises (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_day_id  UUID        NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    muscle_group    TEXT,
    sets            SMALLINT    NOT NULL DEFAULT 3,
    reps_target     TEXT        NOT NULL DEFAULT '10',  -- can be '8-12' range
    weight_kg       NUMERIC(7, 2),
    rest_seconds    SMALLINT    DEFAULT 60,
    notes           TEXT,
    position        SMALLINT    NOT NULL DEFAULT 0,     -- display order in day
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_exercises_user_id       ON workout_exercises(user_id);
CREATE INDEX idx_workout_exercises_workout_day   ON workout_exercises(workout_day_id);
CREATE INDEX idx_workout_exercises_name          ON workout_exercises(user_id, name);


-- ---------------------------------------------------------------------------
-- workout_sessions
-- ---------------------------------------------------------------------------
-- A logged training session (actual execution of a workout_day).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_day_id  UUID        REFERENCES workout_days(id) ON DELETE SET NULL,
    session_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    duration_min    SMALLINT,   -- computed or user-provided duration
    total_volume_kg NUMERIC(10, 2) DEFAULT 0,  -- sum of weight × reps across all sets
    total_sets      SMALLINT    DEFAULT 0,
    notes           TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user_id      ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date         ON workout_sessions(session_date DESC);
CREATE INDEX idx_workout_sessions_workout_day  ON workout_sessions(workout_day_id);


-- ---------------------------------------------------------------------------
-- workout_session_exercises
-- ---------------------------------------------------------------------------
-- Snapshot of an exercise as it was logged during a session.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_session_exercises (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_session_id  UUID    NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    workout_exercise_id UUID    REFERENCES workout_exercises(id) ON DELETE SET NULL,
    exercise_name       TEXT    NOT NULL,   -- denormalised for history integrity
    muscle_group        TEXT,
    position            SMALLINT NOT NULL DEFAULT 0,
    notes               TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wse_user_id        ON workout_session_exercises(user_id);
CREATE INDEX idx_wse_session_id     ON workout_session_exercises(workout_session_id);
CREATE INDEX idx_wse_exercise_id    ON workout_session_exercises(workout_exercise_id);
CREATE INDEX idx_wse_exercise_name  ON workout_session_exercises(user_id, exercise_name);


-- ---------------------------------------------------------------------------
-- workout_session_sets
-- ---------------------------------------------------------------------------
-- Individual set executed during a session exercise.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_session_sets (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_session_exercise_id UUID        NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
    set_number                  SMALLINT    NOT NULL,
    weight_kg                   NUMERIC(7, 2),
    reps                        SMALLINT,
    is_pr                       BOOLEAN     NOT NULL DEFAULT FALSE,  -- personal record flag
    rpe                         NUMERIC(4, 1) CHECK (rpe BETWEEN 1 AND 10),  -- Rate of Perceived Exertion
    notes                       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wss_user_id        ON workout_session_sets(user_id);
CREATE INDEX idx_wss_session_ex_id  ON workout_session_sets(workout_session_exercise_id);
CREATE INDEX idx_wss_is_pr          ON workout_session_sets(user_id, is_pr) WHERE is_pr = TRUE;


-- ---------------------------------------------------------------------------
-- cardio_profiles
-- ---------------------------------------------------------------------------
-- Cardio configuration associated with the user (linked to training context).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cardio_profiles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    does_cardio     BOOLEAN     NOT NULL DEFAULT FALSE,
    cardio_type     TEXT,       -- e.g. 'running', 'cycling', 'HIIT'
    intensity       TEXT,       -- 'low', 'moderate', 'high'
    duration_min    SMALLINT,
    frequency_week  SMALLINT,
    moment          TEXT,       -- 'before_training', 'after_training', 'separate_session', 'morning', 'evening'
    objective       TEXT,
    notes           TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cardio_profiles_user_id ON cardio_profiles(user_id);


-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
-- A single meal entry (one row per meal, not per food item).
-- Food items and macros are stored in the JSONB `items` field to avoid
-- a separate junction table for v1; can be normalised in a future migration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meals (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
    meal_time       TIME,
    meal_name       TEXT        NOT NULL,    -- e.g. 'Café da manhã', 'Almoço'
    source          meal_source NOT NULL DEFAULT 'manual',
    -- Aggregated macros (computed or AI-returned)
    calories_kcal   NUMERIC(8, 2),
    protein_g       NUMERIC(7, 2),
    carbs_g         NUMERIC(7, 2),
    fat_g           NUMERIC(7, 2),
    -- Structured food items list
    items           JSONB       NOT NULL DEFAULT '[]',
    -- e.g. [{"name":"Frango grelhado","qty_g":150,"kcal":247,"prot":46.4,"carbs":0,"fat":5.4}]
    notes           TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_user_id   ON meals(user_id);
CREATE INDEX idx_meals_date      ON meals(user_id, meal_date DESC);
CREATE INDEX idx_meals_source    ON meals(source);


-- ---------------------------------------------------------------------------
-- diet_analyses
-- ---------------------------------------------------------------------------
-- Results of AI diet analysis (summaries, recommendations, scores).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diet_analyses (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_date       DATE    NOT NULL DEFAULT CURRENT_DATE,
    source              meal_source NOT NULL DEFAULT 'ai_analysis',
    -- AI-returned summary
    total_calories_kcal NUMERIC(8, 2),
    total_protein_g     NUMERIC(7, 2),
    total_carbs_g       NUMERIC(7, 2),
    total_fat_g         NUMERIC(7, 2),
    positive_points     TEXT[],
    improvement_points  TEXT[],
    recommendations     TEXT,
    raw_ai_response     JSONB   DEFAULT '{}',
    -- Reference to source file (if uploaded)
    file_asset_id       UUID,   -- FK added below after file_assets
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diet_analyses_user_id ON diet_analyses(user_id);
CREATE INDEX idx_diet_analyses_date    ON diet_analyses(user_id, analysis_date DESC);


-- ---------------------------------------------------------------------------
-- bioimpedance_imports
-- ---------------------------------------------------------------------------
-- Records each bioimpedance PDF import attempt.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bioimpedance_imports (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_asset_id       UUID,   -- FK added below
    import_date         DATE    NOT NULL DEFAULT CURRENT_DATE,
    status              TEXT    NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','review_pending','confirmed','failed')),
    -- Raw extracted JSON from AI
    raw_extraction      JSONB   DEFAULT '{}',
    -- Confirmed/applied data snapshot
    confirmed_data      JSONB   DEFAULT '{}',
    confirmed_at        TIMESTAMPTZ,
    error_message       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bioimpedance_imports_user_id ON bioimpedance_imports(user_id);
CREATE INDEX idx_bioimpedance_imports_status  ON bioimpedance_imports(status);
CREATE INDEX idx_bioimpedance_imports_date    ON bioimpedance_imports(import_date DESC);


-- ---------------------------------------------------------------------------
-- medication_entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medication_entries (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT                NOT NULL,
    category        medication_category NOT NULL DEFAULT 'medicamento',
    dose            TEXT,               -- e.g. '200mg', '1UI'
    frequency       TEXT,               -- e.g. 'daily', '2x per week'
    route           TEXT,               -- e.g. 'oral', 'subcutaneous', 'intramuscular'
    start_date      DATE,
    end_date        DATE,
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    source          TEXT                NOT NULL DEFAULT 'manual'
                                        CHECK (source IN ('manual', 'file_import')),
    file_asset_id   UUID,               -- FK added below
    observations    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medication_entries_user_id    ON medication_entries(user_id);
CREATE INDEX idx_medication_entries_category   ON medication_entries(category);
CREATE INDEX idx_medication_entries_is_active  ON medication_entries(user_id, is_active);


-- ---------------------------------------------------------------------------
-- exam_reports
-- ---------------------------------------------------------------------------
-- An exam report (laudo) uploaded or pasted by the user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_reports (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
    lab_name        TEXT,
    source          TEXT    NOT NULL DEFAULT 'file_import'
                            CHECK (source IN ('file_import', 'pasted_text', 'manual')),
    raw_text        TEXT,
    file_asset_id   UUID,   -- FK added below
    status          TEXT    NOT NULL DEFAULT 'processed'
                            CHECK (status IN ('pending','processing','processed','failed')),
    notes           TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_reports_user_id  ON exam_reports(user_id);
CREATE INDEX idx_exam_reports_date     ON exam_reports(user_id, report_date DESC);
CREATE INDEX idx_exam_reports_status   ON exam_reports(status);


-- ---------------------------------------------------------------------------
-- exam_markers
-- ---------------------------------------------------------------------------
-- Individual lab markers extracted from an exam_report.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_markers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_report_id  UUID        NOT NULL REFERENCES exam_reports(id) ON DELETE CASCADE,
    marker_name     TEXT        NOT NULL,
    value           NUMERIC(12, 4),
    value_text      TEXT,       -- for non-numeric results
    unit            TEXT,
    reference_min   NUMERIC(12, 4),
    reference_max   NUMERIC(12, 4),
    reference_text  TEXT,       -- free-form reference range string
    status          exam_status NOT NULL DEFAULT 'normal',
    notes           TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_markers_user_id       ON exam_markers(user_id);
CREATE INDEX idx_exam_markers_report_id     ON exam_markers(exam_report_id);
CREATE INDEX idx_exam_markers_marker_name   ON exam_markers(user_id, marker_name);
CREATE INDEX idx_exam_markers_status        ON exam_markers(status);


-- ---------------------------------------------------------------------------
-- ai_analysis_reports
-- ---------------------------------------------------------------------------
-- Consolidated AI analysis (cross-module: workout, diet, body, exams, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_analysis_reports (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_date       DATE                NOT NULL DEFAULT CURRENT_DATE,
    status              ai_analysis_status  NOT NULL DEFAULT 'pending',
    -- Checklist completeness flags
    has_workout_data    BOOLEAN             NOT NULL DEFAULT FALSE,
    has_diet_data       BOOLEAN             NOT NULL DEFAULT FALSE,
    has_body_data       BOOLEAN             NOT NULL DEFAULT FALSE,
    has_cardio_data     BOOLEAN             NOT NULL DEFAULT FALSE,
    has_medication_data BOOLEAN             NOT NULL DEFAULT FALSE,
    has_exam_data       BOOLEAN             NOT NULL DEFAULT FALSE,
    -- Scores (0–100)
    score_workout       SMALLINT CHECK (score_workout BETWEEN 0 AND 100),
    score_diet          SMALLINT CHECK (score_diet BETWEEN 0 AND 100),
    score_sleep         SMALLINT CHECK (score_sleep BETWEEN 0 AND 100),
    score_hydration     SMALLINT CHECK (score_hydration BETWEEN 0 AND 100),
    score_cardio        SMALLINT CHECK (score_cardio BETWEEN 0 AND 100),
    score_overall       SMALLINT CHECK (score_overall BETWEEN 0 AND 100),
    -- Full AI response
    recommendations     TEXT[],
    macro_adjustments   JSONB DEFAULT '{}',
    -- e.g. {"calories_kcal": 2450, "protein_g": 200, "carbs_g": 280, "fat_g": 65}
    water_adjustment_ml INT,
    raw_ai_response     JSONB DEFAULT '{}',
    error_message       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_analysis_reports_user_id ON ai_analysis_reports(user_id);
CREATE INDEX idx_ai_analysis_reports_date    ON ai_analysis_reports(user_id, analysis_date DESC);
CREATE INDEX idx_ai_analysis_reports_status  ON ai_analysis_reports(status);


-- ---------------------------------------------------------------------------
-- file_assets
-- ---------------------------------------------------------------------------
-- Central registry for all uploaded files (Supabase Storage objects).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_assets (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type      file_asset_type NOT NULL DEFAULT 'other',
    original_name   TEXT            NOT NULL,
    storage_path    TEXT            NOT NULL,   -- Supabase Storage bucket path
    bucket_name     TEXT            NOT NULL,
    mime_type       TEXT,
    size_bytes      BIGINT,
    -- Extraction / processing
    is_processed    BOOLEAN         NOT NULL DEFAULT FALSE,
    processed_at    TIMESTAMPTZ,
    processing_error TEXT,
    -- Metadata
    metadata        JSONB           NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_assets_user_id    ON file_assets(user_id);
CREATE INDEX idx_file_assets_type       ON file_assets(asset_type);
CREATE INDEX idx_file_assets_processed  ON file_assets(is_processed);


-- ---------------------------------------------------------------------------
-- Deferred FK constraints from tables referencing file_assets
-- ---------------------------------------------------------------------------
ALTER TABLE diet_analyses
    ADD CONSTRAINT fk_diet_analyses_file_asset
    FOREIGN KEY (file_asset_id) REFERENCES file_assets(id) ON DELETE SET NULL;

ALTER TABLE bioimpedance_imports
    ADD CONSTRAINT fk_bioimpedance_imports_file_asset
    FOREIGN KEY (file_asset_id) REFERENCES file_assets(id) ON DELETE SET NULL;

ALTER TABLE medication_entries
    ADD CONSTRAINT fk_medication_entries_file_asset
    FOREIGN KEY (file_asset_id) REFERENCES file_assets(id) ON DELETE SET NULL;

ALTER TABLE exam_reports
    ADD CONSTRAINT fk_exam_reports_file_asset
    FOREIGN KEY (file_asset_id) REFERENCES file_assets(id) ON DELETE SET NULL;


-- =============================================================================
-- updated_at TRIGGERS
-- (Function handle_updated_at defined above)
-- =============================================================================

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_athlete_profiles_updated_at
    BEFORE UPDATE ON athlete_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_body_segments_updated_at
    BEFORE UPDATE ON body_segments
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_workout_days_updated_at
    BEFORE UPDATE ON workout_days
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_workout_exercises_updated_at
    BEFORE UPDATE ON workout_exercises
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_workout_sessions_updated_at
    BEFORE UPDATE ON workout_sessions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_workout_session_exercises_updated_at
    BEFORE UPDATE ON workout_session_exercises
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_workout_session_sets_updated_at
    BEFORE UPDATE ON workout_session_sets
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_cardio_profiles_updated_at
    BEFORE UPDATE ON cardio_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_meals_updated_at
    BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_diet_analyses_updated_at
    BEFORE UPDATE ON diet_analyses
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_bioimpedance_imports_updated_at
    BEFORE UPDATE ON bioimpedance_imports
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_medication_entries_updated_at
    BEFORE UPDATE ON medication_entries
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_exam_reports_updated_at
    BEFORE UPDATE ON exam_reports
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_exam_markers_updated_at
    BEFORE UPDATE ON exam_markers
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_ai_analysis_reports_updated_at
    BEFORE UPDATE ON ai_analysis_reports
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_file_assets_updated_at
    BEFORE UPDATE ON file_assets
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
