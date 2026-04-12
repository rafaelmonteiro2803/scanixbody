-- =============================================================================
-- SCANIX BODY - Migration 002: Row Level Security
-- =============================================================================
-- Enables RLS on all tables and creates policies so that:
--   • Regular users can only access their own rows.
--   • Admins (admin / super_admin) can access all rows.
--   • audit_logs is restricted to admins only.
-- Run order: 001 → 002 → 003
-- =============================================================================


-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_user_role()
-- Returns the role of the currently authenticated user from the profiles table.
-- Returns NULL when called outside an authenticated session.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::TEXT
    FROM   profiles
    WHERE  user_id = auth.uid()
    LIMIT  1;
$$;

-- ---------------------------------------------------------------------------
-- is_admin()
-- Convenience wrapper: TRUE when the caller has role 'admin' or 'super_admin'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM   profiles
        WHERE  user_id = auth.uid()
          AND  role IN ('admin', 'super_admin')
    );
$$;


-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_segments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days              ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_analyses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bioimpedance_imports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_markers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assets               ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- POLICIES: profiles
-- =============================================================================
-- Users can fully manage their own profile.
-- Admins can read all profiles.
-- Only the system / trigger may insert new profiles (see migration 003).

CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING  ( user_id = auth.uid() OR is_admin() )
    WITH CHECK ( user_id = auth.uid() OR is_admin() );

-- Hard deletes are blocked for regular users; admins only (soft-delete preferred).
CREATE POLICY "profiles_delete_admin_only"
    ON profiles FOR DELETE
    USING ( is_admin() );


-- =============================================================================
-- POLICIES: audit_logs
-- =============================================================================
-- Append-only from trusted server code. Regular users cannot read audit logs.
-- Admins can read everything; no user (including admins) can update/delete.

CREATE POLICY "audit_logs_select_admin"
    ON audit_logs FOR SELECT
    USING ( is_admin() );

-- INSERT allowed for any authenticated user (system calls use service-role key
-- which bypasses RLS, but this policy covers edge-function / client inserts).
CREATE POLICY "audit_logs_insert_authenticated"
    ON audit_logs FOR INSERT
    WITH CHECK ( auth.uid() IS NOT NULL );

-- No UPDATE or DELETE policies are created, making the table effectively immutable
-- for all roles via the Supabase JS client.


-- =============================================================================
-- POLICIES: athlete_profiles
-- =============================================================================

CREATE POLICY "athlete_profiles_select"
    ON athlete_profiles FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "athlete_profiles_insert"
    ON athlete_profiles FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "athlete_profiles_update"
    ON athlete_profiles FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "athlete_profiles_delete"
    ON athlete_profiles FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: body_segments
-- =============================================================================

CREATE POLICY "body_segments_select"
    ON body_segments FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "body_segments_insert"
    ON body_segments FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "body_segments_update"
    ON body_segments FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "body_segments_delete"
    ON body_segments FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: workout_days
-- =============================================================================

CREATE POLICY "workout_days_select"
    ON workout_days FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "workout_days_insert"
    ON workout_days FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_days_update"
    ON workout_days FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_days_delete"
    ON workout_days FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: workout_exercises
-- =============================================================================

CREATE POLICY "workout_exercises_select"
    ON workout_exercises FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "workout_exercises_insert"
    ON workout_exercises FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_exercises_update"
    ON workout_exercises FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_exercises_delete"
    ON workout_exercises FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: workout_sessions
-- =============================================================================

CREATE POLICY "workout_sessions_select"
    ON workout_sessions FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "workout_sessions_insert"
    ON workout_sessions FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_sessions_update"
    ON workout_sessions FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_sessions_delete"
    ON workout_sessions FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: workout_session_exercises
-- =============================================================================
-- These rows are owned via the session; we propagate user_id for direct checks.

CREATE POLICY "workout_session_exercises_select"
    ON workout_session_exercises FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "workout_session_exercises_insert"
    ON workout_session_exercises FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_session_exercises_update"
    ON workout_session_exercises FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_session_exercises_delete"
    ON workout_session_exercises FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: workout_session_sets
-- =============================================================================

CREATE POLICY "workout_session_sets_select"
    ON workout_session_sets FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "workout_session_sets_insert"
    ON workout_session_sets FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_session_sets_update"
    ON workout_session_sets FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "workout_session_sets_delete"
    ON workout_session_sets FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: cardio_profiles
-- =============================================================================

CREATE POLICY "cardio_profiles_select"
    ON cardio_profiles FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "cardio_profiles_insert"
    ON cardio_profiles FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "cardio_profiles_update"
    ON cardio_profiles FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "cardio_profiles_delete"
    ON cardio_profiles FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: meals
-- =============================================================================

CREATE POLICY "meals_select"
    ON meals FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "meals_insert"
    ON meals FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "meals_update"
    ON meals FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "meals_delete"
    ON meals FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: diet_analyses
-- =============================================================================

CREATE POLICY "diet_analyses_select"
    ON diet_analyses FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "diet_analyses_insert"
    ON diet_analyses FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "diet_analyses_update"
    ON diet_analyses FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "diet_analyses_delete"
    ON diet_analyses FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: bioimpedance_imports
-- =============================================================================

CREATE POLICY "bioimpedance_imports_select"
    ON bioimpedance_imports FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "bioimpedance_imports_insert"
    ON bioimpedance_imports FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "bioimpedance_imports_update"
    ON bioimpedance_imports FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "bioimpedance_imports_delete"
    ON bioimpedance_imports FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: medication_entries
-- =============================================================================

CREATE POLICY "medication_entries_select"
    ON medication_entries FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "medication_entries_insert"
    ON medication_entries FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "medication_entries_update"
    ON medication_entries FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "medication_entries_delete"
    ON medication_entries FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: exam_reports
-- =============================================================================

CREATE POLICY "exam_reports_select"
    ON exam_reports FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "exam_reports_insert"
    ON exam_reports FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "exam_reports_update"
    ON exam_reports FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "exam_reports_delete"
    ON exam_reports FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: exam_markers
-- =============================================================================

CREATE POLICY "exam_markers_select"
    ON exam_markers FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "exam_markers_insert"
    ON exam_markers FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "exam_markers_update"
    ON exam_markers FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "exam_markers_delete"
    ON exam_markers FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: ai_analysis_reports
-- =============================================================================

CREATE POLICY "ai_analysis_reports_select"
    ON ai_analysis_reports FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "ai_analysis_reports_insert"
    ON ai_analysis_reports FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "ai_analysis_reports_update"
    ON ai_analysis_reports FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "ai_analysis_reports_delete"
    ON ai_analysis_reports FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: file_assets
-- =============================================================================

CREATE POLICY "file_assets_select"
    ON file_assets FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "file_assets_insert"
    ON file_assets FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "file_assets_update"
    ON file_assets FOR UPDATE
    USING  ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "file_assets_delete"
    ON file_assets FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );
