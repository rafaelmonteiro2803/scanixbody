'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import {
  UserPlus,
  Search,
  RefreshCw,
  Edit2,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { RoleBadge } from './components/RoleBadge'
import { UserStatusBadge } from './components/UserStatusBadge'
import { UserForm } from './components/UserForm'
import { formatDate } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types/database.types'
import type { UserWithProfile, CreateUserDTO, UpdateProfileDTO } from '@/services/admin.service'

// ── helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('')
  }
  return email.slice(0, 2).toUpperCase()
}

const roleOptions = [
  { value: '', label: 'Todos os cargos' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'coach', label: 'Coach' },
  { value: 'operator', label: 'Operador' },
  { value: 'usuario_final', label: 'Usuário' },
]

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'first_access', label: '1º Acesso' },
]

const PER_PAGE = 20

// ── Confirm dialog ─────────────────────────────────────────────────────────────

interface ConfirmState {
  open: boolean
  title: string
  message: string
  variant: 'danger' | 'warning'
  onConfirm: () => void
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  // List state
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserWithProfile | null>(null)

  // Password reveal modal
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; password: string; userName: string }>({
    open: false,
    password: '',
    userName: '',
  })
  const [copied, setCopied] = useState(false)

  // Confirm dialog
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  })
  const [confirmLoading, startConfirmTransition] = useTransition()

  // ── fetch ───────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('perPage', String(PER_PAGE))
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/v1/admin/usuarios?${params.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar usuários')
      const json = await res.json()
      setUsers(json.data?.users ?? [])
      setTotalUsers(json.data?.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  // ── actions ─────────────────────────────────────────────────────────────────

  async function handleCreateUser(data: CreateUserDTO) {
    const res = await fetch('/api/v1/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao criar usuário')

    setPasswordModal({
      open: true,
      password: json.data?.temporaryPassword ?? '',
      userName: data.full_name ?? data.email,
    })
    setFormOpen(false)
    fetchUsers()
  }

  async function handleEditUser(data: UpdateProfileDTO) {
    if (!editUser) return
    const res = await fetch(`/api/v1/admin/usuarios/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao editar usuário')
    setEditUser(null)
    setFormOpen(false)
    fetchUsers()
  }

  function openEdit(user: UserWithProfile) {
    setEditUser(user)
    setFormOpen(true)
  }

  function openCreate() {
    setEditUser(null)
    setFormOpen(true)
  }

  function askResetPassword(user: UserWithProfile) {
    const name = user.profile?.full_name ?? user.email
    setConfirm({
      open: true,
      title: 'Redefinir senha',
      message: `Deseja gerar uma nova senha temporária para ${name}? O usuário precisará alterá-la no próximo acesso.`,
      variant: 'warning',
      onConfirm: () =>
        startConfirmTransition(async () => {
          const res = await fetch(`/api/v1/admin/usuarios/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset-password' }),
          })
          const json = await res.json()
          setConfirm((c) => ({ ...c, open: false }))
          if (res.ok) {
            setPasswordModal({
              open: true,
              password: json.data?.tempPassword ?? '',
              userName: name,
            })
          }
        }),
    })
  }

  function askToggleBlock(user: UserWithProfile) {
    const isBlocked = user.profile?.status === 'blocked'
    const name = user.profile?.full_name ?? user.email
    setConfirm({
      open: true,
      title: isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário',
      message: isBlocked
        ? `Deseja desbloquear ${name}? O acesso será restaurado imediatamente.`
        : `Deseja bloquear ${name}? O acesso será revogado imediatamente.`,
      variant: isBlocked ? 'warning' : 'danger',
      onConfirm: () =>
        startConfirmTransition(async () => {
          const action = isBlocked ? 'unblock' : 'block'
          await fetch(`/api/v1/admin/usuarios/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          })
          setConfirm((c) => ({ ...c, open: false }))
          fetchUsers()
        }),
    })
  }

  function askDelete(user: UserWithProfile) {
    const name = user.profile?.full_name ?? user.email
    setConfirm({
      open: true,
      title: 'Excluir usuário',
      message: `Tem certeza que deseja excluir ${name}? Esta ação é irreversível e todos os dados do usuário serão removidos.`,
      variant: 'danger',
      onConfirm: () =>
        startConfirmTransition(async () => {
          await fetch(`/api/v1/admin/usuarios/${user.id}`, { method: 'DELETE' })
          setConfirm((c) => ({ ...c, open: false }))
          fetchUsers()
        }),
    })
  }

  function copyPassword() {
    navigator.clipboard.writeText(passwordModal.password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / PER_PAGE))

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[0.15em] text-text-title uppercase">
            GESTÃO DE USUÁRIOS
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {totalUsers > 0 ? `${totalUsers} usuário${totalUsers !== 1 ? 's' : ''} encontrado${totalUsers !== 1 ? 's' : ''}` : 'Gerencie contas e permissões de acesso'}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={openCreate}
        >
          Novo Usuário
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search className="w-4 h-4" />}
            size="md"
            variant="dark"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Cargo"
            size="md"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            size="md"
          />
        </div>
        <Button
          variant="ghost"
          size="md"
          onClick={fetchUsers}
          aria-label="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-border-subtle bg-background-secondary overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" variant="primary" label="Carregando usuários…" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchUsers}>Tentar novamente</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl border border-border-subtle bg-background flex items-center justify-center">
              <Search className="w-6 h-6 text-text-faint" />
            </div>
            <p className="text-sm font-medium text-text-faint">Nenhum usuário encontrado</p>
            {(search || roleFilter || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter('') }}
                className="text-xs text-[#00ff88] hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Usuário', 'Cargo', 'Status', 'Criado em', 'Ações'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-faint"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const name = user.profile?.full_name ?? null
                  const role = (user.profile?.role ?? 'usuario_final') as UserRole
                  const status = user.profile?.status ?? 'inactive'
                  const isBlocked = status === 'blocked'
                  const initials = getInitials(name, user.email)

                  return (
                    <tr
                      key={user.id}
                      className={[
                        'border-b border-border-subtle transition-colors',
                        'hover:bg-background-card',
                        idx % 2 === 0 ? '' : 'bg-background/50',
                      ].join(' ')}
                    >
                      {/* Avatar + name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#00ff88]">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text-title truncate max-w-[180px]">
                              {name ?? <span className="text-text-faint italic">Sem nome</span>}
                            </p>
                            <p className="text-xs text-text-muted truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <RoleBadge role={role as UserRole} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <UserStatusBadge status={status as UserStatus} size="sm" />
                      </td>

                      {/* Created at */}
                      <td className="px-4 py-3 text-xs text-text-muted tabular-nums whitespace-nowrap">
                        {formatDate(user.created_at, 'dd/MM/yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ActionBtn
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            label="Editar"
                            onClick={() => openEdit(user)}
                          />
                          <ActionBtn
                            icon={<KeyRound className="w-3.5 h-3.5" />}
                            label="Redefinir senha"
                            onClick={() => askResetPassword(user)}
                          />
                          <ActionBtn
                            icon={
                              isBlocked
                                ? <ShieldCheck className="w-3.5 h-3.5" />
                                : <ShieldOff className="w-3.5 h-3.5" />
                            }
                            label={isBlocked ? 'Desbloquear' : 'Bloquear'}
                            onClick={() => askToggleBlock(user)}
                            danger={!isBlocked}
                          />
                          <ActionBtn
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            label="Excluir"
                            onClick={() => askDelete(user)}
                            danger
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && users.length > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border-subtle">
            <span className="text-xs text-text-faint">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-border-subtle bg-background flex items-center justify-center text-text-muted hover:text-text-title hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = totalPages <= 5
                  ? i + 1
                  : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                      ? totalPages - 4 + i
                      : page - 2 + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={[
                      'w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                      pageNum === page
                        ? 'bg-[#00ff88] text-[#0a0a0a]'
                        : 'border border-border-subtle bg-background text-text-muted hover:text-text-title hover:border-border',
                    ].join(' ')}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg border border-border-subtle bg-background flex items-center justify-center text-text-muted hover:text-text-title hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <UserForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(null) }}
        onSubmit={async (data) => {
          if (editUser) {
            await handleEditUser(data as import('@/services/admin.service').UpdateProfileDTO)
          } else {
            await handleCreateUser(data as import('@/services/admin.service').CreateUserDTO)
          }
        }}
        user={editUser}
      />

      {/* ── Password Reveal Modal ── */}
      <Modal
        isOpen={passwordModal.open}
        onClose={() => setPasswordModal((p) => ({ ...p, open: false }))}
        title="Senha temporária gerada"
        subtitle={`Copie e compartilhe com ${passwordModal.userName}. Ela só é exibida uma vez.`}
        size="sm"
        disableBackdropClose
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88]/60 mb-2">
                Senha temporária
              </p>
              <p
                className="text-xl font-bold text-[#00ff88] tracking-wider font-mono break-all"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {passwordModal.password}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              O usuário será solicitado a alterar esta senha no primeiro acesso.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant={copied ? 'secondary' : 'primary'}
            size="sm"
            onClick={copyPassword}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copiado!' : 'Copiar senha'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPasswordModal((p) => ({ ...p, open: false }))}
          >
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Confirm Dialog ── */}
      <Modal
        isOpen={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        title={confirm.title}
        size="sm"
        disableBackdropClose={confirmLoading}
      >
        <ModalBody>
          <div className="flex items-start gap-3">
            <div className={[
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              confirm.variant === 'danger'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-yellow-500/10 border border-yellow-500/20',
            ].join(' ')}>
              <AlertTriangle className={[
                'w-5 h-5',
                confirm.variant === 'danger' ? 'text-red-400' : 'text-yellow-400',
              ].join(' ')} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{confirm.message}</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirm((c) => ({ ...c, open: false }))}
            disabled={confirmLoading}
          >
            Cancelar
          </Button>
          <Button
            variant={confirm.variant === 'danger' ? 'danger' : 'accent'}
            size="sm"
            loading={confirmLoading}
            onClick={confirm.onConfirm}
          >
            Confirmar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ── ActionBtn sub-component ────────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={[
        'w-7 h-7 rounded-lg flex items-center justify-center',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00ff88]',
        danger
          ? 'text-text-muted hover:text-red-400 hover:bg-red-500/10'
          : 'text-text-muted hover:text-text-title hover:bg-background-card',
      ].join(' ')}
    >
      {icon}
    </button>
  )
}
