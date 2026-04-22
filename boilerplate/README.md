# My App — Boilerplate

A production-ready Next.js 14 + Supabase application boilerplate with authentication, role-based access control, admin panel, audit logging, and a generic CRUD module pattern.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database / Auth | Supabase (PostgreSQL + GoTrue) |
| Styling | Tailwind CSS v3 |
| Form validation | React Hook Form + Zod |
| State management | Zustand (global UI state) |
| HTTP / API | Next.js Route Handlers (REST) |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Package manager | Yarn 1.x |
| Runtime | Node.js 20.x |

---

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/            # Unauthenticated routes (login, password reset, first access)
│   ├── (app)/             # Protected routes (dashboard, domain modules, admin)
│   │   ├── admin/         # Admin-only pages (/admin/users, /admin/audit)
│   │   ├── dashboard/     # Landing page after login
│   │   └── products/      # Example domain module — duplicate for each entity
│   └── api/v1/            # REST API route handlers
│       ├── admin/users/   # Admin-only CRUD for users
│       └── products/      # Example entity CRUD
│
├── components/
│   ├── layout/            # Sidebar, Header, AppLayout
│   └── ui/                # Reusable UI primitives (Button, Table, Modal, etc.)
│
├── domain/                # Pure business logic / calculation functions (no DB calls)
│
├── hooks/                 # React hooks — one per domain entity + shared hooks
│
├── lib/
│   ├── api-helpers.ts     # withAuth, withRole, createApiResponse, parseBody
│   ├── constants.ts       # APP_NAME, ROLES, AUDIT_ACTIONS, ROUTES, API_ROUTES
│   ├── utils.ts           # cn(), formatDate(), formatCurrency(), generatePassword()
│   └── supabase/
│       ├── client.ts      # Browser client (use in Client Components)
│       ├── server.ts      # Server client + admin client
│       └── middleware.ts  # updateSession() helper for Next.js Edge Middleware
│
├── middleware.ts           # Edge middleware: session refresh + route protection
│
├── services/              # Data access layer — one file per domain entity
│   ├── audit.service.ts
│   ├── auth.service.ts
│   ├── admin.service.ts
│   └── products.service.ts  ← example, duplicate for your entities
│
├── stores/
│   └── app.store.ts       # Global Zustand store (sidebar, toasts, confirm dialog)
│
├── types/
│   ├── database.types.ts  # Raw Supabase row types (Row, Insert, Update per table)
│   └── domain.types.ts    # DTOs, API wrappers, UI state types
│
└── validators/
    ├── auth.validator.ts   # Login, reset, change password schemas
    ├── admin.validator.ts  # Create/update user schemas
    └── products.validator.ts  ← example, duplicate for your entities

supabase/
├── migrations/
│   ├── 001_initial_schema.sql   # Extensions, enums, core tables + domain examples
│   ├── 002_row_level_security.sql  # RLS enable + policies
│   └── 003_functions_and_triggers.sql  # handle_new_user, log_audit, get_user_stats
└── seed.sql               # Dev super-admin + example category data
```

### Key Patterns

#### 1. Route Protection (Middleware)
Every request goes through `src/middleware.ts` which:
- Refreshes the Supabase session cookie.
- Redirects unauthenticated users hitting protected routes to `/login`.
- Enforces role-based access to `/admin` routes.
- Forces `first_access` users to `/primeiro-acesso` (password reset flow).

#### 2. API Route Handlers
All API routes use the `withAuth` / `withRole` higher-order functions from `@/lib/api-helpers`:
```ts
export const GET = withAuth(async (request, ctx) => {
  // ctx.userId, ctx.email, ctx.role are guaranteed here
  return createApiResponse({ data: [] })
})

