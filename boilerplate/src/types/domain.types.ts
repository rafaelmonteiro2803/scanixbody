/**
 * MY APP - Domain-Level Type Definitions
 *
 * These types live above the raw database layer. They represent:
 *   - Re-exported enum constants (const enums usable at runtime)
 *   - Data-Transfer Objects (DTOs) used in form submissions and API payloads
 *   - Generic API response wrappers
 *   - UI / client-state types
 *
 * Import database row shapes from `@/types/database.types` when you need
 * the raw Supabase row. Import from here when you are working with
 * application logic, forms, or UI state.
 *
 * TODO: Rename/replace the domain-specific constants below with your own.
 */

// ---------------------------------------------------------------------------
// Re-export primitive aliases so consumers only need one import
// ---------------------------------------------------------------------------

export type { ISODateTimeString, ISODateString, UUID, Json } from './database.types';

// ---------------------------------------------------------------------------
// Enum constants (runtime-safe – use these instead of raw string literals)
// ---------------------------------------------------------------------------

/** Role that a user can have within the platform */
export const Role = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',   // TODO: adjust to your role model
  OPERATOR: 'operator',
  USER: 'user',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Lifecycle status of a user account */
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  FIRST_ACCESS: 'first_access',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Status of a domain entity (e.g. product, content item) */
// TODO: Replace with your own domain statuses
export const ItemStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

/** Status of an order */
// TODO: Replace with your own order lifecycle
export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  error: ApiError | null;
}

/** Structured API error */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Generic query helpers
// ---------------------------------------------------------------------------

/** Pagination cursor used by query hooks */
export interface PaginationParams {
  page: number;
  per_page: number;
}

/** Generic sort descriptor */
export interface SortParams<T extends string = string> {
  field: T;
  direction: 'asc' | 'desc';
}

/** Filter + pagination + sort bundle passed to list queries */
export interface ListQueryParams<
  TFilter extends Record<string, unknown> = Record<string, unknown>,
  TSort extends string = string,
> {
  filter?: TFilter;
  pagination?: PaginationParams;
  sort?: SortParams<TSort>;
  search?: string;
}

// ---------------------------------------------------------------------------
// UI / client state types
// ---------------------------------------------------------------------------

/** Generic loading state machine */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Toast notification used by the global notification store */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

/** Confirmation dialog state */
export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Active modal / drawer identifier.
 * TODO: Replace these string literals with your own modal views.
 */
export type DrawerView =
  | 'product-create'
  | 'product-edit'
  | 'order-create'
  | 'order-detail'
  | 'category-create'
  | 'category-edit'
  | 'file-upload'
  | null;

/** Shape of the global UI Zustand store */
export interface UIState {
  activeDrawer: DrawerView;
  confirmDialog: ConfirmDialogState | null;
  toasts: ToastNotification[];
  isSidebarOpen: boolean;
  openDrawer: (view: DrawerView) => void;
  closeDrawer: () => void;
  showConfirm: (config: Omit<ConfirmDialogState, 'open'>) => void;
  dismissConfirm: () => void;
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
}

/** Shape of the authenticated user store */
export interface AuthState {
  userId: string | null;
  email: string | null;
  role: Role | null;
  status: UserStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: {
    userId: string;
    email: string;
    role: Role;
    status: UserStatus;
  }) => void;
  clearUser: () => void;
}

// ---------------------------------------------------------------------------
// Shared value objects
// ---------------------------------------------------------------------------

/** Lightweight user summary (used in admin views, relation pickers, etc.) */
export interface UserSummary {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  status: UserStatus;
}

/** Single data-point for progress/timeline charts */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// ---------------------------------------------------------------------------
// DTOs – used in React Hook Form schemas and API route payloads
// ---------------------------------------------------------------------------

// TODO: Replace the example DTOs below with your own domain DTOs.

/** Create or update a product */
export interface CreateProductDTO {
  category_id?: string | null;
  name: string;
  description?: string | null;
  price?: number | null;
  sku?: string | null;
  status?: ItemStatus;
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

/** Create or update a category */
export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  position?: number;
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

/** Create a new order */
export interface CreateOrderDTO {
  notes?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

/** Update an order status */
export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  notes?: string | null;
}
