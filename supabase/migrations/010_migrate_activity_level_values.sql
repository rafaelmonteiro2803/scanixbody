-- Migration: Rename legacy activity_level DB values to canonical TS values
-- Pre-migration DB enum had: lightly_active, moderately_active, very_active, super_active
-- Post-migration 004, TS canonical values (light, moderate, active, very_active) were added to the enum.
-- This migration renames existing rows that still use the old names.
--
-- Mapping:
--   lightly_active    → light          (1.375 multiplier — same meaning)
--   moderately_active → moderate       (1.55  multiplier — same meaning)
--   super_active      → very_active    (1.9   multiplier — same meaning)
--   very_active       stays very_active (already canonical; semantics shifted but no rename needed)

UPDATE athlete_profiles
SET activity_level = 'light'
WHERE activity_level = 'lightly_active';

UPDATE athlete_profiles
SET activity_level = 'moderate'
WHERE activity_level = 'moderately_active';

UPDATE athlete_profiles
SET activity_level = 'very_active'
WHERE activity_level = 'super_active';
