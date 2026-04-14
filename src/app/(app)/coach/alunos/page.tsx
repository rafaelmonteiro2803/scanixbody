'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserCheck,
  Search,
  Loader2,
  ArrowRight,
  AlertCircle,
  Activity,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { coachService } from '@/services/coach.service'
import { useAppStore } from '@/stores/app.store'
import type { CoachStudentWithProfile } from '@/types/domain.types'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active:        '#00ff88',
    inactive:      '#666666',
    blocked:       '#ff4444',
    first_access:  '#f59e0b',
  }
  return (
    <span
      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
      style={{ background: colors[status] ?? '#666666' }}
      title={status}
    />
  )
}

// ── Student Card ──────────────────────────────────────────────────────────────

function StudentCard({
  student,
  onEnter,
  loading,
}: {
  student: CoachStudentWithProfile
  onEnter: (id: string) => void
  loading: boolean
}) {
  const initials = getInitials(student.student.full_name)

  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 cursor-pointer"
      style={{
        border: '1px solid var(--shell-border-subtle)',
        background: 'var(--shell-surface)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(245,158,11,0.40)'
        el.style.background  = 'var(--shell-surface-2)'
        el.style.transform   = 'translateY(-1px)'
        el.style.boxShadow   = '0 8px 24px rgba(245,158,11,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--shell-border-subtle)'
        el.style.background  = 'var(--shell-surface)'
        el.style.transform   = 'none'
        el.style.boxShadow   = 'none'
      }}
      onClick={() => !loading && onEnter(student.student_user_id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && !loading && onEnter(student.student_user_id)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          {student.student.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.student.avatar_url}
              alt={student.student.full_name ?? 'Avatar'}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2"
          style={{
            borderColor: 'var(--shell-surface)',
            background: student.student.status === 'active' ? '#00ff88' : '#666',
          }}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
            {student.student.full_name ?? 'Sem nome'}
          </p>
          <StatusDot status={student.student.status} />
        </div>
        <p className="truncate text-xs" style={{ color: 'var(--shell-text-muted)' }}>
          {student.student.email}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--shell-text-ghost)' }}>
          Vinculado em {new Date(student.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); onEnter(student.student_user_id) }}
        disabled={loading}
        className={cn(
          'flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
          'focus:outline-none focus-visible:ring-2',
        )}
        style={{
          background: 'rgba(245,158,11,0.10)',
          color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.25)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.20)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.10)'
        }}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <UserCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Acessar</span>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachAlunosPage() {
  const router                 = useRouter()
  const setCoachViewingStudent = useAppStore(s => s.setCoachViewingStudent)

  const [students, setStudents]   = useState<CoachStudentWithProfile[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [entering, setEntering]   = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await coachService.getMyStudents()
    if (err) setError(err)
    else setStudents(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const handleEnterCoachMode = useCallback(async (studentUserId: string) => {
    setEntering(studentUserId)
    const { student, error: err } = await coachService.enterCoachMode(studentUserId)
    if (err || !student) {
      setError(err ?? 'Erro ao entrar no modo coach')
      setEntering(null)
      return
    }
    // Sync to Zustand so client components read it immediately
    setCoachViewingStudent(student)
    // Full page navigation so the server layout re-reads the cookie
    window.location.href = '/dashboard'
  }, [setCoachViewingStudent])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.student.full_name ?? '').toLowerCase().includes(q) ||
      s.student.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <Users className="h-5 w-5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-rajdhani), sans-serif', color: 'var(--shell-text-title)' }}
            >
              Meus Alunos
            </h1>
            <p className="text-sm" style={{ color: 'var(--shell-text-muted)' }}>
              Selecione um aluno para acessar e ajustar seus dados
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div
          className="flex items-center gap-4 rounded-xl p-4"
          style={{ border: '1px solid var(--shell-border-subtle)', background: 'var(--shell-surface)' }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: '#f59e0b' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
              {students.length}
            </span>
            <span className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>
              aluno{students.length !== 1 ? 's' : ''} vinculado{students.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--shell-border)' }} />
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: 'var(--shell-text-faint)' }} />
            <span className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>
              {students.filter(s => s.student.status === 'active').length} ativos
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      {students.length > 0 && (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--shell-text-faint)' }}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
            style={{
              background: 'var(--shell-surface)',
              border: '1px solid var(--shell-border-subtle)',
              color: 'var(--shell-text-primary)',
            }}
            onFocus={e => {
              (e.target as HTMLElement).style.borderColor = 'rgba(245,158,11,0.50)'
            }}
            onBlur={e => {
              (e.target as HTMLElement).style.borderColor = 'var(--shell-border-subtle)'
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)' }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#ff4444' }} />
          <p className="text-sm" style={{ color: '#ff4444' }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f59e0b' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && students.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ border: '1px dashed var(--shell-border)', background: 'var(--shell-surface)' }}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}
          >
            <Users className="h-8 w-8" style={{ color: 'rgba(245,158,11,0.50)' }} />
          </div>
          <p className="text-base font-semibold" style={{ color: 'var(--shell-text-primary)' }}>
            Nenhum aluno vinculado
          </p>
          <p className="mt-1 max-w-xs text-sm" style={{ color: 'var(--shell-text-muted)' }}>
            Peça a um administrador para vincular alunos à sua conta de coach.
          </p>
        </div>
      )}

      {/* No search results */}
      {!loading && !error && students.length > 0 && filtered.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm" style={{ color: 'var(--shell-text-muted)' }}>
            Nenhum aluno encontrado para &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Student list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onEnter={handleEnterCoachMode}
              loading={entering === student.student_user_id}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      {!loading && students.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'rgba(245,158,11,0.70)' }} />
          <p className="text-xs" style={{ color: 'var(--shell-text-secondary)' }}>
            Ao acessar um aluno, o sistema assumirá uma paleta de cores diferenciada e exibirá
            o nome do aluno em destaque. Você poderá visualizar e editar os dados de treino,
            dieta, composição corporal e progresso. Para voltar à sua conta, clique em{' '}
            <strong style={{ color: '#f59e0b' }}>Sair do modo coach</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
