import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Dumbbell,
  Utensils,
  Activity,
  Brain,
  ClipboardList,
  TrendingUp,
  Zap,
  ArrowRight,
  AlertCircle,
  Calendar,
  Weight,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { UserRole } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  accent?: 'green' | 'cyan' | 'orange' | 'default'
  delta?: string
  deltaUp?: boolean
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, icon, accent = 'default', delta, deltaUp }: StatCardProps) {
  const accentColors = {
    green: { border: 'border-[#00ff88]/20', bg: 'bg-[#00ff88]/8', icon: 'text-[#00ff88]', value: 'text-[#00ff88]' },
    cyan: { border: 'border-[#00d4ff]/20', bg: 'bg-[#00d4ff]/8', icon: 'text-[#00d4ff]', value: 'text-[#00d4ff]' },
    orange: { border: 'border-[#ffaa00]/20', bg: 'bg-[#ffaa00]/8', icon: 'text-[#ffaa00]', value: 'text-[#ffaa00]' },
    default: { border: 'border-border', bg: 'bg-background-card', icon: 'text-text-muted', value: 'text-text-title' },
  }

  const colors = accentColors[accent]

  return (
    <div className={`rounded-2xl border ${colors.border} bg-background-secondary p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold tabular-nums ${colors.value}`}
              style={{ fontFamily: 'var(--font-orbitron), monospace' }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm text-text-faint">{unit}</span>
            )}
          </div>
          {delta && (
            <p className={`mt-1.5 text-xs ${deltaUp ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
              {deltaUp ? '▲' : '▼'} {delta}
            </p>
          )}
        </div>

        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colors.bg} border ${colors.border}`}>
          <span className={colors.icon}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

// ── Module Card ───────────────────────────────────────────────────────────────

function ModuleCard({
  href,
  icon,
  title,
  description,
  badge,
  accentColor = '#00ff88',
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  accentColor?: string
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background-secondary p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Icon */}
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl border"
        style={{
          borderColor: `${accentColor}22`,
          backgroundColor: `${accentColor}12`,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-text-title">{title}</h3>
          {badge && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight
        className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint transition-all group-hover:right-3 group-hover:text-text-muted"
        aria-hidden
      />
    </Link>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background-secondary p-5">
      <div className="h-3 w-24 rounded skeleton mb-3" />
      <div className="h-7 w-16 rounded skeleton" />
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({
  title,
  action,
}: {
  title: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted"
      >
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1 text-xs font-medium text-[#00ff88] transition-colors hover:text-[#00e67a]"
        >
          {action.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel data fetching
  const [
    { data: profileRaw },
    { data: athleteProfileRaw },
    { data: recentSessions },
    { data: latestAiReportRaw },
    { count: totalSessions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, role, status')
      .eq('user_id', user.id)
      .single(),

    supabase
      .from('athlete_profiles')
      .select('weight, body_fat_percentage, bmi, skeletal_muscle_mass, tdee, goal, activity_level')
      .eq('user_id', user.id)
      .maybeSingle(),

    supabase
      .from('workout_sessions')
      .select('id, session_date, workout_day_id, notes, workout_days(name)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('session_date', { ascending: false })
      .limit(3),

    supabase
      .from('ai_analysis_reports')
      .select('score_overall, score_training, score_diet, generated_at')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null),
  ])

  // Type-assert query results (Supabase client is untyped without generated types)
  const profile = profileRaw as { full_name: string | null; role: UserRole; status: string } | null
  const athleteProfile = athleteProfileRaw as {
    weight: number | null; body_fat_percentage: number | null; bmi: number | null
    skeletal_muscle_mass: number | null; tdee: number | null; goal: string | null
    activity_level: string | null
  } | null
  const latestAiReport = latestAiReportRaw as {
    score_overall: number | null; score_training: number | null
    score_diet: number | null; generated_at: string
  } | null

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta'
  const isProfileComplete = !!athleteProfile?.weight && !!athleteProfile?.body_fat_percentage
  const lastSession = recentSessions?.[0] as { id: string; session_date: string; workout_days: { name: string } | null } | undefined
  const aiScore = latestAiReport?.score_overall

  // Compute total volume (approximate from session count × avg session volume)
  // For a real app, this would join session_sets. Placeholder for now.
  const sessionCount = totalSessions ?? 0

  // Get hour for greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Greeting ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-text-muted">{greeting},</p>
          <h1
            className="text-3xl font-black text-text-title md:text-4xl"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif', letterSpacing: '-0.03em' }}
          >
            {firstName}{' '}
            <span
              className="text-[#00ff88]"
              style={{ textShadow: '0 0 20px rgba(0,255,136,0.35)' }}
            >
              /
            </span>
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Aqui está um resumo da sua performance.
          </p>
        </div>

        {/* Quick record button */}
        <Link
          href="/registrar-treino"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00ff88] px-5 py-2.5 text-sm font-bold text-[#0a0a0a] shadow-[0_0_16px_rgba(0,255,136,0.3)] transition-all hover:bg-[#00e67a] hover:shadow-[0_0_24px_rgba(0,255,136,0.45)] active:scale-[0.98]"
        >
          <Zap className="h-4 w-4" />
          Registrar Treino
        </Link>
      </div>

      {/* ── Incomplete profile CTA ── */}
      {!isProfileComplete && (
        <div className="flex items-start gap-4 rounded-2xl border border-[#ffaa00]/20 bg-[#ffaa00]/5 p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#ffaa00]/20 bg-[#ffaa00]/10">
            <AlertCircle className="h-5 w-5 text-[#ffaa00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#ffaa00]">
              Perfil incompleto
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Complete seu perfil atlético para desbloquear análises de IA
              personalizadas e recomendações precisas.
            </p>
          </div>
          <Link
            href="/corpo"
            className="flex-shrink-0 rounded-lg border border-[#ffaa00]/20 bg-[#ffaa00]/10 px-3 py-1.5 text-xs font-bold text-[#ffaa00] transition-colors hover:bg-[#ffaa00]/15"
          >
            Completar
          </Link>
        </div>
      )}

      {/* ── Stats overview ── */}
      <section aria-labelledby="stats-heading">
        <SectionHeading title="Visão geral" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total de Treinos"
            value={sessionCount}
            unit="sessões"
            icon={<Dumbbell className="h-5 w-5" />}
            accent="green"
          />
          <StatCard
            label="Último Treino"
            value={lastSession ? formatDate(lastSession.session_date, 'dd/MM') : '—'}
            unit={lastSession ? undefined : 'sem dados'}
            icon={<Calendar className="h-5 w-5" />}
            accent="cyan"
          />
          <StatCard
            label="Peso Atual"
            value={athleteProfile?.weight ? `${athleteProfile.weight.toFixed(1)}` : '—'}
            unit={athleteProfile?.weight ? 'kg' : undefined}
            icon={<Weight className="h-5 w-5" />}
            accent="default"
          />
          <StatCard
            label="Score Geral IA"
            value={aiScore != null ? Math.round(aiScore) : '—'}
            unit={aiScore != null ? '/100' : undefined}
            icon={<Brain className="h-5 w-5" />}
            accent="orange"
            delta={aiScore != null ? `Última análise: ${formatDate(latestAiReport?.generated_at, 'dd/MM')}` : undefined}
          />
        </div>
      </section>

      {/* ── Body quick stats ── */}
      {athleteProfile && isProfileComplete && (
        <section aria-labelledby="body-stats-heading">
          <SectionHeading
            title="Composição corporal"
            action={{ label: 'Ver detalhes', href: '/corpo' }}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border-subtle bg-background-secondary p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-faint">
                Peso
              </p>
              <p
                className="mt-1.5 text-xl font-bold text-text-title tabular-nums"
                style={{ fontFamily: 'var(--font-orbitron), monospace' }}
              >
                {athleteProfile.weight?.toFixed(1)}
                <span className="ml-1 text-xs font-normal text-text-faint">kg</span>
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-background-secondary p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-faint">
                Gordura
              </p>
              <p
                className="mt-1.5 text-xl font-bold text-[#00d4ff] tabular-nums"
                style={{ fontFamily: 'var(--font-orbitron), monospace' }}
              >
                {athleteProfile.body_fat_percentage?.toFixed(1)}
                <span className="ml-0.5 text-xs font-normal text-text-faint">%</span>
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-background-secondary p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-faint">
                IMC
              </p>
              <p
                className="mt-1.5 text-xl font-bold text-[#00ff88] tabular-nums"
                style={{ fontFamily: 'var(--font-orbitron), monospace' }}
              >
                {athleteProfile.bmi?.toFixed(1) ?? '—'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Modules grid ── */}
      <section aria-labelledby="modules-heading">
        <SectionHeading title="Módulos" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            href="/treinos"
            icon={<Dumbbell className="h-5 w-5" />}
            title="Treinos"
            description="Gerencie planos e registre sessões de musculação"
            accentColor="#00ff88"
          />
          <ModuleCard
            href="/dieta"
            icon={<Utensils className="h-5 w-5" />}
            title="Dieta"
            description="Registre refeições, macros e acompanhe sua nutrição"
            accentColor="#00d4ff"
          />
          <ModuleCard
            href="/corpo"
            icon={<Activity className="h-5 w-5" />}
            title="Composição Corporal"
            description="Dados de bioimpedância, segmentos e evolução do corpo"
            accentColor="#a855f7"
          />
          <ModuleCard
            href="/analise-ia"
            icon={<Brain className="h-5 w-5" />}
            title="Análise IA"
            description="Score de performance, recomendações e insights inteligentes"
            badge="IA"
            accentColor="#ffaa00"
          />
          <ModuleCard
            href="/exames"
            icon={<ClipboardList className="h-5 w-5" />}
            title="Exames"
            description="Importe e acompanhe seus resultados laboratoriais"
            accentColor="#ff6b6b"
          />
          <ModuleCard
            href="/progresso"
            icon={<TrendingUp className="h-5 w-5" />}
            title="Progresso"
            description="Gráficos e histórico de evolução ao longo do tempo"
            accentColor="#00ff88"
          />
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section aria-labelledby="activity-heading">
        <SectionHeading
          title="Atividade recente"
          action={{ label: 'Ver histórico', href: '/historico' }}
        />

        {!recentSessions || recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-background-secondary">
              <Dumbbell className="h-6 w-6 text-text-faint" />
            </div>
            <p className="text-sm font-medium text-text-faint">
              Nenhum treino registrado ainda
            </p>
            <p className="mt-1 text-xs text-text-faint">
              Comece registrando seu primeiro treino
            </p>
            <Link
              href="/registrar-treino"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-xs font-bold text-[#00ff88] transition-colors hover:bg-[#00ff88]/15"
            >
              <Zap className="h-3.5 w-3.5" />
              Registrar treino
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session, idx) => {
              // Access the joined workout_days name safely
              const workoutDay = session.workout_days as unknown as { name: string } | null
              const sessionName = workoutDay?.name ?? 'Treino'

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-background-secondary px-4 py-3.5 transition-colors hover:border-border"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Icon */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#00ff88]/15 bg-[#00ff88]/8">
                    <Dumbbell className="h-4 w-4 text-[#00ff88]" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-text-title">
                      {sessionName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(session.session_date, "EEEE, dd 'de' MMMM")}
                    </p>
                  </div>

                  {/* Date chip */}
                  <div className="flex-shrink-0 rounded-lg border border-border-subtle bg-background px-2.5 py-1">
                    <span className="text-xs tabular-nums text-text-faint">
                      {formatDate(session.session_date, 'dd/MM')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── AI Score teaser ── */}
      {latestAiReport && (
        <section>
          <SectionHeading
            title="Análise IA"
            action={{ label: 'Ver análise completa', href: '/analise-ia' }}
          />
          <div className="rounded-2xl border border-[#ffaa00]/20 bg-gradient-to-br from-[#ffaa00]/5 to-[#111111] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#ffaa00]/20 bg-[#ffaa00]/10">
                <Brain className="h-6 w-6 text-[#ffaa00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    className="text-3xl font-black text-[#ffaa00] tabular-nums"
                    style={{ fontFamily: 'var(--font-orbitron), monospace' }}
                  >
                    {Math.round(latestAiReport.score_overall ?? 0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-title">Score Geral</p>
                    <p className="text-xs text-text-muted">
                      Última análise: {formatDate(latestAiReport.generated_at, "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>

                {/* Sub-scores */}
                {(latestAiReport.score_training != null || latestAiReport.score_diet != null) && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'Treino', value: latestAiReport.score_training, icon: Dumbbell },
                      { label: 'Dieta', value: latestAiReport.score_diet, icon: Utensils },
                    ]
                      .filter((s) => s.value != null)
                      .map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-2 rounded-xl border border-border-subtle bg-background px-3 py-2"
                        >
                          <s.icon className="h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
                          <div>
                            <p className="text-[10px] text-text-faint">{s.label}</p>
                            <p className="text-sm font-bold text-text-title tabular-nums">
                              {Math.round(s.value!)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
