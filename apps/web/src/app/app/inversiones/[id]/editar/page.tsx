import { notFound } from 'next/navigation';
import { InvestmentForm } from '../../nueva/investment-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditInvestmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: inv } = await supabase.from('investments').select('*').eq('id', id).single();
  if (!inv) notFound();

  const metadata = inv.metadata as { coingecko_id?: string } | null;

  return (
    <div className="mx-auto max-w-lg">
      <InvestmentForm
        error={error}
        initialValues={{
          id: inv.id,
          name: inv.name,
          ticker: inv.ticker ?? '',
          type: inv.type,
          broker: inv.broker ?? '',
          currency: inv.currency,
          quantity: String(inv.quantity),
          avg_cost: String(inv.avg_cost),
          current_price: inv.current_price ? String(inv.current_price) : '',
          coingecko_id: metadata?.coingecko_id ?? '',
          notes: inv.notes ?? '',
          is_active: inv.is_active,
        }}
      />
    </div>
  );
}
