import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

// GET /api/v1/treinos/[id] — get single workout day with exercises
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('workout_days')
    .select('*, workout_exercises(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 })

  return NextResponse.json({ data })
}

// PUT /api/v1/treinos/[id] — update workout day
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as { name?: string; muscleGroups?: string[]; orderIndex?: number }

  const { data, error } = await supabase
    .from('workout_days')
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.muscleGroups !== undefined && { muscle_groups: body.muscleGroups }),
      ...(body.orderIndex !== undefined && { order_index: body.orderIndex }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// DELETE /api/v1/treinos/[id] — soft delete workout day
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { error } = await supabase
    .from('workout_days')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
