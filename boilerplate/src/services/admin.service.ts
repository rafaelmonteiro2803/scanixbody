/**
 * MY APP – Admin Service
 *
 * Administrative operations: user management (create, block, unblock,
 * password reset), profile updates, and audit log access.
 *
 * Methods that create users or require bypassing RLS use the service-role
 * client (`createAdminClient`) — call them only from trusted server-side code.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generatePassword } from '@/lib/utils'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/constants'
import auditService from '@/services/audit.service'
import type { AuditLog } from '@/services/audit.service'
import type { ProfilesRow, ProfilesUpdate, UserRole, UserStatus } from '@/types/database.types'
import type { User as SupabaseAuthUser } from '@supabase/ssr'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Profile = ProfilesRow

export interface UserWithProfile {
  id: string
  email: string
  created_at: string
  profile: Profile | null
}

export interface CreateUserDTO {
  email: string
  password?: string
  full_name?: string
  role?: UserRole
  status?: UserStatus
}

export interface UpdateProfileDTO {
  full_name?: string | null
  avatar_url?: string | null
  role?: UserRole
  status?: UserStatus
}

export interface UserFilters {
  role?: UserRole
  status?: UserStatus
  search?: string
  page?: number
  perPage?: number
}

export interface AuditLogFilters {
  userId?: string
  action?: string
  resource?: string
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
}

class AdminServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AdminServiceError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const adminService = {
  /**
   * Returns a paginated list of users with their profiles.
   * Supports filtering by role, status, and a case-insensitive search.
   */
  async getUsers(filters?: UserFilters): Promise<UserWithProfile[]> {
    const adminSupabase = await createAdminClient()

    const page = filters?.page ?? 1
    const perPage = filters?.perPage ?? 20
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let profilesQuery = adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters?.role) profilesQuery = profilesQuery.eq('role', filters.role)
    if (filters?.status) profilesQuery = profilesQuery.eq('status', filters.status)

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      throw new AdminServiceError(
        `getUsers (profiles) failed: ${profilesError.message}`,
        profilesError.code,
      )
    }

    if (!profiles || profiles.length === 0) return []

    const { data: authUsersData, error: authError } =
      await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 })

    if (authError) {
      throw new AdminServiceError(
        `getUsers (auth.admin.listUsers) failed: ${authError.message}`,
      )
    }

    const authUserMap = new Map<string, SupabaseAuthUser>(
      (authUsersData?.users ?? []).map((u: SupabaseAuthUser) => [u.id, u]),
    )

    let results: UserWithProfile[] = (profiles as ProfilesRow[])
      .map((profile: ProfilesRow): UserWithProfile | null => {
        const authUser = authUserMap.get(profile.user_id)
        if (!authUser) return null
        return {
          id: authUser.id,
          email: authUser.email ?? '',
          created_at: authUser.created_at,
          profile,
        }
      })
      .filter((u): u is UserWithProfile => u !== null)

    if (filters?.search) {
      const term = filters.search.toLowerCase()
      results = results.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          (u.profile?.full_name ?? '').toLowerCase().includes(term),
      )
    }

    return results
  },

  /**
   * Returns a single user with their profile by auth user ID.
   */
  async getUserById(id: string): Promise<UserWithProfile | null> {
    const adminSupabase = await createAdminClient()

    const { data: authUser, error: authError } =
      await adminSupabase.auth.admin.getUserById(id)

    if (authError || !authUser?.user) {
      if (authError?.status === 404) return null
      throw new AdminServiceError(
        `getUserById (auth) failed: ${authError?.message ?? 'not found'}`,
      )
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single()

    return {
      id: authUser.user.id,
      email: authUser.user.email ?? '',
      created_at: authUser.user.created_at,
      profile: profile ?? null,
    }
  },

  /**
   * Creates a new user via the Supabase Admin Auth API (bypasses email
   * confirmation).
   */
  async createUser(data: CreateUserDTO): Promise<UserWithProfile> {
    const adminSupabase = await createAdminClient()

    const password = data.password ?? generatePassword()

    const { data: created, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name ?? null },
      })

    if (createError || !created?.user) {
      throw new AdminServiceError(
        `createUser failed: ${createError?.message ?? 'no user returned'}`,
      )
    }

    const newUser = created.user

    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('user_id', newUser.id)
      .single()

    if (!existingProfile) {
      await adminSupabase.from('profiles').insert({
        user_id: newUser.id,
        full_name: data.full_name ?? null,
        email: data.email,
        role: data.role ?? 'user',
        status: data.status ?? 'first_access',
      })
    } else if (data.role || data.status || data.full_name) {
      await adminSupabase
        .from('profiles')
        .update({
          ...(data.full_name !== undefined && { full_name: data.full_name }),
          ...(data.role && { role: data.role }),
          ...(data.status && { status: data.status }),
        })
        .eq('user_id', newUser.id)
    }

    void auditService.log(
      AUDIT_ACTIONS.USER_CREATED,
      AUDIT_RESOURCES.USER,
      newUser.id,
      { email: newUser.email, role: data.role ?? 'user' },
    )

    const result = await adminService.getUserById(newUser.id)
    if (!result) {
      throw new AdminServiceError('createUser: could not retrieve created user')
    }

    return result
  },

  /**
   * Updates a user's profile fields (name, avatar, role, status).
   */
  async updateUserProfile(
    userId: string,
    data: UpdateProfileDTO,
  ): Promise<Profile> {
    const adminSupabase = await createAdminClient()

    const profileUpdate: ProfilesUpdate = {
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      role: data.role,
      status: data.status,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error } = await adminSupabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !updated) {
      throw new AdminServiceError(
        `updateUserProfile failed: ${error?.message ?? 'no data returned'}`,
        error?.code,
      )
    }

    void auditService.log(
      AUDIT_ACTIONS.PROFILE_UPDATED,
      AUDIT_RESOURCES.PROFILE,
      userId,
      data as Record<string, unknown>,
    )

    return updated
  },

  /**
   * Resets a user's password to a new secure random value and returns the
   * temporary password so it can be communicated to the user.
   */
  async resetUserPassword(userId: string): Promise<string> {
    const adminSupabase = await createAdminClient()

    const tempPassword = generatePassword(16)

    const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    })

    if (error) {
      throw new AdminServiceError(`resetUserPassword failed: ${error.message}`)
    }

    await adminSupabase
      .from('profiles')
      .update({ status: 'first_access', updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    void auditService.log(AUDIT_ACTIONS.ADMIN_PASSWORD_RESET, AUDIT_RESOURCES.USER, userId)

    return tempPassword
  },

  /**
   * Blocks a user account and immediately invalidates all active sessions.
   */
  async blockUser(userId: string): Promise<void> {
    const adminSupabase = await createAdminClient()

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({ status: 'blocked', updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (profileError) {
      throw new AdminServiceError(
        `blockUser (profile update) failed: ${profileError.message}`,
        profileError.code,
      )
    }

    const { error: signOutError } = await adminSupabase.auth.admin.signOut(userId)

    if (signOutError) {
      console.error('[AdminService] blockUser – could not revoke sessions:', signOutError.message)
    }

    void auditService.log(AUDIT_ACTIONS.USER_BLOCKED, AUDIT_RESOURCES.USER, userId)
  },

  /**
   * Unblocks a user account by setting `status = 'active'`.
   */
  async unblockUser(userId: string): Promise<void> {
    const adminSupabase = await createAdminClient()

    const { error } = await adminSupabase
      .from('profiles')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      throw new AdminServiceError(`unblockUser failed: ${error.message}`, error.code)
    }

    void auditService.log(AUDIT_ACTIONS.USER_UNBLOCKED, AUDIT_RESOURCES.USER, userId)
  },

  /**
   * Returns a paginated, filterable list of audit log entries.
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const supabase = await createClient()

    const page = filters?.page ?? 1
    const perPage = filters?.perPage ?? 50
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.action) query = query.eq('action', filters.action)
    if (filters?.resource) query = query.eq('resource', filters.resource)
    if (filters?.startDate) query = query.gte('created_at', filters.startDate)
    if (filters?.endDate) query = query.lte('created_at', filters.endDate)

    const { data, error } = await query

    if (error) {
      throw new AdminServiceError(`getAuditLogs failed: ${error.message}`, error.code)
    }

    return data ?? []
  },

  /**
   * Returns total user counts grouped by status.
   */
  async getUserStats(): Promise<Record<string, number>> {
    const adminSupabase = await createAdminClient()

    const { data, error } = await adminSupabase.from('profiles').select('status')

    if (error) {
      throw new AdminServiceError(`getUserStats failed: ${error.message}`, error.code)
    }

    const stats: Record<string, number> = {}
    for (const row of data ?? []) {
      stats[row.status] = (stats[row.status] ?? 0) + 1
    }

    return stats
  },
}

export default adminService
