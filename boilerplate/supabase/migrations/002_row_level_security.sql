-- =============================================================================
-- MY APP - Migration 002: Row Level Security
-- =============================================================================
-- Enables RLS on all tables and creates policies so that:
--   • Regular users can only access their own rows.
--   • Admins (admin / super_admin) can access all rows.
--   • audit_logs is restricted to admins only.
--
-- Run order: 001 → 002 → 003
--
-- TODO: Extend these policies to match your access model.
--       If you add new tables, copy the pattern below and add
--       them here before enabling RLS.
-- =============================================================================


-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_user_role()
-- Returns the role of the currently authenticated user from the profiles table.
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
-- TRUE when the caller has role 'admin' or 'super_admin'.
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

-- ---------------------------------------------------------------------------
-- is_manager()
-- TRUE when the caller has role 'manager', 'admin', or 'super_admin'.
-- TODO: Adjust this helper to match your role hierarchy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_manager()
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
          AND  role IN ('manager', 'admin', 'super_admin')
    );
$$;


-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- TODO: Add new tables here when you create them.


-- =============================================================================
-- POLICIES: profiles
-- =============================================================================

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

-- Hard deletes blocked for regular users; admins only (soft-delete preferred).
CREATE POLICY "profiles_delete_admin_only"
    ON profiles FOR DELETE
    USING ( is_admin() );


-- =============================================================================
-- POLICIES: audit_logs
-- =============================================================================
-- Append-only from trusted server code. Regular users cannot read audit logs.

CREATE POLICY "audit_logs_select_admin"
    ON audit_logs FOR SELECT
    USING ( is_admin() );

CREATE POLICY "audit_logs_insert_authenticated"
    ON audit_logs FOR INSERT
    WITH CHECK ( auth.uid() IS NOT NULL );

-- No UPDATE or DELETE policies → effectively immutable for JS client.


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


-- =============================================================================
-- POLICIES: categories
-- =============================================================================
-- TODO: Decide if categories are public (any user reads) or admin-managed.
--       The example below makes them publicly readable, admin-writable.

CREATE POLICY "categories_select_all"
    ON categories FOR SELECT
    USING ( TRUE );   -- public read

CREATE POLICY "categories_insert_admin"
    ON categories FOR INSERT
    WITH CHECK ( is_admin() );

CREATE POLICY "categories_update_admin"
    ON categories FOR UPDATE
    USING  ( is_admin() )
    WITH CHECK ( is_admin() );

CREATE POLICY "categories_delete_admin"
    ON categories FOR DELETE
    USING ( is_admin() );


-- =============================================================================
-- POLICIES: products
-- =============================================================================
-- TODO: Adjust if products belong to an organisation instead of a single user.

CREATE POLICY "products_select"
    ON products FOR SELECT
    USING ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "products_insert"
    ON products FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "products_update"
    ON products FOR UPDATE
    USING  ( user_id = auth.uid() OR is_admin() )
    WITH CHECK ( user_id = auth.uid() OR is_admin() );

CREATE POLICY "products_delete"
    ON products FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: orders
-- =============================================================================

CREATE POLICY "orders_select"
    ON orders FOR SELECT
    USING ( user_id = auth.uid() OR is_manager() );

CREATE POLICY "orders_insert"
    ON orders FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "orders_update"
    ON orders FOR UPDATE
    USING  ( user_id = auth.uid() OR is_manager() )
    WITH CHECK ( user_id = auth.uid() OR is_manager() );

CREATE POLICY "orders_delete"
    ON orders FOR DELETE
    USING ( user_id = auth.uid() OR is_admin() );


-- =============================================================================
-- POLICIES: order_items
-- =============================================================================

CREATE POLICY "order_items_select"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id
              AND (o.user_id = auth.uid() OR is_manager())
        )
    );

CREATE POLICY "order_items_insert"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id
              AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "order_items_update"
    ON order_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id
              AND (o.user_id = auth.uid() OR is_manager())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id
              AND (o.user_id = auth.uid() OR is_manager())
        )
    );

CREATE POLICY "order_items_delete"
    ON order_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id
              AND (o.user_id = auth.uid() OR is_admin())
        )
    );
