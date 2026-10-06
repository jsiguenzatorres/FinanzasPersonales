import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

const TINTS = {
  green: { bg: 'bg-ff-green/10', icon: 'text-ff-green' },
  red: { bg: 'bg-ff-red/10', icon: 'text-ff-red' },
  yellow: { bg: 'bg-ff-yellow/10', icon: 'text-ff-yellow' },
  blue: { bg: 'bg-ff-blue/10', icon: 'text-ff-blue' },
} as const;

/** Tarjeta compacta del bento grid del dashboard — ícono + etiqueta + valor, con hover sutil. */
export function ModuleCard({
  href,
  icon: Icon,
  tint,
  label,
  value,
  valueClass,
}: {
  href: string;
  icon: LucideIcon;
  tint: keyof typeof TINTS;
  label: string;
  value: string;
  valueClass?: string;
}) {
  const t = TINTS[tint];
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-landing-terracotta hover:bg-landing-terracotta/5 active:scale-[0.98] active:translate-y-0"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${t.bg}`}>
        <Icon className={`h-4 w-4 ${t.icon}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`truncate font-mono text-sm ${valueClass ?? ''}`}>{value}</p>
      </div>
    </Link>
  );
}
