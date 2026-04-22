/**
 * MY APP - Supabase Database Type Definitions
 *
 * Auto-aligned with the Supabase schema. Every table and relationship
 * is typed here so that the Supabase JS client is fully type-safe.
 *
 * Convention:
 *   Row    – the shape returned by SELECT queries
 *   Insert – required + optional columns when INSERTing a row
 *   Update – all columns optional (used in UPDATE calls)
 *
 * TODO: Regenerate this file after schema changes using:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 */

// ---------------------------------------------------------------------------
// Shared primitive aliases
// ---------------------------------------------------------------------------

/** ISO 8601 datetime string, e.g. "2024-01-15T10:30:00.000Z" */
export type ISODateTimeString = string;

/** ISO 8601 date string, e.g. "2024-01-15" */
export type ISODateString = string;

/** Postgres UUID string */
export type UUID = string;

/** Arbitrary JSON object stored in a JSONB column */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// ---------------------------------------------------------------------------
// Enum literals (mirrored as TypeScript union types)
// ---------------------------------------------------------------------------

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'   // TODO: adjust to match your role enum in SQL
  | 'operator'
  | 'user';

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'first_access';

export type FileAssetType =
  | 'avatar'
  | 'document'
  | 'image'
  | 'other';

// TODO: Replace these with your own domain enums
export type ItemStatus = 'draft' | 'active' | 'archived';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------

// ── profiles ─────────────────────────────────────────────────────────────────

export interface ProfilesRow {
  id: UUID;
  user_id: UUID;
  full_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  phone: string | null;
  failed_login_attempts: number;
  locked_until: ISODateTimeString | null;
  last_login_at: ISODateTimeString | null;
  password_changed_at: ISODateTimeString | null;
  deleted_at: ISODateTimeString | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface ProfilesInsert {
  id?: UUID;
  user_id: UUID;
  full_name?: string | null;
  email: string;
  role?: UserRole;
  status?: UserStatus;
  avatar_url?: string | null;
  phone?: string | null;
  failed_login_attempts?: number;
  locked_until?: ISODateTimeString | null;
  last_login_at?: ISODateTimeString | null;
  password_changed_at?: ISODateTimeString | null;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface ProfilesUpdate {
  id?: UUID;
  user_id?: UUID;
  full_name?: string | null;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar_url?: string | null;
  phone?: string | null;
  failed_login_attempts?: number;
  locked_until?: ISODateTimeString | null;
  last_login_at?: ISODateTimeString | null;
  password_changed_at?: ISODateTimeString | null;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── audit_logs ───────────────────────────────────────────────────────────────

export interface AuditLogsRow {
  id: UUID;
  user_id: UUID | null;
  action: string;
  resource: string;
  resource_id: UUID | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: ISODateTimeString;
}

export interface AuditLogsInsert {
  id?: UUID;
  user_id?: UUID | null;
  action: string;
  resource: string;
  resource_id?: UUID | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Json;
  created_at?: ISODateTimeString;
}

// ── file_assets ───────────────────────────────────────────────────────────────

export interface FileAssetsRow {
  id: UUID;
  user_id: UUID;
  asset_type: FileAssetType;
  original_name: string;
  storage_path: string;
  bucket_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  is_processed: boolean;
  processed_at: ISODateTimeString | null;
  processing_error: string | null;
  metadata: Json;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface FileAssetsInsert {
  id?: UUID;
  user_id: UUID;
  asset_type?: FileAssetType;
  original_name: string;
  storage_path: string;
  bucket_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  is_processed?: boolean;
  processed_at?: ISODateTimeString | null;
  processing_error?: string | null;
  metadata?: Json;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface FileAssetsUpdate {
  id?: UUID;
  user_id?: UUID;
  asset_type?: FileAssetType;
  original_name?: string;
  storage_path?: string;
  bucket_name?: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  is_processed?: boolean;
  processed_at?: ISODateTimeString | null;
  processing_error?: string | null;
  metadata?: Json;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── categories ────────────────────────────────────────────────────────────────
// TODO: Replace with your own domain entity if categories don't apply.

export interface CategoriesRow {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  parent_id: UUID | null;
  position: number;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface CategoriesInsert {
  id?: UUID;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: UUID | null;
  position?: number;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface CategoriesUpdate {
  id?: UUID;
  name?: string;
  slug?: string;
  description?: string | null;
  parent_id?: UUID | null;
  position?: number;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── products ──────────────────────────────────────────────────────────────────
// TODO: Replace with your own domain entity.

export interface ProductsRow {
  id: UUID;
  user_id: UUID;
  category_id: UUID | null;
  name: string;
  description: string | null;
  price: number | null;
  sku: string | null;
  status: ItemStatus;
  metadata: Json;
  deleted_at: ISODateTimeString | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface ProductsInsert {
  id?: UUID;
  user_id: UUID;
  category_id?: UUID | null;
  name: string;
  description?: string | null;
  price?: number | null;
  sku?: string | null;
  status?: ItemStatus;
  metadata?: Json;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface ProductsUpdate {
  id?: UUID;
  user_id?: UUID;
  category_id?: UUID | null;
  name?: string;
  description?: string | null;
  price?: number | null;
  sku?: string | null;
  status?: ItemStatus;
  metadata?: Json;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── orders ────────────────────────────────────────────────────────────────────
// TODO: Replace with your own domain entity.

export interface OrdersRow {
  id: UUID;
  user_id: UUID;
  status: OrderStatus;
  total_amount: number | null;
  notes: string | null;
  metadata: Json;
  deleted_at: ISODateTimeString | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface OrdersInsert {
  id?: UUID;
  user_id: UUID;
  status?: OrderStatus;
  total_amount?: number | null;
  notes?: string | null;
  metadata?: Json;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

export interface OrdersUpdate {
  id?: UUID;
  user_id?: UUID;
  status?: OrderStatus;
  total_amount?: number | null;
  notes?: string | null;
  metadata?: Json;
  deleted_at?: ISODateTimeString | null;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
}

// ── order_items ────────────────────────────────────────────────────────────────

export interface OrderItemsRow {
  id: UUID;
  order_id: UUID;
  product_id: UUID | null;
  quantity: number;
  unit_price: number | null;
  created_at: ISODateTimeString;
}

export interface OrderItemsInsert {
  id?: UUID;
  order_id: UUID;
  product_id?: UUID | null;
  quantity?: number;
  unit_price?: number | null;
  created_at?: ISODateTimeString;
}

export interface OrderItemsUpdate {
  id?: UUID;
  order_id?: UUID;
  product_id?: UUID | null;
  quantity?: number;
  unit_price?: number | null;
  created_at?: ISODateTimeString;
}

// ---------------------------------------------------------------------------
// Master Database type (compatible with Supabase createClient<Database>())
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: AuditLogsInsert;
        Update: Record<string, never>;
      };
      file_assets: {
        Row: FileAssetsRow;
        Insert: FileAssetsInsert;
        Update: FileAssetsUpdate;
      };
      categories: {
        Row: CategoriesRow;
        Insert: CategoriesInsert;
        Update: CategoriesUpdate;
      };
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
      };
      orders: {
        Row: OrdersRow;
        Insert: OrdersInsert;
        Update: OrdersUpdate;
      };
      order_items: {
        Row: OrderItemsRow;
        Insert: OrderItemsInsert;
        Update: OrderItemsUpdate;
      };
      // TODO: Add new tables here as you create them.
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      file_asset_type: FileAssetType;
      item_status: ItemStatus;
      order_status: OrderStatus;
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers (typed table row aliases used across the app)
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
