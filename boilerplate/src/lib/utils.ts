/**
 * MY APP – General-purpose utility functions
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale'
// TODO: Import your locale, e.g. ptBR for Brazilian Portuguese:
// import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Tailwind class merging
// ---------------------------------------------------------------------------

/**
 * Merges Tailwind CSS class names, resolving conflicts with tailwind-merge
 * and handling conditional classes with clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/** Default date format token used across the app. */
const DEFAULT_DATE_FORMAT = 'MMM d, yyyy' // TODO: adjust to your locale

/**
 * Formats a Date object or ISO date string.
 *
 * @param date - A `Date` instance or an ISO 8601 string.
 * @param fmt  - date-fns format token.  Defaults to `"MMM d, yyyy"`.
 * @returns Formatted string, or an empty string when the date is invalid.
 */
export function formatDate(
  date: Date | string | null | undefined,
  fmt: string = DEFAULT_DATE_FORMAT,
): string {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return ''
  return format(parsed, fmt, { locale: enUS }) // TODO: swap locale if needed
}

// ---------------------------------------------------------------------------
// Number / currency formatting
// ---------------------------------------------------------------------------

/**
 * Formats a number as currency.
 *
 * @example formatCurrency(1234.5)  → "$1,234.50"
 *
 * TODO: Change the currency code and locale to match your market.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'USD',
  locale = 'en-US',
): string {
  if (amount == null || isNaN(amount)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Formats a percentage value with one decimal place.
 *
 * @example formatPercent(12.345) → "12.3%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—%'
  return `${value.toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Password generation
// ---------------------------------------------------------------------------

const PASSWORD_CHARSET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+'

/**
 * Generates a cryptographically secure random password.
 *
 * @param length - Desired password length.  Defaults to 12.
 */
export function generatePassword(length = 12): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map((n) => PASSWORD_CHARSET[n % PASSWORD_CHARSET.length])
      .join('')
  }

  // Node.js fallback (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto') as typeof import('crypto')
  const bytes = nodeCrypto.randomBytes(length)
  return Array.from(bytes)
    .map((b) => PASSWORD_CHARSET[b % PASSWORD_CHARSET.length])
    .join('')
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Truncates a string to `maxLength` characters, appending "…" when shortened.
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

/**
 * Converts a string to a URL-friendly slug.
 *
 * @example slugify("Hello World!") → "hello-world"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ---------------------------------------------------------------------------
// Async helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
