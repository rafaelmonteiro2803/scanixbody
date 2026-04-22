-- =============================================================================
-- MY APP - Migration 003: Functions and Triggers
-- =============================================================================
-- Application-level SQL functions and the auth hook trigger.
-- Assumes migrations 001 and 002 have already been applied.
--
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
        full_name,
        email,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        'user',          -- TODO: change default role if needed
        'first_access',  -- forces the app layer to prompt for onboarding
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

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
-- so that 003 can be applied independently in CI if needed.
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
-- action occurs.
--
-- Parameters:
--   p_user_id     – UUID of the acting user (NULL for system/anonymous events)
--   p_action      – Verb in UPPER_SNAKE_CASE, e.g. 'LOGIN', 'PRODUCT_CREATED'
--   p_resource    – Table or conceptual resource name, e.g. 'product'
--   p_resource_id – UUID of the affected row (may be NULL)
--   p_metadata    – Additional context as JSON
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
-- 4. get_user_stats()
-- =============================================================================
-- Returns a high-level JSON summary for a given user.
-- TODO: Replace/extend this with domain-specific aggregate queries.
--
-- Returned JSON shape (example):
-- {
--   "total_products": 12,
--   "total_orders": 5,
--   "first_created_at": "2024-01-10",
--   "last_updated_at": "2025-04-10"
-- }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'total_products',  (SELECT COUNT(*) FROM products WHERE user_id = p_user_id AND deleted_at IS NULL),
        'total_orders',    (SELECT COUNT(*) FROM orders   WHERE user_id = p_user_id AND deleted_at IS NULL),
        'first_created_at', (SELECT MIN(created_at) FROM products WHERE user_id = p_user_id),
        'last_updated_at',  (SELECT MAX(updated_at) FROM products WHERE user_id = p_user_id)
    );
$$;


-- =============================================================================
-- 5. Grants
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_user_role()                               TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin()                                    TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager()                                  TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit(UUID, TEXT, TEXT, UUID, JSONB)      TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID)                          TO authenticated;
