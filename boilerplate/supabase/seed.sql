-- =============================================================================
-- MY APP - seed.sql
-- =============================================================================
-- Seed data for local development and staging environments.
--
-- HOW TO USE
-- ----------
-- Option A – Supabase CLI (recommended for local dev):
--   supabase db reset          # drops, re-migrates, then runs seed.sql
--
-- Option B – Apply manually:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Option C – Supabase Dashboard → SQL Editor → paste & run.
--
-- IMPORTANT
-- ---------
-- This file uses a fixed UUID for the super_admin user so that local
-- environments are predictable and repeatable.
-- NEVER use these credentials or UUIDs in a real production database.
--
-- TODO: Change the email/password below before sharing with your team.
--       Generate a new bcrypt hash with:
--       node -e "const b=require('bcryptjs');b.hash('YourPwd',10).then(console.log)"
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Step 1 – Insert the super_admin user into auth.users
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',            -- TODO: change to your admin email
    -- bcrypt hash of: Admin@Example2024!
    -- TODO: Replace with a fresh bcrypt hash for any shared/staging environment.
    '$2a$10$RgFj2V4VE7R6Y3pDn8XtNeq/7xQkHWzYqm3lZ5P.K8JuRwMvOsHQG',
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User","role":"super_admin"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 2 – Create the corresponding profile row
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (
    id,
    user_id,
    full_name,
    email,
    role,
    status,
    avatar_url,
    phone,
    failed_login_attempts,
    locked_until,
    last_login_at,
    password_changed_at,
    deleted_at,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Admin User',              -- TODO: change to your admin name
    'admin@example.com',       -- TODO: change to your admin email
    'super_admin',
    'active',
    NULL,
    NULL,
    0,
    NULL,
    NOW(),
    NOW(),
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        email      = EXCLUDED.email,
        role       = EXCLUDED.role,
        status     = EXCLUDED.status,
        updated_at = NOW();


-- ---------------------------------------------------------------------------
-- Step 3 – Seed example categories (domain data — adjust to your model)
-- ---------------------------------------------------------------------------
-- TODO: Replace or remove these with your own seed categories.

INSERT INTO public.categories (id, name, slug, description, position)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Electronics',   'electronics',   'Electronic devices and accessories', 1),
    ('10000000-0000-0000-0000-000000000002', 'Clothing',      'clothing',      'Apparel and fashion items',          2),
    ('10000000-0000-0000-0000-000000000003', 'Books',         'books',         'Physical and digital books',         3)
ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Step 4 – Audit log entry for the seed action
-- ---------------------------------------------------------------------------
INSERT INTO public.audit_logs (user_id, action, resource, resource_id, metadata, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SEED_SUPER_ADMIN_CREATED',
    'profiles',
    NULL,
    '{"source":"seed.sql","environment":"local_dev"}',
    NOW()
);


-- =============================================================================
-- Verification query (comment out before using in CI pipelines)
-- =============================================================================
-- SELECT id, full_name, email, role, status FROM profiles;
-- SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
