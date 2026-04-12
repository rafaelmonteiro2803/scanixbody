import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Acesso | SCANIX BODY',
    template: '%s | SCANIX BODY',
  },
}

// ── Auth Layout ───────────────────────────────────────────────────────────────

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 py-12">

      {/* Background radial glow — subtle green pulse */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        {/* Top-left ambient */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#00ff88] opacity-[0.04] blur-[120px]" />
        {/* Bottom-right ambient */}
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#00d4ff] opacity-[0.04] blur-[100px]" />
        {/* Scanline texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)',
          }}
        />
      </div>

      {/* Logo lockup */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
        {/* Icon mark */}
        <div className="relative mb-1 flex h-14 w-14 items-center justify-center rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path
              d="M16 3L4 9v14l12 6 12-6V9L16 3z"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M16 3v20M4 9l12 6 12-6"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="16" r="3" fill="#00ff88" opacity="0.8" />
          </svg>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-xl bg-[#00ff88] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20" />
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <h1
            className="font-heading text-2xl font-black uppercase tracking-[0.2em] text-white"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          >
            SCANIX{' '}
            <span className="text-[#00ff88]" style={{ textShadow: '0 0 12px rgba(0,255,136,0.5)' }}>
              BODY
            </span>
          </h1>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.25em] text-[#666666]">
            Performance Intelligence
          </p>
        </div>
      </div>

      {/* Page content (login card, etc.) */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-10 text-center">
        <p className="text-xs text-[#444444]">
          &copy; {new Date().getFullYear()} SCANIX BODY — Todos os direitos reservados
        </p>
      </footer>
    </div>
  )
}
