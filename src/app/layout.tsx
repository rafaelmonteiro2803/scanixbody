import type { Metadata, Viewport } from 'next'
import { Inter, Rajdhani } from 'next/font/google'
import '@/styles/globals.css'

// ── Font definitions ──────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'SCANIX BODY — Performance Intelligence',
    template: '%s | SCANIX BODY',
  },
  description:
    'SCANIX BODY — Inteligência de performance para atletas. Monitoramento avançado de treino, composição corporal, dieta e análise por IA.',
  keywords: [
    'fitness',
    'performance',
    'treino',
    'composição corporal',
    'dieta',
    'análise IA',
    'atleta',
    'SCANIX',
  ],
  authors: [{ name: 'SCANIX BODY' }],
  creator: 'SCANIX BODY',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${inter.variable} ${rajdhani.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect for Google Fonts (loaded via globals.css @import) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-background text-text-primary antialiased min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
