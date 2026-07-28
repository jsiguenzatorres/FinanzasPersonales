'use client';

import { useMemo, useState } from 'react';
import { Button, Card, CardContent, Input, Label } from '@flowfinance/ui';
import { simulateDebtPayoff, type DebtPayoffInput } from '@flowfinance/shared/utils';
import { confirmDebtStrategyAction } from '@/lib/debts/strategy';

interface DebtForSimulator extends DebtPayoffInput {
  name: string;
  currency: string;
}

export function StrategySimulator({ debts }: { debts: DebtForSimulator[] }) {
  const [extra, setExtra] = useState('0');
  const extraMonthly = Number(extra) || 0;

  const avalanche = useMemo(() => simulateDebtPayoff(debts, extraMonthly, 'avalanche'), [debts, extraMonthly]);
  const snowball = useMemo(() => simulateDebtPayoff(debts, extraMonthly, 'snowball'), [debts, extraMonthly]);

  const nameById = new Map(debts.map((d) => [d.id, d.name]));
  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(n);

  function renderResult(label: string, result: ReturnType<typeof simulateDebtPayoff>, strategy: 'avalanche' | 'snowball') {
    return (
      <Card>
        <CardContent className="space-y-3 py-5">
          <p className="font-medium">{label}</p>
          {result.months_to_freedom === null ? (
            <p className="text-sm text-ff-red">
              Con este monto extra, el pago mínimo no alcanza a cubrir ni el interés de alguna deuda —
              aumenta el extra mensual.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Libre de deudas en <span className="font-mono text-ff-green">{result.months_to_freedom} meses</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Interés total pagado: <span className="font-mono text-ff-red">{fmt(result.total_interest_paid)}</span>
              </p>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Orden de ataque:</p>
                <ol className="list-inside list-decimal text-xs text-muted-foreground">
                  {result.order.map((id) => (
                    <li key={id}>{nameById.get(id)}</li>
                  ))}
                </ol>
              </div>
              <form action={confirmDebtStrategyAction}>
                <input type="hidden" name="strategy" value={strategy} />
                <input type="hidden" name="order" value={result.order.join(',')} />
                <Button type="submit" size="sm" className="w-full">
                  Confirmar esta estrategia
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-1.5 py-5">
          <Label htmlFor="extra">¿Cuánto extra puedes destinar cada mes a pagar deuda más rápido?</Label>
          <Input
            id="extra"
            type="number"
            step="0.01"
            min="0"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="0"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {renderResult('Avalancha — tasa más alta primero', avalanche, 'avalanche')}
        {renderResult('Bola de nieve — saldo más pequeño primero', snowball, 'snowball')}
      </div>
    </div>
  );
}
