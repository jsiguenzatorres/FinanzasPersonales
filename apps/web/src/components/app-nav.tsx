'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@flowfinance/ui';

const NAV_ITEMS = [
  { href: '/app', label: 'Inicio' },
  { href: '/app/cuentas', label: 'Cuentas' },
  { href: '/app/ingresos', label: 'Ingresos' },
  { href: '/app/gastos', label: 'Gastos' },
  { href: '/app/tarjetas', label: 'Tarjetas' },
  { href: '/app/prestamos', label: 'Préstamos' },
  { href: '/app/patrimonio', label: 'Patrimonio' },
  { href: '/app/presupuesto', label: 'Presupuesto' },
  { href: '/app/finn', label: '🤖 FINN' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-primary/10 text-ff-green font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
