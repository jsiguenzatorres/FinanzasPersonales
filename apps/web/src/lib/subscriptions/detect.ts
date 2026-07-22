'use server';

import { createFinnClient } from '@flowfinance/finn/client';
import { buildDetectSubscriptionPrompt, subscriptionDetectionSchema } from '@flowfinance/finn/prompts';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { advanceByFrequency } from '@flowfinance/shared/utils';
import type { RecurrenceFreq } from '@flowfinance/shared/schemas';

export interface SubscriptionSuggestion {
  merchant_name: string;
  service_name: string;
  frequency: RecurrenceFreq;
  amount: number;
  currency: string;
  next_charge_date: string;
  confidence: number;
  card_id: string | null;
  account_id: string | null;
}

interface CandidateGroup {
  merchant_name: string;
  amounts: number[];
  dates: string[];
  currency: string;
  avgIntervalDays: number;
  card_id: string | null;
  account_id: string | null;
}

const AMOUNT_TOLERANCE_PCT = 0.1;

/**
 * Filtro determinístico (§2.1 de docs/modules/mod-06-suscripciones.md) —
 * agrupa transacciones de gasto por comercio, se queda con grupos de 2+
 * cargos con monto consistente e intervalo razonablemente regular.
 */
function findCandidateGroups(
  transactions: Array<{
    merchant_name: string | null;
    amount: number;
    currency: string;
    transaction_date: string;
    card_id: string | null;
    account_id: string | null;
  }>,
): CandidateGroup[] {
  const byMerchant = new Map<string, typeof transactions>();

  for (const tx of transactions) {
    if (!tx.merchant_name) continue;
    const key = tx.merchant_name.trim().toLowerCase();
    if (!key) continue;
    (byMerchant.get(key) ?? byMerchant.set(key, []).get(key)!).push(tx);
  }

  const groups: CandidateGroup[] = [];

  for (const [, txs] of byMerchant) {
    if (txs.length < 2) continue;

    const sorted = [...txs].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    const amounts = sorted.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const isConsistent = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount <= AMOUNT_TOLERANCE_PCT);
    if (!isConsistent) continue;

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]!.transaction_date).getTime();
      const curr = new Date(sorted[i]!.transaction_date).getTime();
      intervals.push((curr - prev) / (1000 * 60 * 60 * 24));
    }
    const avgIntervalDays = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Descarta intervalos absurdos (mismo día repetido, o más de un año) —
    // no es un patrón de suscripción reconocible.
    if (avgIntervalDays < 3 || avgIntervalDays > 400) continue;

    groups.push({
      merchant_name: sorted[0]!.merchant_name!,
      amounts,
      dates: sorted.map((t) => t.transaction_date),
      currency: sorted[0]!.currency,
      avgIntervalDays,
      card_id: sorted[sorted.length - 1]!.card_id,
      account_id: sorted[sorted.length - 1]!.account_id,
    });
  }

  return groups;
}

/**
 * Analiza los gastos de los últimos 4 meses y devuelve sugerencias de
 * suscripciones a confirmar — nada se guarda todavía (§2.3 del módulo).
 * No persiste resultados: si el usuario recarga la página sin confirmar,
 * simplemente vuelve a analizar.
 */
export async function analyzeSubscriptionsAction(): Promise<SubscriptionSuggestion[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

  const [{ data: transactions }, { data: existingSubs }] = await Promise.all([
    supabase
      .from('transactions')
      .select('merchant_name, amount, currency, transaction_date, card_id, account_id')
      .eq('user_id', user.id)
      .in('kind', ['expense', 'cc_charge'])
      .is('deleted_at', null)
      .gte('transaction_date', fourMonthsAgo.toISOString().slice(0, 10)),
    supabase.from('subscriptions').select('service_name'),
  ]);

  if (!transactions || transactions.length === 0) return [];

  const existingNames = new Set((existingSubs ?? []).map((s) => s.service_name.toLowerCase()));
  const candidates = findCandidateGroups(transactions).filter(
    (g) => !existingNames.has(g.merchant_name.toLowerCase()),
  );

  if (candidates.length === 0) return [];

  const client = createFinnClient({
    apiKey: process.env.GEMINI_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  });

  const results = await Promise.all(
    candidates.map(async (group) => {
      try {
        const prompt = buildDetectSubscriptionPrompt({
          merchant_name: group.merchant_name,
          amounts: group.amounts,
          dates: group.dates,
          currency: group.currency,
          avg_interval_days: group.avgIntervalDays,
        });
        const raw = await client.classifyJson<unknown>(prompt);
        const parsed = subscriptionDetectionSchema.safeParse(raw);
        if (!parsed.success || !parsed.data.is_subscription) return null;

        const lastDate = group.dates[group.dates.length - 1]!;
        const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;

        const suggestion: SubscriptionSuggestion = {
          merchant_name: group.merchant_name,
          service_name: parsed.data.service_name,
          frequency: parsed.data.frequency,
          amount: Math.round(avgAmount * 100) / 100,
          currency: group.currency,
          next_charge_date: advanceByFrequency(lastDate, parsed.data.frequency),
          confidence: parsed.data.confidence,
          card_id: group.card_id,
          account_id: group.account_id,
        };
        return suggestion;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((r): r is SubscriptionSuggestion => r !== null);
}
