/**
 * MY APP – Application-wide constants
 *
 * Single source of truth for configuration values, labels, and routing
 * constants used throughout the app.
 *
 * TODO: Replace all occurrences of "My App" / "my-app" with your app name.
 */

// ---------------------------------------------------------------------------
// Application metadata
// ---------------------------------------------------------------------------

export const APP_NAME = 'My App' as const              // TODO: replace
export const APP_VERSION = '1.0.0' as const
export const APP_DESCRIPTION = 'My App description' as const  // TODO: replace

// ---------------------------------------------------------------------------
// User roles
// ---------------------------------------------------------------------------

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',   // TODO: adjust to match your SQL enum
  OPERATOR: 'operator',
  USER: 'user',
} as const

export type RoleKey = keyof typeof ROLES
export type RoleValue = (typeof ROLES)[RoleKey]

export const ROLE_LABELS: Record<RoleValue, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  manager: 'Manager',       // TODO: localise labels
  operator: 'Operator',
  user: 'User',
}

/** Roles that have access to the /admin section */
export const ADMIN_ROLES: ReadonlySet<RoleValue> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
])

// ---------------------------------------------------------------------------
// User statuses
// ---------------------------------------------------------------------------

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  FIRST_ACCESS: 'first_access',
} as const

export type UserStatusValue =
  (typeof USER_STATUSES)[keyof typeof USER_STATUSES]

export const USER_STATUS_LABELS: Record<UserStatusValue, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blocked: 'Blocked',
  first_access: 'First Access',
}

export const USER_STATUS_COLORS: Record<
  UserStatusValue,
  { bg: string; text: string }
> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800' },
  first_access: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
}

// ---------------------------------------------------------------------------
// Domain entity statuses
// TODO: Replace/extend with your own domain statuses and labels.
// ---------------------------------------------------------------------------

export const ITEM_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const

export const ITEM_STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// ---------------------------------------------------------------------------
// File upload constraints
// ---------------------------------------------------------------------------

/** Maximum file size allowed for uploads: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB in bytes

export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf'],
  all: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ],
} as const

export const ALLOWED_FILE_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  documents: ['.pdf'],
  all: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'],
} as const

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  PER_PAGE_OPTIONS: [10, 20, 50, 100] as const,
  MAX_PER_PAGE: 100,
} as const

// ---------------------------------------------------------------------------
// API route constants
// ---------------------------------------------------------------------------

export const API_ROUTES = {
  // Admin
  ADMIN_USERS: '/api/v1/admin/users',

  // Domain entities — TODO: rename/add routes for your own domain
  PRODUCTS: '/api/v1/products',
  PRODUCT_BY_ID: (id: string) => `/api/v1/products/${id}`,

  ORDERS: '/api/v1/orders',
  ORDER_BY_ID: (id: string) => `/api/v1/orders/${id}`,

  // Files
  UPLOADS: '/api/v1/uploads',
} as const

// ---------------------------------------------------------------------------
// Page routes (client navigation)
// ---------------------------------------------------------------------------

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/recuperar-senha',
  RESET_PASSWORD: '/redefinir-senha',
  FIRST_ACCESS: '/primeiro-acesso',
  DASHBOARD: '/dashboard',

  // TODO: rename/add your own app routes
  PRODUCTS: '/products',
  ORDERS: '/orders',
  SETTINGS: '/configuracoes',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUDIT: '/admin/audit',
} as const

// ---------------------------------------------------------------------------
// Audit log actions
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_CHANGED: 'auth.password_changed',

  // Users / profiles
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_BLOCKED: 'user.blocked',
  USER_UNBLOCKED: 'user.unblocked',
  USER_DELETED: 'user.deleted',
  PROFILE_UPDATED: 'profile.updated',

  // Admin
  ADMIN_PASSWORD_RESET: 'admin.password_reset',

  // TODO: Add domain-specific audit actions
  // PRODUCT_CREATED: 'product.created',
  // PRODUCT_UPDATED: 'product.updated',
  // PRODUCT_DELETED: 'product.deleted',
  // ORDER_CREATED: 'order.created',
  // ORDER_STATUS_CHANGED: 'order.status_changed',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// ---------------------------------------------------------------------------
// Audit log resources
// ---------------------------------------------------------------------------

export const AUDIT_RESOURCES = {
  AUTH: 'auth',
  USER: 'user',
  PROFILE: 'profile',
  // TODO: Add domain-specific resources
  // PRODUCT: 'product',
  // ORDER: 'order',
  // CATEGORY: 'category',
} as const

export type AuditResource =
  (typeof AUDIT_RESOURCES)[keyof typeof AUDIT_RESOURCES]
