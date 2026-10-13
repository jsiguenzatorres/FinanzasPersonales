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
  ChartCandlestick,
  BadgePercent,
  TrendingDown,
  CalendarClock,
  Plane,
  Bot,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@flowfinance/ui';
import { signOutAction } from '@/lib/auth/actions';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '/app', label: 'Inicio', icon: Home },
  { href: '/app/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/app/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/app/gastos', label: 'Gastos', icon: Receipt },
  { href: '/app/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/app/prestamos', label: 'Préstamos', icon: HandCoins },
  { href: '/app/mi-cartera', label: 'Mi Cartera', icon: BadgePercent },
  { href: '/app/deudas', label: 'Deudas', icon: TrendingDown },
  { href: '/app/metas', label: 'Metas', icon: PiggyBank },
  { href: '/app/suscripciones', label: 'Suscripciones', icon: Repeat },
  { href: '/app/inversiones', label: 'Inversiones', icon: ChartCandlestick },
  { href: '/app/patrimonio', label: 'Patrimonio', icon: LineChart },
  { href: '/app/calendario', label: 'Calendario', icon: CalendarClock },
  { href: '/app/viajes', label: 'Viajes', icon: Plane },
  { href: '/app/presupuesto', label: 'Presupuesto', icon: Target },
  { href: '/app/finn', label: 'Neto', icon: Bot },
];

const BOTTOM_NAV_HREFS = ['/app', '/app/gastos', '/app/cuentas', '/app/tarjetas'];

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
                'group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all duration-150 active:scale-[0.97]',
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

function ProfileLink({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith('/app/perfil');

  return (
    <Link
      href="/app/perfil"
      onClick={onNavigate}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 active:scale-[0.98]',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <User className="h-[18px] w-[18px] flex-shrink-0" />
      {!collapsed && <span>Perfil</span>}
    </Link>
  );
}

function AdminLink({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith('/app/admin');

  return (
    <Link
      href="/app/admin"
      onClick={onNavigate}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 active:scale-[0.98]',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <ShieldCheck className="h-[18px] w-[18px] flex-shrink-0" />
      {!collapsed && <span>Administración</span>}
    </Link>
  );
}

function LogoutButton({ collapsed }: { collapsed?: boolean }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
      >
        <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </form>
  );
}

function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const bottomItems = NAV_ITEMS.filter((item) => BOTTOM_NAV_HREFS.includes(item.href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/90 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {bottomItems.map((item) => {
        const active = isItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors duration-150 active:scale-95"
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill-bottom"
                className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon
              className={cn(
                'h-5 w-5 transition-transform duration-200',
                active ? 'scale-110 text-primary' : 'text-muted-foreground',
              )}
            />
            <span className={cn('font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
              {item.label}
            </span>
          </Link>
        );
      })}
      <button
        onClick={onMore}
        className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground transition-transform duration-150 active:scale-95"
      >
        <Menu className="h-5 w-5" />
        <span className="font-medium">Más</span>
      </button>
    </nav>
  );
}

export function AppNav({ isSuperadmin = false }: { isSuperadmin?: boolean }) {
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
          className="rounded-lg p-2 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-90"
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
                  className="rounded-lg p-1.5 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-90"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks collapsed={false} pillId="nav-active-pill-mobile" onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="mt-3 space-y-1 border-t border-border pt-3">
                {isSuperadmin && <AdminLink onNavigate={() => setMobileOpen(false)} />}
                <ProfileLink onNavigate={() => setMobileOpen(false)} />
                <ThemeToggle />
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
            className="rounded-lg p-1.5 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-90"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <NavLinks collapsed={collapsed} pillId="nav-active-pill-desktop" />
        </nav>

        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {isSuperadmin && <AdminLink collapsed={collapsed} />}
          <ProfileLink collapsed={collapsed} />
          <ThemeToggle collapsed={collapsed} />
          <LogoutButton collapsed={collapsed} />
        </div>
      </motion.aside>

      {/* ── Barra inferior móvil ────────────────────────────────────── */}
      <BottomNav onMore={() => setMobileOpen(true)} />
    </>
  );
}
