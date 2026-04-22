-- =============================================================================
-- MY APP - Migration 001: Initial Schema
-- =============================================================================
-- Creates extensions, enums, core tables, indexes, and the updated_at
-- trigger infrastructure.
--
-- Run order: 001 → 002 → 003
--
-- TODO: Rename this file with your app name in comments.
-- TODO: Add domain-specific tables after the core tables below.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- TODO: Add domain-specific enums here (e.g. order_status, product_category).

CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'manager',   -- TODO: replace/extend roles to match your access model
    'operator',
    'user'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'blocked',
    'first_access'
);

CREATE TYPE file_asset_type AS ENUM (
    'avatar',
    'document',
    'image',
    'other'
    -- TODO: Add domain-specific file types (e.g. 'invoice', 'contract')
);

-- Example domain enum — replace with your own
CREATE TYPE item_status AS ENUM (
    'draft',
    'active',
    'archived'
);

CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
);


-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
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
-- CORE TABLES (keep these in every project)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Central user record, 1-to-1 with auth.users.
-- "first_access" status forces onboarding on the application layer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name             TEXT,
    email                 TEXT        NOT NULL,
    role                  user_role   NOT NULL DEFAULT 'user',
    status                user_status NOT NULL DEFAULT 'first_access',
    avatar_url            TEXT,
    phone                 TEXT,
    -- Security
    failed_login_attempts INT         NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ,
    -- Soft-delete
    deleted_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id    ON profiles(user_id);
CREATE INDEX idx_profiles_email      ON profiles(email);
CREATE INDEX idx_profiles_role       ON profiles(role);
CREATE INDEX idx_profiles_status     ON profiles(status);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
-- Immutable audit trail. Never UPDATE or DELETE rows from this table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,        -- e.g. 'LOGIN', 'PRODUCT_CREATED'
    resource    TEXT        NOT NULL,        -- e.g. 'auth', 'product'
    resource_id UUID,                        -- PK of the affected row (nullable)
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
-- file_assets
-- ---------------------------------------------------------------------------
-- Central registry for all uploaded files (Supabase Storage objects).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_assets (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type       file_asset_type NOT NULL DEFAULT 'other',
    original_name    TEXT            NOT NULL,
    storage_path     TEXT            NOT NULL,   -- Supabase Storage bucket path
    bucket_name      TEXT            NOT NULL,
    mime_type        TEXT,
    size_bytes       BIGINT,
    is_processed     BOOLEAN         NOT NULL DEFAULT FALSE,
    processed_at     TIMESTAMPTZ,
    processing_error TEXT,
    metadata         JSONB           NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_assets_user_id   ON file_assets(user_id);
CREATE INDEX idx_file_assets_type      ON file_assets(asset_type);
CREATE INDEX idx_file_assets_processed ON file_assets(is_processed);


-- =============================================================================
-- DOMAIN TABLES
-- TODO: Replace these example tables with your own domain model.
-- The pattern used here (user_id FK, soft-delete via deleted_at,
-- updated_at trigger) should be replicated in all your tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,
    description TEXT,
    parent_id   UUID        REFERENCES categories(id) ON DELETE SET NULL,
    position    SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug      ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);


-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id   UUID        REFERENCES categories(id) ON DELETE SET NULL,
    name          TEXT        NOT NULL,
    description   TEXT,
    price         NUMERIC(12, 2),
    sku           TEXT,
    status        item_status NOT NULL DEFAULT 'draft',
    metadata      JSONB       NOT NULL DEFAULT '{}',
    deleted_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_user_id     ON products(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status      ON products(status);
CREATE INDEX idx_products_deleted_at  ON products(deleted_at) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          order_status NOT NULL DEFAULT 'pending',
    total_amount    NUMERIC(12, 2),
    notes           TEXT,
    metadata        JSONB        NOT NULL DEFAULT '{}',
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);


-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID        REFERENCES products(id) ON DELETE SET NULL,
    quantity    INT         NOT NULL DEFAULT 1,
    unit_price  NUMERIC(12, 2),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);


-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_file_assets_updated_at
    BEFORE UPDATE ON file_assets
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
