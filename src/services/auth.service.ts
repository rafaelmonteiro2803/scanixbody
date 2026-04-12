/**
 * SCANIX BODY – Auth Service
 *
 * Wraps Supabase Auth methods and emits audit log entries for every
 * significant authentication event (login, logout, password operations).
 *
 * All methods are designed to be called from Server Actions or Route Handlers.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
// User and Session types are re-exported from @supabase/ssr (which bundles supabase-js)
import type { User, Session } from '@supabase/ssr'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AuthResult {
  user: User | null
  session: Session | null
  error: string | null
}

export type { User, Session }

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AuthServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const authService = {
  /**
   * Signs the user in with email and password.
   * Writes an `auth.login` audit log entry on success.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, session: null, error: error.message }
    }

    // Fire-and-forget audit log – never let it block the sign-in response.
    void auditService.log(
      AUDIT_ACTIONS.LOGIN,
      AUDIT_RESOURCES.AUTH,
      data.user?.id,
      { email: data.user?.email },
    )

    return {
      user: data.user,
      session: data.session,
      error: null,
    }
  },

  /**
   * Signs the current user out.
   * Writes an `auth.logout` audit log entry before destroying the session.
   */
  async signOut(): Promise<void> {
    const supabase = await createClient()

    // Capture the user before the session is destroyed.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    void auditService.log(
      AUDIT_ACTIONS.LOGOUT,
      AUDIT_RESOURCES.AUTH,
      user?.id ?? null,
      { email: user?.email },
    )

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new AuthServiceError(
        `Sign-out failed: ${error.message}`,
        error.code,
      )
    }
  },

  /**
   * Sends a password-reset email to the given address.
   * Writes an `auth.password_reset_requested` audit log entry.
   */
  async resetPassword(email: string): Promise<void> {
    const supabase = await createClient()

    const appUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : ((globalThis as any).process?.env?.['NEXT_PUBLIC_APP_URL'] as string | undefined) ?? ''
    const redirectTo = `${appUrl}/redefinir-senha`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      throw new AuthServiceError(
        `Password reset request failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      AUDIT_RESOURCES.AUTH,
      null,
      { email },
    )
  },

  /**
   * Updates the authenticated user's password.
   * Requires an active session (user must be signed in or have a valid
   * recovery token from the reset email).
   * Writes an `auth.password_changed` audit log entry on success.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthServiceError('No authenticated user found.', 'no_session')
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new AuthServiceError(
        `Password update failed: ${error.message}`,
        error.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      AUDIT_RESOURCES.AUTH,
      user.id,
      { email: user.email },
    )
  },

  /**
   * Returns the currently authenticated user, validated against the
   * Supabase Auth server (not just the local JWT).
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // getUser returns an error when there is no session, which is expected.
      return null
    }

    return user
  },

  /**
   * Returns the current session, or `null` if not authenticated.
   *
   * Prefer `getCurrentUser()` when you only need the user identity, as
   * `getSession()` does not validate the JWT against the server.
   */
  async getSession(): Promise<Session | null> {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return null
    }

    return session
  },
}

export default authService
