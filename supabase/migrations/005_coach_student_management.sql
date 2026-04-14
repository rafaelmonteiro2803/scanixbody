-- =============================================================================
-- SCANIX BODY - Migration 005: Coach-Student Management
-- =============================================================================
-- Adds the coach-student relationship system:
--   • coach_students table: links a coach user to one or more student users
--   • is_coach_of(student_user_id): helper used in RLS policies
--   • Updated RLS on all user-data tables to allow coach read/write access
--     for their assigned students
-- Run order: 001 → 002 → 003 → 004 → 005
-- =============================================================================


-- =============================================================================
-- TABLE: coach_students
-- =============================================================================
-- Each row links a coach (role = 'coach') to a student (role = 'usuario_final').
-- A coach may have many students; a student may have many coaches.
-- Soft-deactivation via active = FALSE (preserves history).

-- user_id = the coach's auth.users id (row owner, consistent with all other tables).
-- student_user_id = the athlete being coached.
CREATE TABLE IF NOT EXISTS coach_students (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, student_user_id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_coach_students_user_id    ON coach_students (user_id);
CREATE INDEX IF NOT EXISTS idx_coach_students_student_id ON coach_students (student_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_students_active     ON coach_students (user_id, active);

-- Auto-timestamp trigger
CREATE OR REPLACE TRIGGER trg_coach_students_updated_at
  BEFORE UPDATE ON coach_students
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- HELPER FUNCTION: is_coach_of(p_student_user_id)
-- =============================================================================
-- Returns TRUE when the currently authenticated user is an active coach of
-- the given student. Used inside RLS policies (SECURITY DEFINER so it can
-- query coach_students even if the caller has restricted permissions).

CREATE OR REPLACE FUNCTION is_coach_of(p_student_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   coach_students
    WHERE  user_id         = auth.uid()
      AND  student_user_id = p_student_user_id
      AND  active          = TRUE
  );
$$;


-- =============================================================================
-- ENABLE RLS ON coach_students
-- =============================================================================

ALTER TABLE coach_students ENABLE ROW LEVEL SECURITY;

-- Coaches can see their own links; students can see they are assigned; admins see all
CREATE POLICY "coach_students_select"
  ON coach_students FOR SELECT
  USING (
    user_id = auth.uid()
    OR student_user_id = auth.uid()
    OR is_admin()
  );

-- Only admins may create links (coaches don't self-assign students)
CREATE POLICY "coach_students_insert"
  ON coach_students FOR INSERT
  WITH CHECK ( is_admin() );

-- Only admins may update (activate/deactivate links)
CREATE POLICY "coach_students_update"
  ON coach_students FOR UPDATE
  USING  ( is_admin() )
  WITH CHECK ( is_admin() );

-- Only admins may delete links
CREATE POLICY "coach_students_delete"
  ON coach_students FOR DELETE
  USING ( is_admin() );


-- =============================================================================
-- UPDATE RLS POLICIES — extend every SELECT/INSERT/UPDATE/DELETE to include
-- coach access via is_coach_of(user_id).
--
-- Pattern for SELECT:  user_id = auth.uid() OR is_admin() OR is_coach_of(user_id)
-- Pattern for INSERT:  user_id = auth.uid() OR is_coach_of(user_id)
-- Pattern for UPDATE:  user_id = auth.uid() OR is_coach_of(user_id)
-- Pattern for DELETE:  user_id = auth.uid() OR is_admin() [coaches cannot delete]
-- =============================================================================


-- ── profiles ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING  ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );


-- ── athlete_profiles ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "athlete_profiles_select" ON athlete_profiles;
DROP POLICY IF EXISTS "athlete_profiles_insert" ON athlete_profiles;
DROP POLICY IF EXISTS "athlete_profiles_update" ON athlete_profiles;

CREATE POLICY "athlete_profiles_select"
  ON athlete_profiles FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "athlete_profiles_insert"
  ON athlete_profiles FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "athlete_profiles_update"
  ON athlete_profiles FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── body_segments ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "body_segments_select" ON body_segments;
DROP POLICY IF EXISTS "body_segments_insert" ON body_segments;
DROP POLICY IF EXISTS "body_segments_update" ON body_segments;

CREATE POLICY "body_segments_select"
  ON body_segments FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "body_segments_insert"
  ON body_segments FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "body_segments_update"
  ON body_segments FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── workout_days ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "workout_days_select" ON workout_days;
DROP POLICY IF EXISTS "workout_days_insert" ON workout_days;
DROP POLICY IF EXISTS "workout_days_update" ON workout_days;

CREATE POLICY "workout_days_select"
  ON workout_days FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "workout_days_insert"
  ON workout_days FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "workout_days_update"
  ON workout_days FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── workout_exercises ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "workout_exercises_select" ON workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_insert" ON workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_update" ON workout_exercises;

CREATE POLICY "workout_exercises_select"
  ON workout_exercises FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "workout_exercises_insert"
  ON workout_exercises FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "workout_exercises_update"
  ON workout_exercises FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── workout_sessions ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "workout_sessions_select" ON workout_sessions;
DROP POLICY IF EXISTS "workout_sessions_insert" ON workout_sessions;
DROP POLICY IF EXISTS "workout_sessions_update" ON workout_sessions;

CREATE POLICY "workout_sessions_select"
  ON workout_sessions FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "workout_sessions_insert"
  ON workout_sessions FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "workout_sessions_update"
  ON workout_sessions FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── workout_session_exercises ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "workout_session_exercises_select" ON workout_session_exercises;
DROP POLICY IF EXISTS "workout_session_exercises_insert" ON workout_session_exercises;
DROP POLICY IF EXISTS "workout_session_exercises_update" ON workout_session_exercises;

CREATE POLICY "workout_session_exercises_select"
  ON workout_session_exercises FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "workout_session_exercises_insert"
  ON workout_session_exercises FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "workout_session_exercises_update"
  ON workout_session_exercises FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── workout_session_sets ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "workout_session_sets_select" ON workout_session_sets;
DROP POLICY IF EXISTS "workout_session_sets_insert" ON workout_session_sets;
DROP POLICY IF EXISTS "workout_session_sets_update" ON workout_session_sets;

CREATE POLICY "workout_session_sets_select"
  ON workout_session_sets FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "workout_session_sets_insert"
  ON workout_session_sets FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "workout_session_sets_update"
  ON workout_session_sets FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── cardio_profiles ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cardio_profiles_select" ON cardio_profiles;
DROP POLICY IF EXISTS "cardio_profiles_insert" ON cardio_profiles;
DROP POLICY IF EXISTS "cardio_profiles_update" ON cardio_profiles;

CREATE POLICY "cardio_profiles_select"
  ON cardio_profiles FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "cardio_profiles_insert"
  ON cardio_profiles FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "cardio_profiles_update"
  ON cardio_profiles FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── meals ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "meals_select" ON meals;
DROP POLICY IF EXISTS "meals_insert" ON meals;
DROP POLICY IF EXISTS "meals_update" ON meals;

CREATE POLICY "meals_select"
  ON meals FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "meals_insert"
  ON meals FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "meals_update"
  ON meals FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── diet_analyses ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "diet_analyses_select" ON diet_analyses;
DROP POLICY IF EXISTS "diet_analyses_insert" ON diet_analyses;
DROP POLICY IF EXISTS "diet_analyses_update" ON diet_analyses;

CREATE POLICY "diet_analyses_select"
  ON diet_analyses FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "diet_analyses_insert"
  ON diet_analyses FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "diet_analyses_update"
  ON diet_analyses FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── bioimpedance_imports ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bioimpedance_imports_select" ON bioimpedance_imports;
DROP POLICY IF EXISTS "bioimpedance_imports_insert" ON bioimpedance_imports;
DROP POLICY IF EXISTS "bioimpedance_imports_update" ON bioimpedance_imports;

CREATE POLICY "bioimpedance_imports_select"
  ON bioimpedance_imports FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "bioimpedance_imports_insert"
  ON bioimpedance_imports FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "bioimpedance_imports_update"
  ON bioimpedance_imports FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── medication_entries ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "medication_entries_select" ON medication_entries;
DROP POLICY IF EXISTS "medication_entries_insert" ON medication_entries;
DROP POLICY IF EXISTS "medication_entries_update" ON medication_entries;

CREATE POLICY "medication_entries_select"
  ON medication_entries FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "medication_entries_insert"
  ON medication_entries FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "medication_entries_update"
  ON medication_entries FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── exam_reports ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "exam_reports_select" ON exam_reports;
DROP POLICY IF EXISTS "exam_reports_insert" ON exam_reports;
DROP POLICY IF EXISTS "exam_reports_update" ON exam_reports;

CREATE POLICY "exam_reports_select"
  ON exam_reports FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "exam_reports_insert"
  ON exam_reports FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "exam_reports_update"
  ON exam_reports FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── exam_markers ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "exam_markers_select" ON exam_markers;
DROP POLICY IF EXISTS "exam_markers_insert" ON exam_markers;
DROP POLICY IF EXISTS "exam_markers_update" ON exam_markers;

CREATE POLICY "exam_markers_select"
  ON exam_markers FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "exam_markers_insert"
  ON exam_markers FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "exam_markers_update"
  ON exam_markers FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── ai_analysis_reports ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ai_analysis_reports_select" ON ai_analysis_reports;
DROP POLICY IF EXISTS "ai_analysis_reports_insert" ON ai_analysis_reports;
DROP POLICY IF EXISTS "ai_analysis_reports_update" ON ai_analysis_reports;

CREATE POLICY "ai_analysis_reports_select"
  ON ai_analysis_reports FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "ai_analysis_reports_insert"
  ON ai_analysis_reports FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "ai_analysis_reports_update"
  ON ai_analysis_reports FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- ── file_assets ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "file_assets_select" ON file_assets;
DROP POLICY IF EXISTS "file_assets_insert" ON file_assets;
DROP POLICY IF EXISTS "file_assets_update" ON file_assets;

CREATE POLICY "file_assets_select"
  ON file_assets FOR SELECT
  USING ( user_id = auth.uid() OR is_admin() OR is_coach_of(user_id) );

CREATE POLICY "file_assets_insert"
  ON file_assets FOR INSERT
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );

CREATE POLICY "file_assets_update"
  ON file_assets FOR UPDATE
  USING  ( user_id = auth.uid() OR is_coach_of(user_id) )
  WITH CHECK ( user_id = auth.uid() OR is_coach_of(user_id) );


-- =============================================================================
-- GRANT execute on new function to authenticated role
-- =============================================================================

GRANT EXECUTE ON FUNCTION is_coach_of(UUID) TO authenticated;
