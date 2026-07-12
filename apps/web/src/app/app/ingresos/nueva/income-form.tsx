'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { calculateSvPayrollDeductions } from '@flowfinance/shared/utils';
import { createIncomeAction } from '@/lib/income/actions';

const INCOME_TYPES = [
  { value: 'salary', label: 'Ingreso laboral' },
  { value: 'freelance', label: 'Freelance / Proyectos' },
  { value: 'rental', label: 'Renta de inmuebles' },
  { value: 'investment_yield', label: 'Rendimientos / Inversiones' },
  { value: 'loan_payment', label: 'Abono de préstamo' },
  { value: 'business', label: 'Negocio propio' },
  { value: 'eventual', label: 'Eventual' },
  { value: 'other', label: 'Otro' },
];

interface Currency {
  code: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

export function IncomeForm({
  currencies,
  accounts,
  error,
}: {
  currencies: Currency[];
  accounts: Account[];
  error?: string;
}) {
  const [type, setType] = useState('salary');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [deductionsTotal, setDeductionsTotal] = useState(0);
  const [deductionsPreview, setDeductionsPreview] = useState<{
    isss: number;
    afp: number;
    isr: number;
  } | null>(null);
  const [isCollected, setIsCollected] = useState(true);

  function handleCalculateSv() {
    const gross = Number(grossAmount);
    if (!gross || gross <= 0) return;
    const result = calculateSvPayrollDeductions(gross);
    setNetAmount(result.netAmount.toFixed(2));
    setDeductionsTotal(result.totalDeductions);
    setDeductionsPreview({ isss: result.isss, afp: result.afp, isr: result.isr });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo ingreso</CardTitle>
        <CardDescription>Registra un ingreso — laboral, freelance u otro</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={createIncomeAction} className="space-y-4">
          <input type="hidden" name="deductions_total" value={deductionsTotal} />

          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo de ingreso</Label>
            <select
              id="type"
              name="type"
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {INCOME_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source_name">Fuente</Label>
            <Input id="source_name" name="source_name" required placeholder="Empresa X / Cliente Y" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gross_amount">Monto bruto</Label>
              <Input
                id="gross_amount"
                name="gross_amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="net_amount">Monto neto</Label>
              <Input
                id="net_amount"
                name="net_amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={netAmount}
                onChange={(e) => setNetAmount(e.target.value)}
              />
            </div>
          </div>

          {type === 'salary' && (
            <div className="space-y-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCalculateSv}>
                Calcular deducciones SV (ISSS + AFP + ISR)
              </Button>
              {deductionsPreview && (
                <p className="text-xs text-muted-foreground">
                  ISSS: ${deductionsPreview.isss.toFixed(2)} · AFP: ${deductionsPreview.afp.toFixed(2)} ·
                  ISR: ${deductionsPreview.isr.toFixed(2)} · Total: ${deductionsTotal.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                name="currency"
                required
                defaultValue="USD"
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="income_date">Fecha</Label>
              <Input
                id="income_date"
                name="income_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account_id">Cuenta destino</Label>
            <select
              id="account_id"
              name="account_id"
              required
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
            {accounts.length === 0 && (
              <p className="text-xs text-ff-red">
                No tienes cuentas activas. Crea una primero en Cuentas.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_collected"
              name="is_collected"
              type="checkbox"
              checked={isCollected}
              onChange={(e) => setIsCollected(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="is_collected" className="cursor-pointer font-normal">
              Ya lo cobré
            </Label>
          </div>

          {!isCollected && (
            <div className="space-y-1.5">
              <Label htmlFor="expected_date">Fecha esperada de cobro</Label>
              <Input id="expected_date" name="expected_date" type="date" required />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Notas adicionales" />
          </div>

          <Button type="submit" className="w-full" disabled={accounts.length === 0}>
            Guardar ingreso
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
