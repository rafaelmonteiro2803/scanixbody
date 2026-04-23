-- =============================================================================
-- SCANIX BODY - Migration 008: Cardio Sessions
-- =============================================================================
-- Adds the cardio_sessions table for logging individual cardio workouts:
--   • cardio_sessions: one row per session (date, type, duration, intensity)
--   • Soft-delete via deleted_at
--   • RLS: users can only see/edit their own rows (coaches can see students')
-- Run order: 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008
-- =============================================================================


-- =============================================================================
-- TABLE: cardio_sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS cardio_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  type             TEXT,
  duration_minutes INTEGER     CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  intensity        TEXT        CHECK (intensity IN ('low', 'moderate', 'high')),
  notes            TEXT,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cardio_sessions_user_id      ON cardio_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_cardio_sessions_session_date ON cardio_sessions (user_id, session_date DESC);

DROP TRIGGER IF EXISTS trg_cardio_sessions_updated_at ON cardio_sessions;
CREATE TRIGGER trg_cardio_sessions_updated_at
  BEFORE UPDATE ON cardio_sessions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE cardio_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cardio_sessions"   ON cardio_sessions;
DROP POLICY IF EXISTS "Users can insert their own cardio_sessions" ON cardio_sessions;
DROP POLICY IF EXISTS "Users can update their own cardio_sessions" ON cardio_sessions;
DROP POLICY IF EXISTS "Users can delete their own cardio_sessions" ON cardio_sessions;

CREATE POLICY "Users can view their own cardio_sessions" ON cardio_sessions
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_admin()
    OR (
      EXISTS (
        SELECT 1 FROM coach_students cs
        WHERE cs.user_id = auth.uid()
          AND cs.student_user_id = cardio_sessions.user_id
          AND cs.active = TRUE
      )
    )
  );

CREATE POLICY "Users can insert their own cardio_sessions" ON cardio_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cardio_sessions" ON cardio_sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own cardio_sessions" ON cardio_sessions
  FOR DELETE USING (user_id = auth.uid());
