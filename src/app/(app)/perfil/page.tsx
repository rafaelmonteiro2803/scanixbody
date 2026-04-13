'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Shield, Calendar, LogIn, Trash2, Camera, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve ter ao menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Deve ter ao menos um caractere especial'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  coach: 'Coach',
  operador: 'Operador',
  usuario_final: 'Usuário',
}

const ROLE_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
  super_admin: 'danger',
  admin: 'warning',
  coach: 'info',
  operador: 'neutral',
  usuario_final: 'success',
}

export default function PerfilPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<{ full_name: string; role: string; status: string; created_at: string } | null>(null)
  const [user, setUser] = useState<{ email: string; last_sign_in_at?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        setUser({ email: authUser.email ?? '', last_sign_in_at: authUser.last_sign_in_at })

        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, role, status, created_at')
          .eq('user_id', authUser.id)
          .single()

        if (prof) {
          setProfile(prof)
          profileForm.reset({ full_name: prof.full_name ?? '' })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase, profileForm])

  const onSaveProfile = async (data: ProfileForm) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await supabase.from('profiles').update({ full_name: data.full_name }).eq('user_id', authUser.id)
    setProfile(prev => prev ? { ...prev, full_name: data.full_name } : null)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const onChangePassword = async (data: PasswordForm) => {
    setPasswordError(null)

    // Verify current password before allowing the change
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) {
      setPasswordError('Sessão inválida. Faça login novamente.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: data.currentPassword,
    })
    if (signInError) {
      setPasswordError('Senha atual incorreta.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) {
      setPasswordError(error.message)
      return
    }
    passwordForm.reset()
    setPasswordSaved(true)
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-rajdhani tracking-wider text-text-title flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          MEU PERFIL
        </h1>
        <p className="text-sm text-text-secondary mt-1">Gerencie suas informações e segurança</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Informações da Conta
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Email</p>
              <p className="text-text-title font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Perfil</p>
              <Badge variant={ROLE_VARIANTS[profile?.role ?? 'usuario_final']} size="sm">
                {ROLE_LABELS[profile?.role ?? 'usuario_final']}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Membro desde
              </p>
              <p className="text-text-secondary text-sm">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                <LogIn className="w-3 h-3" /> Último acesso
              </p>
              <p className="text-text-secondary text-sm">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Dados Pessoais
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-bg-elevated border-2 border-border flex items-center justify-center text-2xl font-bold text-primary">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-text-title font-medium">{profile?.full_name ?? 'Usuário'}</p>
                <p className="text-xs text-text-muted">{user?.email}</p>
              </div>
            </div>

            <Input
              label="Nome completo"
              {...profileForm.register('full_name')}
              error={profileForm.formState.errors.full_name?.message}
            />
            <Input
              label="Telefone (opcional)"
              {...profileForm.register('phone')}
              placeholder="(11) 99999-9999"
            />

            {profileSaved && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="w-4 h-4" />
                Perfil atualizado com sucesso!
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={profileForm.formState.isSubmitting}
            >
              Salvar Dados
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Alterar Senha
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="bg-bg-elevated/50 border border-border rounded-lg p-3 mb-4">
              <p className="text-xs text-text-secondary">Requisitos da senha:</p>
              <ul className="text-xs text-text-muted mt-1 space-y-1 list-disc list-inside">
                <li>Mínimo 8 caracteres</li>
                <li>Ao menos uma letra maiúscula</li>
                <li>Ao menos um número</li>
                <li>Ao menos um caractere especial (!@#$%...)</li>
              </ul>
            </div>

            <Input
              label="Senha nova"
              type="password"
              {...passwordForm.register('newPassword')}
              error={passwordForm.formState.errors.newPassword?.message}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              {...passwordForm.register('confirmPassword')}
              error={passwordForm.formState.errors.confirmPassword?.message}
            />

            {passwordError && (
              <p className="text-danger text-sm">{passwordError}</p>
            )}
            {passwordSaved && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="w-4 h-4" />
                Senha alterada com sucesso!
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={passwordForm.formState.isSubmitting}
            >
              Alterar Senha
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card variant="bordered" className="border-danger/30">
        <CardHeader>
          <h2 className="text-sm font-semibold text-danger tracking-widest uppercase flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Zona de Perigo
          </h2>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary text-sm mb-4">
            A exclusão da conta é permanente e remove todos os seus dados. Esta ação não pode ser desfeita.
          </p>

          {!deleteConfirm ? (
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir minha conta
            </Button>
          ) : (
            <div className="space-y-3 border border-danger/30 rounded-lg p-4 bg-danger/5">
              <p className="text-danger text-sm font-medium">
                Digite <strong>EXCLUIR CONTA</strong> para confirmar:
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-title focus:outline-none focus:border-danger"
                placeholder="EXCLUIR CONTA"
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleteInput !== 'EXCLUIR CONTA'}
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                  }}
                >
                  Confirmar Exclusão
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDeleteConfirm(false); setDeleteInput('') }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
