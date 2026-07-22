'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Actualiza el precio de una inversión tipo crypto vía la API pública y
 * gratuita de CoinGecko — sin API key (§2 de docs/modules/mod-07-inversiones.md).
 * Requiere que la inversión tenga metadata.coingecko_id guardado.
 */
export async function updateCryptoPriceAction(formData: FormData) {
  const investmentId = formData.get('investment_id');
  if (typeof investmentId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  const { data: investment } = await supabase
    .from('investments')
    .select('metadata, currency')
    .eq('id', investmentId)
    .single();

  const coingeckoId = (investment?.metadata as { coingecko_id?: string } | null)?.coingecko_id;

  if (!coingeckoId) {
    redirect(`/app/inversiones/${investmentId}?error=` + encodeURIComponent('Esta inversión no tiene un id de CoinGecko configurado.'));
  }

  const vsCurrency = (investment?.currency ?? 'USD').toLowerCase();

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=${vsCurrency}`,
      { cache: 'no-store' },
    );

    if (!res.ok) {
      redirect(`/app/inversiones/${investmentId}?error=` + encodeURIComponent('CoinGecko no respondió. Intenta de nuevo.'));
    }

    const data = (await res.json()) as Record<string, Record<string, number>>;
    const price = data[coingeckoId]?.[vsCurrency];

    if (typeof price !== 'number') {
      redirect(`/app/inversiones/${investmentId}?error=` + encodeURIComponent('No se encontró el precio en CoinGecko.'));
    }

    await supabase
      .from('investments')
      .update({ current_price: price, last_price_update_at: new Date().toISOString() })
      .eq('id', investmentId);
  } catch {
    redirect(`/app/inversiones/${investmentId}?error=` + encodeURIComponent('No se pudo conectar con CoinGecko.'));
  }

  revalidatePath('/app/inversiones');
  revalidatePath(`/app/inversiones/${investmentId}`);
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect(`/app/inversiones/${investmentId}`);
}
