'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Link2,
  Link2Off,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  ChevronDown,
  Check,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserOption {
  user_id: string
  full_name: string | null
  email: string
  role: string
}

interface VinculoRow {
  id: string
  user_id: string
  student_user_id: string
  active: boolean
  created_at: string
  coach_name: string | null
  coach_email: string
  student_name: string | null
  student_email: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')
  return email.slice(0, 2).toUpperCase()
}

function Avatar({ name, email, size = 8 }: { name: string | null; email: string; size?: number }) {
  const initials = getInitials(name, email)
  return (
    <div
      className={`flex h-${size} w-${size} flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold`}
      style={{ background: 'var(--shell-accent-bg)', color: 'var(--shell-accent-text)' }}
    >
      {initials}
    </div>
  )
}

// ── User Select Dropdown ──────────────────────────────────────────────────────

function UserSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string
  options: UserOption[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const selected = options.find(o => o.user_id === value)

  const filtered = options.filter(o => {
    const q = query.toLowerCase()
    return (
      (o.full_name ?? '').toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--shell-text-muted)' }}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all"
        style={{
          border: '1px solid var(--shell-border-subtle)',
          background: 'var(--shell-surface)',
          color: selected ? 'var(--shell-text-primary)' : 'var(--shell-text-muted)',
        }}
      >
        <span className="truncate">
          {selected ? (selected.full_name ?? selected.email) : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform', open && 'rotate-180')}
          style={{ color: 'var(--shell-text-faint)' }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl shadow-xl"
          style={{ border: '1px solid var(--shell-border)', background: 'var(--shell-surface-2)' }}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--shell-surface)',
                border: '1px solid var(--shell-border-subtle)',
                color: 'var(--shell-text-primary)',
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm" style={{ color: 'var(--shell-text-muted)' }}>
                Nenhum resultado
              </p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.user_id}
                  type="button"
                  onClick={() => { onChange(opt.user_id); setOpen(false); setQuery('') }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors"
                  style={{
                    background: value === opt.user_id ? 'var(--shell-accent-bg)' : 'transparent',
                    color: value === opt.user_id ? 'var(--shell-accent-text)' : 'var(--shell-text-primary)',
                  }}
                  onMouseEnter={e => {
                    if (value !== opt.user_id)
                      (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
                  }}
                  onMouseLeave={e => {
                    if (value !== opt.user_id)
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                    style={{ background: 'var(--shell-accent-bg)', color: 'var(--shell-accent-text)' }}>
                    {getInitials(opt.full_name, opt.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{opt.full_name ?? opt.email}</p>
                    {opt.full_name && (
                      <p className="truncate text-xs" style={{ color: 'var(--shell-text-muted)' }}>{opt.email}</p>
                    )}
                  </div>
                  {value === opt.user_id && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vínculo row ───────────────────────────────────────────────────────────────

function VinculoItem({
  vinculo,
  onToggle,
  onDelete,
  loadingId,
}: {
  vinculo: VinculoRow
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  loadingId: string | null
}) {
  const isLoading = loadingId === vinculo.id
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
      style={{
        border: `1px solid ${vinculo.active ? 'var(--shell-border-subtle)' : 'var(--shell-border)'}`,
        background: vinculo.active ? 'var(--shell-surface)' : 'rgba(255,255,255,0.02)',
        opacity: vinculo.active ? 1 : 0.6,
      }}
    >
      {/* Coach */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={vinculo.coach_name} email={vinculo.coach_email} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
            {vinculo.coach_name ?? vinculo.coach_email}
          </p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--shell-accent)' }}>
            Coach
          </p>
        </div>
      </div>

      {/* Link icon */}
      <div className="hidden items-center sm:flex">
        {vinculo.active
          ? <Link2 className="h-4 w-4" style={{ color: 'var(--shell-accent)' }} />
          : <Link2Off className="h-4 w-4" style={{ color: 'var(--shell-text-faint)' }} />
        }
      </div>

      {/* Student */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
          {getInitials(vinculo.student_name, vinculo.student_email)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
            {vinculo.student_name ?? vinculo.student_email}
          </p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#f59e0b' }}>
            Aluno
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: vinculo.active ? 'rgba(0,255,136,0.10)' : 'rgba(255,255,255,0.05)',
            color: vinculo.active ? '#00ff88' : 'var(--shell-text-muted)',
            border: `1px solid ${vinculo.active ? 'rgba(0,255,136,0.25)' : 'var(--shell-border)'}`,
          }}
        >
          {vinculo.active ? 'Ativo' : 'Inativo'}
        </span>

        <button
          onClick={() => onToggle(vinculo.id, vinculo.active)}
          disabled={isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ border: '1px solid var(--shell-border-subtle)', color: 'var(--shell-text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
            ;(e.currentTarget as HTMLElement).style.color = vinculo.active ? '#ff4444' : '#00ff88'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-muted)'
          }}
          title={vinculo.active ? 'Desativar vínculo' : 'Reativar vínculo'}
        >
          {isLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : vinculo.active ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />
          }
        </button>

        <button
          onClick={() => onDelete(vinculo.id)}
          disabled={isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ border: '1px solid var(--shell-border-subtle)', color: 'var(--shell-text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,0.08)'
            ;(e.currentTarget as HTMLElement).style.color = '#ff4444'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--shell-text-muted)'
          }}
          title="Remover vínculo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminVinculosPage() {
  const supabase = createClient()

  const [vinculos, setVinculos]     = useState<VinculoRow[]>([])
  const [coaches, setCoaches]       = useState<UserOption[]>([])
  const [students, setStudents]     = useState<UserOption[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [loadingId, setLoadingId]   = useState<string | null>(null)
  const [search, setSearch]         = useState('')

  // Create form state
  const [showForm, setShowForm]         = useState(false)
  const [formCoach, setFormCoach]       = useState('')
  const [formStudent, setFormStudent]   = useState('')
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Fetch links
    const { data: links, error: linksError } = await supabase
      .from('coach_students')
      .select('id, user_id, student_user_id, active, created_at')
      .order('created_at', { ascending: false })

    if (linksError) { setError(linksError.message); setLoading(false); return }

    // Fetch all user profiles for display
    const allUserIds = [
      ...new Set([
        ...(links ?? []).map(l => l.user_id),
        ...(links ?? []).map(l => l.student_user_id),
      ])
    ]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, role')

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])

    const rows: VinculoRow[] = (links ?? []).map(l => {
      const coach   = profileMap.get(l.user_id)
      const student = profileMap.get(l.student_user_id)
      return {
        id: l.id,
        user_id: l.user_id,
        student_user_id: l.student_user_id,
        active: l.active,
        created_at: l.created_at,
        coach_name: coach?.full_name ?? null,
        coach_email: coach?.email ?? l.user_id,
        student_name: student?.full_name ?? null,
        student_email: student?.email ?? l.student_user_id,
      }
    })
    setVinculos(rows)

    // Build coach and student option lists
    const coachProfiles  = profiles?.filter(p => p.role === 'coach') ?? []
    const studentProfiles = profiles?.filter(p => p.role === 'usuario_final') ?? []
    setCoaches(coachProfiles.map(p  => ({ user_id: p.user_id, full_name: p.full_name, email: p.email, role: p.role })))
    setStudents(studentProfiles.map(p => ({ user_id: p.user_id, full_name: p.full_name, email: p.email, role: p.role })))

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggle = async (id: string, currentActive: boolean) => {
    setLoadingId(id)
    const { error: e } = await supabase
      .from('coach_students')
      .update({ active: !currentActive })
      .eq('id', id)
    if (e) setError(e.message)
    else setVinculos(prev => prev.map(v => v.id === id ? { ...v, active: !currentActive } : v))
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este vínculo permanentemente?')) return
    setLoadingId(id)
    const { error: e } = await supabase.from('coach_students').delete().eq('id', id)
    if (e) setError(e.message)
    else setVinculos(prev => prev.filter(v => v.id !== id))
    setLoadingId(null)
  }

  const handleCreate = async () => {
    if (!formCoach || !formStudent) {
      setCreateError('Selecione um coach e um aluno.')
      return
    }
    if (formCoach === formStudent) {
      setCreateError('Coach e aluno não podem ser o mesmo usuário.')
      return
    }
    setCreating(true)
    setCreateError(null)
    const { error: e } = await supabase
      .from('coach_students')
      .insert({ user_id: formCoach, student_user_id: formStudent, active: true })
    if (e) {
      setCreateError(e.code === '23505' ? 'Este vínculo já existe.' : e.message)
    } else {
      setShowForm(false)
      setFormCoach('')
      setFormStudent('')
      fetchData()
    }
    setCreating(false)
  }

  const filtered = vinculos.filter(v => {
    const q = search.toLowerCase()
    return (
      (v.coach_name ?? '').toLowerCase().includes(q)  ||
      v.coach_email.toLowerCase().includes(q)          ||
      (v.student_name ?? '').toLowerCase().includes(q) ||
      v.student_email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', color: 'var(--shell-text-title)' }}
          >
            Vínculos Coach-Aluno
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--shell-text-muted)' }}>
            Gerencie quais coaches têm acesso aos dados de cada aluno
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={fetchData}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
            style={{ border: '1px solid var(--shell-border-subtle)', color: 'var(--shell-text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            title="Atualizar"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>

          <button
            onClick={() => { setShowForm(v => !v); setCreateError(null) }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              background: 'var(--shell-accent-bg)',
              color: 'var(--shell-accent-text)',
              border: '1px solid var(--shell-accent-bg)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            <Plus className="h-4 w-4" />
            Novo vínculo
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="space-y-4 rounded-2xl p-5"
          style={{ border: '1px solid var(--shell-border)', background: 'var(--shell-surface-2)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
            Criar novo vínculo
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <UserSelect
              label="Coach"
              options={coaches}
              value={formCoach}
              onChange={setFormCoach}
              placeholder="Selecione o coach…"
            />
            <UserSelect
              label="Aluno"
              options={students}
              value={formStudent}
              onChange={setFormStudent}
              placeholder="Selecione o aluno…"
            />
          </div>

          {createError && (
            <p className="text-sm" style={{ color: '#ff4444' }}>{createError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: 'var(--shell-accent-bg)', color: 'var(--shell-accent-text)' }}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Vincular
            </button>
            <button
              onClick={() => { setShowForm(false); setCreateError(null) }}
              className="rounded-xl px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--shell-text-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {vinculos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--shell-text-faint)' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{
              background: 'var(--shell-surface)',
              border: '1px solid var(--shell-border-subtle)',
              color: 'var(--shell-text-primary)',
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)' }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#ff4444' }} />
          <p className="text-sm" style={{ color: '#ff4444' }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--shell-accent)' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && vinculos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ border: '1px dashed var(--shell-border)', background: 'var(--shell-surface)' }}>
          <Users className="mb-3 h-10 w-10" style={{ color: 'var(--shell-text-faint)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
            Nenhum vínculo cadastrado
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--shell-text-muted)' }}>
            Use o botão &quot;Novo vínculo&quot; para associar coaches a alunos.
          </p>
        </div>
      )}

      {/* Vinculos list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(v => (
            <VinculoItem
              key={v.id}
              vinculo={v}
              onToggle={handleToggle}
              onDelete={handleDelete}
              loadingId={loadingId}
            />
          ))}
        </div>
      )}

      {!loading && vinculos.length > 0 && filtered.length === 0 && (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--shell-text-muted)' }}>
          Nenhum resultado para &quot;{search}&quot;
        </p>
      )}
    </div>
  )
}
