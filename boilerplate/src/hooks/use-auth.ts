'use client'

/**
 * MY APP – useAuth hook
 *
 * Returns the current Supabase Auth session and user profile from the
 * browser client.  This is the client-side view — for server-side access
 * use `createClient()` from `@/lib/supabase/server`.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { ProfilesRow } from '@/types/database.types'

interface UseAuthReturn {
  user: User | null
  profile: ProfilesRow | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfilesRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser)

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        setProfile(profileData)
      }

      setIsLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  }
}
