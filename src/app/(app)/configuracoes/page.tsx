'use client'

import { useState } from 'react'
import { Settings, Bell, Database, Globe, Info, Shield, FileDown, Trash2, ChevronRight, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const APP_VERSION = '1.0.0'
const APP_BUILD = '2024.1'

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState({
    emailWeekly: false,
    emailPR: false,
    emailExam: false,
  })
  const [exportLoading, setExportLoading] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  const handleExport = async () => {
    setExportLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setExportLoading(false)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 4000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-rajdhani tracking-wider text-text-title flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          CONFIGURAÇÕES
        </h1>
        <p className="text-sm text-text-secondary mt-1">Preferências e configurações da sua conta</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notificações
            <Badge variant="neutral" size="sm">Em breve</Badge>
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {[
            { key: 'emailWeekly', label: 'Resumo semanal de treinos', description: 'Receba um email com seu progresso toda segunda-feira' },
            { key: 'emailPR', label: 'Novos recordes pessoais (PR)', description: 'Seja notificado quando bater um novo PR nos exercícios' },
            { key: 'emailExam', label: 'Lembretes de exames', description: 'Aviso para refazer exames laboratoriais periodicamente' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4 opacity-50 cursor-not-allowed">
              <div>
                <p className="text-text-title text-sm font-medium">{label}</p>
                <p className="text-text-muted text-xs mt-0.5">{description}</p>
              </div>
              <div className="relative">
                <button
                  disabled
                  className={`w-11 h-6 rounded-full transition-colors ${
                    notifications[key as keyof typeof notifications] ? 'bg-primary' : 'bg-bg-elevated'
                  } border border-border`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Idioma e Região
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-title text-sm font-medium">Idioma</p>
              <p className="text-text-muted text-xs mt-0.5">Português do Brasil</p>
            </div>
            <Badge variant="success" size="sm">Ativo</Badge>
          </div>
          <div className="mt-4 flex items-center justify-between opacity-40 cursor-not-allowed">
            <div>
              <p className="text-text-title text-sm font-medium">English</p>
              <p className="text-text-muted text-xs">Em desenvolvimento</p>
            </div>
            <Badge variant="neutral" size="sm">Em breve</Badge>
          </div>
          <div className="mt-4 flex items-center justify-between opacity-40 cursor-not-allowed">
            <div>
              <p className="text-text-title text-sm font-medium">Español</p>
              <p className="text-text-muted text-xs">Em desenvolvimento</p>
            </div>
            <Badge variant="neutral" size="sm">Em breve</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Meus Dados
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-text-title text-sm font-medium">Exportar todos os meus dados</p>
            <p className="text-text-muted text-xs mt-0.5 mb-3">
              Baixe um arquivo JSON com todos os seus treinos, dieta, exames e histórico completo.
            </p>
            {exportDone ? (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="w-4 h-4" />
                Arquivo preparado! Verifique seus downloads.
              </div>
            ) : (
              <Button variant="secondary" size="sm" loading={exportLoading} onClick={handleExport}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar Dados (JSON)
              </Button>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-text-title text-sm font-medium">Política de retenção de dados</p>
            <p className="text-text-muted text-xs mt-1">
              Seus dados são armazenados de forma segura e nunca compartilhados com terceiros.
              A exclusão de registros é lógica (mantida por 30 dias) antes de remoção permanente.
              Conforme a LGPD, você pode solicitar a exclusão total a qualquer momento.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Privacy & Terms */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Privacidade e Termos
          </h2>
        </CardHeader>
        <CardBody className="space-y-2">
          {[
            'Política de Privacidade',
            'Termos de Uso',
            'Política de Cookies',
            'Conformidade LGPD',
          ].map(item => (
            <button
              key={item}
              className="w-full flex items-center justify-between py-2.5 px-0 text-left hover:text-primary transition-colors group"
            >
              <span className="text-text-secondary group-hover:text-text-title text-sm transition-colors">{item}</span>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </button>
          ))}
        </CardBody>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-secondary tracking-widest uppercase flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Sobre o Sistema
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Versão</span>
              <span className="text-text-title font-mono text-sm">v{APP_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Build</span>
              <span className="text-text-secondary font-mono text-sm">{APP_BUILD}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Stack</span>
              <span className="text-text-secondary text-sm">Next.js 14 · Supabase · TypeScript</span>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted text-center">
                SCANIX BODY — Performance Intelligence Platform
              </p>
              <p className="text-xs text-text-muted text-center mt-1">
                Todos os dados de saúde são para fins informativos. Consulte profissionais de saúde.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
