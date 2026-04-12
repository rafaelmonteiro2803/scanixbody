import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, error: 'Não autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return { user: null, error: 'Acesso negado' }
  }
  return { user, error: null }
}

// GET /api/v1/admin/usuarios/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return NextResponse.json({ error: authError }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*, athlete_profiles(*)')
    .eq('user_id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  return NextResponse.json({ data })
}

// PUT /api/v1/admin/usuarios/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { user: admin, error: authError } = await requireAdmin(supabase)
  if (authError || !admin) return NextResponse.json({ error: authError }, { status: 401 })

  const body = await req.json() as { full_name?: string; role?: string; status?: string }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(body.full_name !== undefined && { full_name: body.full_name }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.status !== undefined && { status: body.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'UPDATE',
    resource: 'profiles',
    resource_id: params.id,
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ data })
}

// DELETE /api/v1/admin/usuarios/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { user: admin, error: authError } = await requireAdmin(supabase)
  if (authError || !admin) return NextResponse.json({ error: authError }, { status: 401 })

  // Soft-delete: set status to 'inactive'
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('user_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'DELETE',
    resource: 'users',
    resource_id: params.id,
  })

  return NextResponse.json({ success: true })
}

// POST /api/v1/admin/usuarios/[id]/reset-password handled via action param
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { user: admin, error: authError } = await requireAdmin(supabase)
  if (authError || !admin) return NextResponse.json({ error: authError }, { status: 401 })

  const body = await req.json() as { action: string }

  if (body.action === 'reset-password') {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

    // Use service role to update password (requires SUPABASE_SERVICE_ROLE_KEY)
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminClient.auth.admin.updateUserById(params.id, {
      password: tempPassword,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Force first_access on next login
    await supabase
      .from('profiles')
      .update({ status: 'first_access', updated_at: new Date().toISOString() })
      .eq('user_id', params.id)

    await supabase.from('audit_logs').insert({
      user_id: admin.id,
      action: 'PASSWORD_RESET',
      resource: 'users',
      resource_id: params.id,
    })

    return NextResponse.json({ data: { tempPassword } })
  }

  if (body.action === 'block') {
    await supabase
      .from('profiles')
      .update({ status: 'blocked', updated_at: new Date().toISOString() })
      .eq('user_id', params.id)

    await supabase.from('audit_logs').insert({
      user_id: admin.id,
      action: 'BLOCK',
      resource: 'users',
      resource_id: params.id,
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'unblock') {
    await supabase
      .from('profiles')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', params.id)

    await supabase.from('audit_logs').insert({
      user_id: admin.id,
      action: 'UNBLOCK',
      resource: 'users',
      resource_id: params.id,
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