export const POST = withRole(['admin'], async (request, ctx) => {
  const { data, error } = await parseBody(request)
  const { data: input, error: validErr } = validateParams(mySchema, data)
  // ...
  return createApiResponse(result, 201)
})
```

All API responses follow the same envelope:
```json
{ "data": { ... }, "error": null, "status": 200 }
{ "data": null, "error": { "code": "NOT_FOUND", "message": "..." }, "status": 404 }
```

#### 3. Service Layer
Each domain entity has its own service file in `src/services/`.
Services:
- Accept `userId` as the first argument (for RLS safety).
- Throw typed errors (e.g. `ProductServiceError`).
- Call `auditService.log(...)` fire-and-forget for significant mutations.
- Use soft-delete via `deleted_at` (never hard-delete application rows).

#### 4. Row Level Security (Supabase)
The database enforces access at the SQL level. Key functions:
- `is_admin()` — true for `admin` / `super_admin` roles.
- `is_manager()` — true for `manager`, `admin`, `super_admin`.
- `get_user_role()` — returns the caller's role.

Every table has SELECT / INSERT / UPDATE / DELETE policies. The service layer still always scopes queries to `user_id = ctx.userId` as a defence-in-depth measure.

#### 5. Audit Logging
Every significant action must call:
```ts
void auditService.log('entity.action', 'entity', resourceId, { extra: 'metadata' })
```
The `void` prefix makes it fire-and-forget — logging failures never disrupt the main flow.

#### 6. Validators
Zod schemas in `src/validators/` are shared between the API route handler (server) and React Hook Form (client). Never duplicate validation logic.

---

## Setup

### Prerequisites
- Node.js 20+
- Yarn 1.22+
- Supabase account (free tier works)

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/my-app.git
cd my-app
yarn install
```

### 2. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. Copy the **Project URL**, **Anon Key**, and **Service Role Key** from Settings → API.

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in your Supabase credentials.
```

### 4. Run database migrations

Using the Supabase CLI (recommended):
```bash
# Install the CLI if needed
brew install supabase/tap/supabase   # macOS
# or: npm install -g supabase

# Apply migrations to your remote project
supabase db push --db-url "$DATABASE_DIRECT_URL"

# Seed development data (optional)
psql "$DATABASE_DIRECT_URL" -f supabase/seed.sql
```

Alternatively, paste each migration file into the Supabase SQL Editor in order (001 → 002 → 003).

### 5. Start the development server

```bash
yarn dev
# Open http://localhost:3000
```

Login with the seed credentials:
- **Email:** `admin@example.com`
- **Password:** `Admin@Example2024!`

> ⚠️ Change these immediately in any shared environment.

---

## How to Create a New Module

Follow these steps every time you add a new domain entity (e.g. "Invoice"):

### Step 1 — Database migration

Create `supabase/migrations/004_invoices.sql`:
```sql
CREATE TABLE IF NOT EXISTS invoices (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount     NUMERIC(12,2),
    status     TEXT        NOT NULL DEFAULT 'draft',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON invoices FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "invoices_insert" ON invoices FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "invoices_update" ON invoices FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "invoices_delete" ON invoices FOR DELETE
    USING (user_id = auth.uid() OR is_admin());

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Step 2 — Types

Add `InvoicesRow`, `InvoicesInsert`, `InvoicesUpdate` to `src/types/database.types.ts` and register in the `Database` interface.

### Step 3 — Validator

Create `src/validators/invoices.validator.ts`:
```ts
import { z } from 'zod'

export const createInvoiceSchema = z.object({
  amount: z.coerce.number().positive(),
  status: z.enum(['draft', 'sent', 'paid']).default('draft'),
})
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
```

### Step 4 — Service

Create `src/services/invoices.service.ts` (copy from `products.service.ts`, rename all references).

### Step 5 — API routes

Create `src/app/api/v1/invoices/route.ts` and `src/app/api/v1/invoices/[id]/route.ts`
(copy from `src/app/api/v1/products/`).

### Step 6 — Hook

Create `src/hooks/use-invoices.ts` (copy from `use-products.ts`, rename).

### Step 7 — Page

Create `src/app/(app)/invoices/page.tsx` (copy from `products/page.tsx`, rename).

### Step 8 — Sidebar

Add the new route to `mainNavItems` in `src/components/layout/Sidebar.tsx`:
```ts
{ label: 'Invoices', href: '/invoices', icon: FileText },
```

### Step 9 — Audit constants

Add to `AUDIT_ACTIONS` and `AUDIT_RESOURCES` in `src/lib/constants.ts`:
```ts
INVOICE_CREATED: 'invoice.created',
INVOICE_UPDATED: 'invoice.updated',
```

---

## Deployment

### Render

A `render.yaml` (if present) configures the web service. Update the environment variables in the Render dashboard.

### Vercel

```bash
vercel --prod
# Set env vars in the Vercel dashboard or via CLI
```

### Environment variables to set in production

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret key |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (no trailing slash) |
| `NODE_ENV` | `production` |

---

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start local development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript compiler check |
