-- ================================================================
-- 006_storage_buckets.sql
-- Creates Supabase Storage buckets and access policies
-- ================================================================

-- Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uploads',       'uploads',       false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/gif']),
  ('exames',        'exames',        false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('bioimpedance',  'bioimpedance',  false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('avatars',       'avatars',       true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ── Policies for private buckets (uploads, exames, bioimpedance) ──────────

DO $$
BEGIN

  -- INSERT: each user can upload only to their own subfolder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_insert_own_files'
  ) THEN
    CREATE POLICY users_insert_own_files ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id IN ('uploads', 'exames', 'bioimpedance')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- SELECT: each user can read only their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_select_own_files'
  ) THEN
    CREATE POLICY users_select_own_files ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id IN ('uploads', 'exames', 'bioimpedance')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- DELETE: each user can delete only their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_delete_own_files'
  ) THEN
    CREATE POLICY users_delete_own_files ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id IN ('uploads', 'exames', 'bioimpedance')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- ── Policies for avatars bucket (public read, owner write) ────────────────

  -- Public SELECT for avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_public_select'
  ) THEN
    CREATE POLICY avatars_public_select ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars');
  END IF;

  -- Owner INSERT for avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_owner_insert'
  ) THEN
    CREATE POLICY avatars_owner_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Owner UPDATE for avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_owner_update'
  ) THEN
    CREATE POLICY avatars_owner_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

END $$;
