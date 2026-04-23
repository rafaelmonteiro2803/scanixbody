# Boilerplate Customisation Checklist

Use this file as a step-by-step guide every time you use this boilerplate for a new project.
Check each item off as you go.

---

## 1. Project Identity

- [ ] **`package.json`** — Change `name`, `version`, `description`
- [ ] **`src/lib/constants.ts`** — Change `APP_NAME`, `APP_VERSION`, `APP_DESCRIPTION`
- [ ] **`src/app/layout.tsx`** — Update `metadata.title` and `metadata.description`
- [ ] **`src/app/(auth)/layout.tsx`** — Replace "My App" in the footer
- [ ] **`src/components/layout/Sidebar.tsx`** — Replace "MY APP" logo text with your brand name/logo
- [ ] **`src/styles/globals.css`** — Adjust `--color-primary` and other design tokens
- [ ] **`tailwind.config.ts`** — Add your custom font if using one
- [ ] **`next.config.mjs`** — Add your image remote patterns and CDN domains
- [ ] **`supabase/seed.sql`** — Replace `admin@example.com` / `Admin User` with real credentials
- [ ] **`.env.example`** — Review and update placeholder descriptions
- [ ] **`stores/app.store.ts`** — Rename `my-app-store` to your app name in `persist`

---

## 2. Database / Supabase

- [ ] Create a new Supabase project (or reuse an existing one for staging)
- [ ] Apply migrations in order: `001` → `002` → `003` (→ your domain migrations)
- [ ] Run `seed.sql` in local dev only — **never in production**
- [ ] Change seed email/password in `supabase/seed.sql`
- [ ] Remove/rename placeholder domain tables (`products`, `orders`, `categories`, `order_items`) if not needed
- [ ] Add your own domain tables in a new `004_*.sql` migration
- [ ] Review RLS policies in `002_row_level_security.sql` — adjust roles and access patterns
- [ ] Update `src/types/database.types.ts` to match your schema (or regenerate with Supabase CLI)
- [ ] Set up Supabase Storage buckets if you need file uploads
- [ ] Configure Supabase Auth providers (email, OAuth, etc.) in the dashboard

---

## 3. User Roles & Access Control

- [ ] **`supabase/migrations/001_initial_schema.sql`** — Update the `user_role` ENUM values to match your access model
- [ ] **`src/types/database.types.ts`** — Update the `UserRole` union type
- [ ] **`src/types/domain.types.ts`** — Update the `Role` const and type
- [ ] **`src/lib/constants.ts`** — Update `ROLES`, `ROLE_LABELS`, `ADMIN_ROLES`
- [ ] **`src/middleware.ts`** — Update `ADMIN_ROLES`, `COACH_ROLES` (or remove coach pattern)
- [ ] **`src/validators/admin.validator.ts`** — Update role enum in Zod schemas
- [ ] **`src/services/admin.service.ts`** — Update default role in `createUser`
- [ ] **`src/app/api/v1/admin/users/route.ts`** — Update `withRole` allowed roles

---

## 4. Navigation & Routes

- [ ] **`src/components/layout/Sidebar.tsx`** — Replace `mainNavItems` with your app's navigation
- [ ] **`src/middleware.ts`** — Update `PUBLIC_ROUTES` and `PROTECTED_PREFIXES`
- [ ] **`src/lib/constants.ts`** — Update `ROUTES` and `API_ROUTES`
- [ ] Remove example module routes (`/products`, `/orders`) if not using them
- [ ] Add your new domain routes

---

## 5. Domain Models (Replace Example Entities)

The boilerplate ships with `products`, `orders`, `categories`, `order_items` as placeholder entities.
For each of your real entities, follow the pattern below and remove the placeholders.

**Per entity checklist:**
- [ ] Create database migration with the table, indexes, RLS policies, and trigger
- [ ] Add types in `src/types/database.types.ts` (Row, Insert, Update)
- [ ] Add DTOs in `src/types/domain.types.ts`
- [ ] Add Zod validator in `src/validators/`
- [ ] Create service in `src/services/` (copy `products.service.ts` as template)
- [ ] Create API routes in `src/app/api/v1/[entity]/` (copy `products/` as template)
- [ ] Create React hook in `src/hooks/` (copy `use-products.ts` as template)
- [ ] Create page in `src/app/(app)/[entity]/` (copy `products/page.tsx` as template)
- [ ] Add entity to `AUDIT_ACTIONS` and `AUDIT_RESOURCES` in `src/lib/constants.ts`
- [ ] Add nav item in `src/components/layout/Sidebar.tsx`

**Placeholder entities to remove when done:**
- [ ] Delete or repurpose `supabase/migrations/001_initial_schema.sql` placeholder tables
- [ ] Delete `src/services/products.service.ts` (or rename to your entity)
- [ ] Delete `src/validators/products.validator.ts` (or rename)
- [ ] Delete `src/hooks/use-products.ts` (or rename)
- [ ] Delete `src/app/(app)/products/` (or rename)
- [ ] Delete `src/app/api/v1/products/` (or rename)
- [ ] Remove products/orders from `src/types/database.types.ts` and `domain.types.ts`

---

## 6. Authentication Flows

- [ ] Update email/password labels from English to your locale (if needed)
- [ ] **`src/app/(auth)/login/page.tsx`** — Update heading, labels, and links
- [ ] **`src/app/(auth)/primeiro-acesso/page.tsx`** — Update onboarding copy; add fields you need to collect
- [ ] **`src/app/(auth)/recuperar-senha/`** — Create this page (forgot password form)
- [ ] **`src/app/(auth)/redefinir-senha/`** — Create this page (set new password after email link)
- [ ] **`src/services/auth.service.ts`** — Update `redirectTo` URL path if you changed the reset route
- [ ] Configure Supabase SMTP settings for transactional emails (Auth → SMTP Settings)

---

## 7. UI & Styling

- [ ] **`src/styles/globals.css`** — Set your brand color palette in CSS variables
- [ ] **`tailwind.config.ts`** — Add or remove custom tokens
- [ ] Replace placeholder copy ("My App", "Example Entity") in all page headings
- [ ] Add your favicon to `public/favicon.ico`
- [ ] Add your OG image for social sharing

---

## 8. Environment Variables

Copy `.env.example` → `.env.local` and set all required values:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Any optional vars you need (AI, analytics, storage, SMTP)

In production (Vercel / Render / Railway):
- [ ] Set all env vars in your hosting provider's dashboard
- [ ] Rotate the default seed password before going live
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser

---

## 9. CI/CD & Deployment

- [ ] Update `render.yaml` if using Render (or delete if not)
- [ ] Set up GitHub Actions or your preferred CI pipeline
- [ ] Add a `type-check` and `lint` step to CI
- [ ] Configure deployment previews for pull requests
- [ ] Set up database backup strategy in Supabase dashboard

---

## 10. Final Verification

Before going live:
- [ ] All `// TODO:` comments have been addressed
- [ ] Seed data removed from production database
- [ ] `NODE_ENV=production` is set
- [ ] Admin account has a strong, unique password
- [ ] Supabase RLS is enabled on all tables (verify in Table Editor → RLS)
- [ ] No secrets are committed to the repository (check `.gitignore`)
- [ ] Error monitoring is set up (e.g. Sentry, LogRocket)
- [ ] Analytics is configured (if applicable)
