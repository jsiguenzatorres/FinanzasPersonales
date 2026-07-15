import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { FinnSpotlight } from '@/components/marketing/finn-spotlight';
import { LoansSpotlight } from '@/components/marketing/loans-spotlight';
import { Pricing } from '@/components/marketing/pricing';
import { Security } from '@/components/marketing/security';
import { FinalCta } from '@/components/marketing/final-cta';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/app');
  }

  return (
    <main className="overflow-x-clip bg-landing-cream text-landing-ink">
      <MarketingNav />
      <Hero />
      <Features />
      <FinnSpotlight />
      <LoansSpotlight />
      <Pricing />
      <Security />
      <FinalCta />
      <MarketingFooter />
    </main>
  );
}
