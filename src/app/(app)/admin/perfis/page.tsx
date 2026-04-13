'use client'

import { useState } from 'react'
import { ShieldCheck, Info, Lock } from 'lucide-react'
import type { UserRole } from '@/types/database.types'

// ── Types ──────────────────────────────────────────────────────────────────────

type Resource = 'Treinos' | 'Dieta' | 'Corpo' | 'Medicamentos' | 'Exames' | 'Análise IA' | 'Admin'
type Action = 'Ler próprio' | 'Escrever próprio' | 'Ler tudo' | 'Escrever tudo' | 'Excluir'

const RESOURCES: Resource[] = ['Treinos', 'Dieta', 'Corpo', 'Medicamentos', 'Exames', 'Análise IA', 'Admin']
const ACTIONS: Action[] = ['Ler próprio', 'Escrever próprio', 'Ler tudo', 'Escrever tudo', 'Excluir']

// ── Permission matrix definition ──────────────────────────────────────────────

type PermMatrix = Record<UserRole, Record<Resource, Partial<Record<Action, boolean>>>>

const PERMISSIONS: PermMatrix = {
  super_admin: Object.fromEntries(
    RESOURCES.map((r) => [r, Object.fromEntries(ACTIONS.map((a) => [a, true]))])
  ) as Record<Resource, Partial<Record<Action, boolean>>>,

  admin: {
    Treinos:       { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': true },
    Dieta:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': true },
    Corpo:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': true },
    Medicamentos:  { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': true },
    Exames:        { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': true },
    'Análise IA':  { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': false, 'Excluir': false },
    Admin:         { 'Ler próprio': false, 'Escrever próprio': false, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': false },
  },

  coach: {
    Treinos:       { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': true, 'Excluir': false },
    Dieta:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': false, 'Excluir': false },
    Corpo:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': false, 'Excluir': false },
    Medicamentos:  { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': false, 'Excluir': false },
    Exames:        { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': true, 'Escrever tudo': false, 'Excluir': false },
    'Análise IA':  { 'Ler próprio': true, 'Escrever próprio': false, 'Ler tudo': true, 'Escrever tudo': false, 'Excluir': false },
    Admin:         { 'Ler próprio': false, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
  },

  operator: {
    Treinos:       { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Dieta:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Corpo:         { 'Ler próprio': true, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Medicamentos:  { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Exames:        { 'Ler próprio': true, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    'Análise IA':  { 'Ler próprio': true, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Admin:         { 'Ler próprio': false, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
  },

  usuario_final: {
    Treinos:       { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Dieta:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Corpo:         { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Medicamentos:  { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Exames:        { 'Ler próprio': true, 'Escrever próprio': true, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    'Análise IA':  { 'Ler próprio': true, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
    Admin:         { 'Ler próprio': false, 'Escrever próprio': false, 'Ler tudo': false, 'Escrever tudo': false, 'Excluir': false },
  },
}

// ── Role card metadata ─────────────────────────────────────────────────────────

const ROLE_META: Record<UserRole, {
  label: string
  description: string
  color: string
  bg: string
  border: string
  locked?: boolean
}> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Acesso irrestrito a todas as funcionalidades do sistema, incluindo permissões de outros admins.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    locked: true,
  },
  admin: {
    label: 'Administrador',
    description: 'Gerencia usuários, visualiza logs de auditoria e tem acesso a dados de todos os atletas.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  coach: {
    label: 'Coach',
    description: 'Pode visualizar e editar dados de treino e corpo dos atletas sob sua supervisão.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  operator: {
    label: 'Operador',
    description: 'Acesso operacional básico, pode gerenciar dados próprios e visualizar informações limitadas.',
    color: 'text-text-secondary',
    bg: 'bg-surface-2',
    border: 'border-border',
  },
  usuario_final: {
    label: 'Usuário Final',
    description: 'Acesso padrão de atleta — gerencia apenas seus próprios dados de treino, dieta e saúde.',
    color: 'text-[#00ff88]',
    bg: 'bg-[#00ff88]/10',
    border: 'border-[#00ff88]/20',
  },
}

const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'coach', 'operator', 'usuario_final']

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PerfisPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin')

  const meta = ROLE_META[selectedRole]
  const matrix = PERMISSIONS[selectedRole]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-black tracking-[0.15em] text-text-title uppercase">
          PERFIS & PERMISSÕES
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          Visualize as permissões de cada cargo no sistema
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 rounded-xl border border-[#00ff88]/10 bg-[#00ff88]/5 px-4 py-3">
        <Info className="w-4 h-4 text-[#00ff88] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          As permissões são aplicadas via Row Level Security (RLS) no Supabase e refletem o que
          cada cargo pode fazer. O cargo <strong className="text-text-title">Super Admin</strong> não
          pode ser modificado. Para alterar permissões de outros cargos, edite as políticas RLS
          diretamente no painel do Supabase.
        </p>
      </div>

      {/* ── Role cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ALL_ROLES.map((r) => {
          const m = ROLE_META[r]
          const isSelected = r === selectedRole
          return (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={[
                'relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]',
                isSelected
                  ? `${m.bg} ${m.border} shadow-[0_0_16px_rgba(0,0,0,0.5)]`
                  : 'bg-background-secondary border-border-subtle hover:border-border hover:-translate-y-0.5',
              ].join(' ')}
            >
              {/* Lock icon for super_admin */}
              {m.locked && (
                <span className="absolute top-3 right-3">
                  <Lock className="w-3 h-3 text-red-400/60" />
                </span>
              )}

              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.bg} border ${m.border}`}>
                <ShieldCheck className={`w-5 h-5 ${m.color}`} />
              </div>

              {/* Label */}
              <div>
                <p className={`text-sm font-bold ${isSelected ? m.color : 'text-text-title'}`}>
                  {m.label}
                </p>
              </div>

              {/* Active indicator */}
              {isSelected && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-current" style={{ color: m.color.replace('text-', '') }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Selected role description ── */}
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-5`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.border}`}>
            <ShieldCheck className={`w-5 h-5 ${meta.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${meta.color}`}>{meta.label}</h3>
              {meta.locked && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-[10px] font-bold text-red-400 tracking-widest">
                  <Lock className="w-2.5 h-2.5" />
                  PROTEGIDO
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-text-secondary">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* ── Permission matrix ── */}
      <div className="rounded-2xl border border-border-subtle bg-background-secondary overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-title">
            Matriz de Permissões —{' '}
            <span className={meta.color}>{meta.label}</span>
          </h3>
          <span className="text-xs text-text-faint">Somente leitura</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-faint w-40 min-w-[140px]">
                  Recurso
                </th>
                {ACTIONS.map((a) => (
                  <th
                    key={a}
                    className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-text-faint min-w-[80px]"
                  >
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((resource, idx) => (
                <tr
                  key={resource}
                  className={[
                    'border-b border-border-subtle transition-colors hover:bg-background-card',
                    idx % 2 !== 0 ? 'bg-background/40' : '',
                  ].join(' ')}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold text-text-secondary">{resource}</span>
                  </td>
                  {ACTIONS.map((action) => {
                    const allowed = matrix[resource]?.[action] ?? false
                    return (
                      <td key={action} className="px-3 py-3.5 text-center">
                        <PermissionCell allowed={allowed} locked={selectedRole === 'super_admin'} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <PermissionCell allowed={true} />
          <span>Permitido</span>
        </div>
        <div className="flex items-center gap-2">
          <PermissionCell allowed={false} />
          <span>Negado</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-red-400/50" />
          <span>Cargo protegido — não pode ser modificado</span>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function PermissionCell({ allowed, locked }: { allowed: boolean; locked?: boolean }) {
  if (locked && allowed) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      </span>
    )
  }

  if (allowed) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-border">
      <span className="w-1 h-0.5 rounded-full bg-surface-3" />
    </span>
  )
}
