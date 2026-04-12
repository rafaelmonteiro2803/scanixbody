-- =============================================================================
-- SCANIX BODY - Migration 003: Functions and Triggers
-- =============================================================================
-- Application-level SQL functions and the auth hook trigger.
-- Assumes migrations 001 and 002 have already been applied.
-- Run order: 001 → 002 → 003
-- =============================================================================


-- =============================================================================
-- 1. handle_new_user()
-- =============================================================================
-- Fired automatically after a new row is inserted into auth.users.
-- Creates a matching row in the public.profiles table with sensible defaults.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        name,
        email,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        -- Use display_name from raw_user_meta_data when available, fall back to email prefix.
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        'usuario_final',   -- default role; can be elevated by an admin later
        'first_access',    -- forces the app layer to prompt for onboarding
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;   -- idempotent: skip if profile already exists

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (Supabase platform table).
-- DROP first to allow re-running this migration idempotently.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- =============================================================================
-- 2. handle_updated_at()
-- =============================================================================
-- Generic trigger function that stamps updated_at = NOW() on every UPDATE.
-- Already created in migration 001; re-declared here with CREATE OR REPLACE
-- so that 003 can be applied independently of 001 if needed in CI.
-- ---------------------------------------------------------------------------
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
-- 3. log_audit()
-- =============================================================================
-- Inserts a structured record into audit_logs.
-- Call this from Edge Functions or server-side code whenever a significant
-- action occurs (login, profile change, AI analysis request, etc.).
--
-- Parameters:
--   p_user_id    – UUID of the acting user (NULL for system/anonymous events)
--   p_action     – Verb in UPPER_SNAKE_CASE, e.g. 'LOGIN', 'PROFILE_UPDATE'
--   p_resource   – Table or conceptual resource name, e.g. 'profiles'
--   p_resource_id – UUID of the affected row (may be NULL)
--   p_metadata   – Additional context as JSON, e.g. '{"ip":"1.2.3.4"}'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id     UUID,
    p_action      TEXT,
    p_resource    TEXT,
    p_resource_id UUID    DEFAULT NULL,
    p_metadata    JSONB   DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        metadata,
        created_at
    )
    VALUES (
        p_user_id,
        p_action,
        p_resource,
        p_resource_id,
        COALESCE(p_metadata, '{}'),
        NOW()
    );
END;
$$;


-- =============================================================================
-- 4. get_exercise_best_lift()
-- =============================================================================
-- Returns the single best (highest weight × reps) set for a given exercise
-- name belonging to the specified user.
--
-- Usage:
--   SELECT * FROM get_exercise_best_lift(
--       '00000000-0000-0000-0000-000000000001',
--       'Supino Reto'
--   );
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_exercise_best_lift(
    p_user_id       UUID,
    p_exercise_name TEXT
)
RETURNS TABLE (
    session_exercise_id UUID,
    session_date        DATE,
    weight_kg           NUMERIC,
    reps                SMALLINT,
    volume_kg           NUMERIC,
    is_pr               BOOLEAN,
    set_created_at      TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        wss.workout_session_exercise_id  AS session_exercise_id,
        ws.session_date,
        wss.weight_kg,
        wss.reps,
        ROUND((COALESCE(wss.weight_kg, 0) * COALESCE(wss.reps, 0))::NUMERIC, 2) AS volume_kg,
        wss.is_pr,
        wss.created_at AS set_created_at
    FROM workout_session_sets         wss
    JOIN workout_session_exercises    wse  ON wse.id         = wss.workout_session_exercise_id
    JOIN workout_sessions             ws   ON ws.id          = wse.workout_session_id
    WHERE wss.user_id                      = p_user_id
      AND LOWER(wse.exercise_name)         = LOWER(p_exercise_name)
      AND wss.weight_kg IS NOT NULL
      AND wss.reps       IS NOT NULL
    ORDER BY (wss.weight_kg * wss.reps) DESC, wss.weight_kg DESC
    LIMIT 1;
$$;


-- =============================================================================
-- 5. get_user_stats()
-- =============================================================================
-- Returns an aggregated JSON object with high-level training statistics for
-- the given user.  Designed for dashboard / overview screens.
--
-- Returned JSON shape:
-- {
--   "total_sessions"  : 42,
--   "total_sets"      : 630,
--   "total_volume_kg" : 125340.00,
--   "exercises_count" : 18,
--   "first_session_date" : "2024-01-10",
--   "last_session_date"  : "2025-04-10"
-- }
--
-- Usage:
--   SELECT get_user_stats('00000000-0000-0000-0000-000000000001');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'total_sessions',     COUNT(DISTINCT ws.id),
        'total_sets',         COUNT(DISTINCT wss.id),
        'total_volume_kg',    ROUND(
                                COALESCE(
                                    SUM(COALESCE(wss.weight_kg, 0) * COALESCE(wss.reps, 0)),
                                    0
                                )::NUMERIC,
                                2
                              ),
        'exercises_count',    COUNT(DISTINCT LOWER(wse.exercise_name)),
        'first_session_date', MIN(ws.session_date),
        'last_session_date',  MAX(ws.session_date)
    )
    FROM workout_sessions             ws
    LEFT JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
    LEFT JOIN workout_session_sets      wss ON wss.workout_session_exercise_id = wse.id
    WHERE ws.user_id = p_user_id;
$$;


-- =============================================================================
-- 6. Grants
-- =============================================================================
-- Allow authenticated users to call the public utility functions.
-- SECURITY DEFINER functions already run as the function owner, so explicit
-- EXECUTE grants ensure the anon/authenticated roles can invoke them via RPC.

GRANT EXECUTE ON FUNCTION get_user_role()         TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin()              TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exercise_best_lift(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID)    TO authenticated;
