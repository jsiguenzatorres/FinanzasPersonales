'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { analyzeSubscriptionsAction, type SubscriptionSuggestion } from '@/lib/subscriptions/detect';
import { createSubscriptionAction } from '@/lib/subscriptions/actions';

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export function SubscriptionScanner() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [suggestions, setSuggestions] = useState<SubscriptionSuggestion[]>([]);

  async function handleAnalyze() {
    setStatus('loading');
    const results = await analyzeSubscriptionsAction();
    setSuggestions(results);
    setStatus('done');
  }

  function dismiss(merchantName: string) {
    setSuggestions((prev) => prev.filter((s) => s.merchant_name !== merchantName));
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={handleAnalyze} disabled={status === 'loading'}>
        {status === 'loading' ? 'Analizando tus gastos...' : '🔍 Analizar mis gastos'}
      </Button>

      {status === 'done' && suggestions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No encontré cargos recurrentes nuevos en tus últimos 4 meses de gastos.
        </p>
      )}

      {suggestions.map((s) => (
        <Card key={s.merchant_name}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{s.service_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: s.currency }).format(s.amount)} ·{' '}
                {FREQ_LABELS[s.frequency] ?? s.frequency} · detectado en &quot;{s.merchant_name}&quot; · confianza{' '}
                {Math.round(s.confidence * 100)}%
              </p>
            </div>
            <div className="flex gap-2">
              <form action={createSubscriptionAction}>
                <input type="hidden" name="service_name" value={s.service_name} />
                <input type="hidden" name="amount" value={s.amount} />
                <input type="hidden" name="currency" value={s.currency} />
                <input type="hidden" name="frequency" value={s.frequency} />
                <input type="hidden" name="next_charge_date" value={s.next_charge_date} />
                <input type="hidden" name="start_date" value={s.next_charge_date} />
                <input type="hidden" name="detected_automatically" value="true" />
                {s.card_id && <input type="hidden" name="card_id" value={s.card_id} />}
                {s.account_id && <input type="hidden" name="account_id" value={s.account_id} />}
                <Button type="submit" size="sm">
                  Confirmar
                </Button>
              </form>
              <Button type="button" variant="ghost" size="sm" onClick={() => dismiss(s.merchant_name)}>
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
