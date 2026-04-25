-- Migration: Rename user_role enum value 'operador' → 'operator'
-- DB had 'operador' (Portuguese), TS/API uses 'operator' (English) everywhere.
-- PostgreSQL RENAME VALUE updates the enum definition and all existing rows automatically.

ALTER TYPE user_role RENAME VALUE 'operador' TO 'operator';
