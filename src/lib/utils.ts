/**
 * SCANIX BODY – General-purpose utility functions
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

/** Default date-fns format token used across the app. */
const DEFAULT_DATE_FORMAT = "dd 'de' MMMM 'de' yyyy"

/**
 * Formats a Date object or ISO date string using date-fns with pt-BR locale.
 *
 * @param date   - A `Date` instance or an ISO 8601 string.
 * @param fmt    - date-fns format token.  Defaults to `"dd 'de' MMMM 'de' yyyy"`.
 * @returns      Formatted string, or an empty string when the date is invalid.
 */
export function formatDate(
  date: Date | string | null | undefined,
  fmt: string = DEFAULT_DATE_FORMAT,
): string {
  if (!date) return ''

  const parsed = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(parsed)) return ''

  return format(parsed, fmt, { locale: ptBR })
}

// ---------------------------------------------------------------------------
// Weight / volume formatting
// ---------------------------------------------------------------------------

/**
 * Formats a weight value in kilograms with one decimal place.
 *
 * @example formatWeight(87.5)  → "87,5 kg"
 * @example formatWeight(100)   → "100,0 kg"
 */
export function formatWeight(kg: number | null | undefined): string {
  if (kg == null || isNaN(kg)) return '– kg'
  return `${kg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
}

/**
 * Formats a high-volume value (e.g., training volume in kg) with no decimal
 * places and thousands separator.
 *
 * @example formatVolume(1240)   → "1.240 kg"
 * @example formatVolume(850.75) → "851 kg"
 */
export function formatVolume(kg: number | null | undefined): string {
  if (kg == null || isNaN(kg)) return '– kg'
  return `${Math.round(kg).toLocaleString('pt-BR')} kg`
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
 * @returns      A random string composed of letters, digits, and symbols.
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
 * Truncates a string to `maxLength` characters, appending an ellipsis when
 * the string was actually shortened.
 *
 * @param str       - The source string.
 * @param maxLength - Maximum number of characters to keep (inclusive).
 * @returns         The original string or a truncated version ending in "…".
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

// ---------------------------------------------------------------------------
// Async helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 * Useful for artificial delays in development or retry back-offs.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Number formatting helpers (bonus – used across dashboard components)
// ---------------------------------------------------------------------------

/**
 * Formats a percentage value with one decimal place.
 *
 * @example formatPercent(12.345) → "12,3%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '–%'
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/**
 * Formats a calorie value with no decimals and thousands separator.
 *
 * @example formatCalories(2350) → "2.350 kcal"
 */
export function formatCalories(kcal: number | null | undefined): string {
  if (kcal == null || isNaN(kcal)) return '– kcal'
  return `${Math.round(kcal).toLocaleString('pt-BR')} kcal`
}
