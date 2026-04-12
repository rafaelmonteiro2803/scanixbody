'use client'

import { useState, useEffect, useTransition } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { UserRole } from '@/types/database.types'
import type { UserWithProfile, CreateUserDTO, UpdateProfileDTO } from '@/services/admin.service'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserFormProps {
  open: boolean
  onClose: () => void
  /** If user is provided → edit mode, else → create mode */
  user: UserWithProfile | null
  /** Called with typed payload when form is submitted */
  onSubmit: (data: CreateUserDTO | UpdateProfileDTO) => Promise<void>
}

interface FormErrors {
  full_name?: string
  email?: string
  role?: string
}

const roleOptions = [
  { value: 'usuario_final', label: 'Usuário', description: 'Acesso padrão' },
  { value: 'operator', label: 'Operador', description: 'Acesso operacional limitado' },
  { value: 'coach', label: 'Coach', description: 'Acesso a perfis de atletas' },
  { value: 'admin', label: 'Administrador', description: 'Acesso administrativo' },
  { value: 'super_admin', label: 'Super Admin', description: 'Acesso total ao sistema' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function UserForm({ open, onClose, user, onSubmit }: UserFormProps) {
  const isEdit = user !== null

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('usuario_final')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Pre-populate fields in edit mode
  useEffect(() => {
    if (open) {
      setFullName(user?.profile?.full_name ?? '')
      setEmail(user?.email ?? '')
      setRole((user?.profile?.role as UserRole) ?? 'usuario_final')
      setErrors({})
      setServerError(null)
    }
  }, [open, user])

  function validate(): boolean {
    const next: FormErrors = {}

    if (!fullName.trim()) {
      next.full_name = 'Nome completo é obrigatório'
    } else if (fullName.trim().length < 2) {
      next.full_name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!isEdit) {
      if (!email.trim()) {
        next.email = 'E-mail é obrigatório'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        next.email = 'Informe um e-mail válido'
      }
    }

    if (!role) {
      next.role = 'Selecione um cargo'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setServerError(null)

    startTransition(async () => {
      try {
        if (isEdit) {
          const dto: UpdateProfileDTO = {
            full_name: fullName.trim() || null,
            role,
          }
          await onSubmit(dto)
        } else {
          const dto: CreateUserDTO = {
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            role,
            status: 'first_access',
          }
          await onSubmit(dto)
        }
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
      }
    })
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Editar Usuário' : 'Novo Usuário'}
      subtitle={
        isEdit
          ? 'Atualize os dados do usuário abaixo'
          : 'Preencha os dados para criar um novo acesso. A senha será gerada automaticamente.'
      }
      size="md"
      disableBackdropClose={isPending}
    >
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          <div className="space-y-5">

            {/* Server error */}
            {serverError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{serverError}</p>
              </div>
            )}

            {/* Full name */}
            <Input
              label="Nome completo"
              placeholder="Ex.: João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.full_name}
              required
              disabled={isPending}
            />

            {/* Email (create only) */}
            {!isEdit && (
              <Input
                label="E-mail"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
                disabled={isPending}
              />
            )}

            {/* Email (edit, readonly) */}
            {isEdit && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">E-mail</label>
                <div className="h-10 rounded-lg border border-border bg-background-secondary flex items-center px-3 opacity-60 cursor-not-allowed">
                  <span className="text-sm text-text-tertiary truncate">{user?.email}</span>
                </div>
                <p className="text-xs text-text-muted">O e-mail não pode ser alterado aqui.</p>
              </div>
            )}

            {/* Role */}
            <Select
              label="Cargo"
              options={roleOptions}
              value={role}
              onChange={(v) => setRole(v as UserRole)}
              error={errors.role}
            />

            {/* Auto-password notice (create only) */}
            {!isEdit && (
              <div className="rounded-xl border border-[#00ff88]/10 bg-[#00ff88]/5 px-4 py-3">
                <p className="text-xs text-[#00ff88]/80 font-medium mb-0.5">
                  Senha gerada automaticamente
                </p>
                <p className="text-xs text-[#555]">
                  Uma senha segura será criada e exibida após a criação. O usuário será marcado
                  como{' '}
                  <span className="text-yellow-400 font-semibold">1º Acesso</span> e deverá
                  alterá-la no primeiro login.
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
          >
            {isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default UserForm
