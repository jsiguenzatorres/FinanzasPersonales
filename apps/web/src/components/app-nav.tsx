'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Wallet,
  TrendingUp,
  Receipt,
  CreditCard,
  HandCoins,
  LineChart,
  Target,
  PiggyBank,
  Repeat,
  Bot,
  ChevronLeft,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@flowfinance/ui';
import { signOutAction } from '@/lib/auth/actions';

const NAV_ITEMS = [
  { href: '/app', label: 'Inicio', icon: Home },
  { href: '/app/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/app/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/app/gastos', label: 'Gastos', icon: Receipt },
  { href: '/app/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/app/prestamos', label: 'Préstamos', icon: HandCoins },
  { href: '/app/metas', label: 'Metas', icon: PiggyBank },
  { href: '/app/suscripciones', label: 'Suscripciones', icon: Repeat },
  { href: '/app/patrimonio', label: 'Patrimonio', icon: LineChart },
  { href: '/app/presupuesto', label: 'Presupuesto', icon: Target },
  { href: '/app/finn', label: 'Neto', icon: Bot },
];

function isItemActive(pathname: string, href: string): boolean {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href);
}

function NavLinks({
  collapsed,
  pillId,
  onNavigate,
}: {
  collapsed: boolean;
  pillId: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item, i) => {
        const active = isItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <motion.li
            key={item.href}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-colors',
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId={pillId}
                  className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {!active && (
                <span className="absolute inset-0 rounded-xl bg-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              )}
              <Icon
                className={cn(
                  'relative z-10 h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
                  active && 'scale-105',
                )}
              />
              <span
                className={cn(
                  'relative z-10 truncate font-medium transition-[opacity,margin] duration-200',
                  collapsed && 'lg:-ml-3 lg:opacity-0',
                )}
              >
                {item.label}
              </span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function LogoutButton({ collapsed }: { collapsed?: boolean }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </form>
  );
}

export function AppNav() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Barra móvil ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/app" className="font-display text-lg">
          Flow<span className="text-primary">Finance</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Drawer móvil ────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card p-3 shadow-2xl lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between px-1 pt-1">
                <span className="font-display text-lg">
                  Flow<span className="text-primary">Finance</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks collapsed={false} pillId="nav-active-pill-mobile" onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <LogoutButton />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Sidebar de escritorio ───────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-border bg-card/50 p-3 lg:flex"
      >
        <div className={cn('mb-6 flex items-center pt-1', collapsed ? 'justify-center' : 'justify-between px-1')}>
          {!collapsed && (
            <Link href="/app" className="font-display text-lg">
              Flow<span className="text-primary">Finance</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <NavLinks collapsed={collapsed} pillId="nav-active-pill-desktop" />
        </nav>

        <div className="mt-3 border-t border-border pt-3">
          <LogoutButton collapsed={collapsed} />
        </div>
      </motion.aside>
    </>
  );
}
