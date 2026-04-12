'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNavItems = [
  { href: '/admin/usuarios',  label: 'Usuários',             match: '/admin/usuarios'  },
  { href: '/admin/perfis',    label: 'Perfis & Permissões',  match: '/admin/perfis'    },
  { href: '/admin/logs',      label: 'Logs de Auditoria',    match: '/admin/logs'      },
]

export default function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-stretch gap-0 -mb-px overflow-x-auto no-scrollbar">
      {adminNavItems.map((item) => {
        const isActive = pathname.startsWith(item.match)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'relative flex items-center px-5 py-3 text-sm font-medium whitespace-nowrap',
              'border-b-2 transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]',
              isActive
                ? 'text-[#00ff88] border-[#00ff88]'
                : 'text-[#888] border-transparent hover:text-white hover:border-[#333]',
            ].join(' ')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
