import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-landing-ink/10 bg-landing-paper py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <Link href="/" className="font-display text-base text-landing-ink">
          Flow<span className="text-landing-terracotta">Finance</span>
        </Link>
        <p className="font-mono text-xs text-landing-ink-soft/70">
          © {new Date().getFullYear()} FlowFinance · Hecho en El Salvador 🇸🇻
        </p>
      </div>
    </footer>
  );
}
