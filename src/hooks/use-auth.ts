'use client'

/**
 * SCANIX BODY – useAuth hook
 *
 * Provides reactive, client-side access to the Supabase session, user, and
 * profile.  Subscribes to `onAuthStateChange` so that components re-render
 * whenever the session changes (login, logout, token refresh).
 *
 * Usage:
 *   const { user, session, profile, loading, signOut } = useAuth()
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { ProfilesRow } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAuthReturn {
  /** The authenticated Supabase user, or null when logged out */
  user: User | null
  /** The active session, or null when logged out */
  session: Session | null
  /** The user's profile row from `public.profiles`, or null */
  profile: ProfilesRow | null
  /** True until the initial session check completes */
  loading: boolean
  /** Sign the user out and clear state */
  signOut: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfilesRow | null>(null)
  const [loading, setLoading] = useState(true)

  // Track whether the component is still mounted to avoid setState on unmount
  const mountedRef = useRef(true)

  // ── Fetch profile ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!mountedRef.current) return

      if (error) {
        console.error('[useAuth] Failed to fetch profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
      }
    },
    [supabase],
  )

  // ── Initial session load ───────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true

    let ignore = false

    async function initSession() {
      // getSession is safe here for initial hydration; we validate with
      // getUser on protected routes (server-side).
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (ignore || !mountedRef.current) return

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id)
      }

      if (mountedRef.current) {
        setLoading(false)
      }
    }

    initSession()

    // ── Subscribe to auth state changes ──────────────────────────────────────

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }

      // Ensure loading is cleared after the first auth event
      if (loading) {
        setLoading(false)
      }
    })

    return () => {
      ignore = true
      mountedRef.current = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sign out ──────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    if (mountedRef.current) {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }, [supabase])

  return { user, session, profile, loading, signOut }
}

export default useAuth
