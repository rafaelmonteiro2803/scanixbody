'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-border pb-0 -mb-6">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
              'transition-colors duration-150',
              isActive
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
